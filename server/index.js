// Flowin server: proxy de IA + (opcional) sirve el build estático.
// - Desbloquea ChatGPT (OpenAI no permite llamadas directas del navegador / CORS).
// - Permite guardar las API keys en el servidor (.env) en vez del cliente.
// - Si existe ../dist, sirve la PWA buildeada en el mismo origen (deploy todo-en-uno).
//
// Endurecimiento (ver server/.env.example):
//   ALLOWED_ORIGINS  allowlist de orígenes (coma-sep). Vacío = abierto + warning.
//   APP_TOKEN        si está, exige header x-flowin-token en /api/ai.
//   *_API_KEY        keys por proveedor como fallback si el cliente no manda la suya.
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const __dir = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const TIMEOUT_MS = 30_000;

// Monitoreo (Sentry) opcional, env-gated.
let Sentry = null;
if (process.env.SENTRY_DSN) {
  Sentry = await import("@sentry/node");
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  console.log("Sentry activo en el server");
}

const ENV_KEY = {
  gemini: "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY"
};

const ALLOWED = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const APP_TOKEN = (process.env.APP_TOKEN || "").trim();

const app = express();
app.disable("x-powered-by");

// CORS: si hay allowlist, se respeta; si no, abierto (con warning al arrancar).
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / apps nativas / same-origin
      if (ALLOWED.length === 0) return cb(null, true); // modo abierto
      return cb(null, ALLOWED.includes(origin));
    }
  })
);
app.use(express.json({ limit: "512kb" }));

// Rate limit simple en memoria: por IP, ventana deslizante.
const RL_WINDOW = 60_000;
const RL_MAX = 30;
const hits = new Map(); // ip -> number[] (timestamps)
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RL_WINDOW);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear(); // poda defensiva
  return arr.length > RL_MAX;
}

// Quita cualquier cosa que parezca una API key de los mensajes de error.
function sanitize(msg) {
  return String(msg || "")
    .replace(/sk-[A-Za-z0-9_-]{3,}/g, "sk-***")
    .replace(/AIza[A-Za-z0-9_-]{3,}/g, "AIza***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .slice(0, 300);
}

function fail(status, message) {
  return Object.assign(new Error(message), { status });
}

async function fetchProvider(url, init) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e?.name === "AbortError")
      throw fail(504, "El proveedor tardó demasiado (timeout).");
    throw fail(502, "No se pudo contactar al proveedor.");
  } finally {
    clearTimeout(t);
  }
}

// ---- Llamadas a cada proveedor (server-to-server, sin límites de CORS) ----
async function callGemini({ model, system, user, key }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;
  const r = await fetchProvider(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(r.status, data?.error?.message || `gemini ${r.status}`);
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw fail(502, "Gemini no devolvió texto.");
  return text.trim();
}

async function callAnthropic({ model, system, user, key }) {
  const r = await fetchProvider("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(r.status, data?.error?.message || `anthropic ${r.status}`);
  const text =
    data?.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("") ?? "";
  if (!text.trim()) throw fail(502, "Claude no devolvió texto.");
  return text.trim();
}

async function callOpenAI({ model, system, user, key }) {
  const r = await fetchProvider("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.6
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(r.status, data?.error?.message || `openai ${r.status}`);
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw fail(502, "ChatGPT no devolvió texto.");
  return text.trim();
}

const CALLERS = { gemini: callGemini, anthropic: callAnthropic, openai: callOpenAI };

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/ai", async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || "?";
  if (rateLimited(ip))
    return res.status(429).json({ error: "Demasiadas solicitudes. Esperá un momento." });

  if (APP_TOKEN && req.get("x-flowin-token") !== APP_TOKEN)
    return res.status(401).json({ error: "Token del servidor inválido o ausente." });

  const { provider, model, system, user, apiKey } = req.body || {};
  const caller = CALLERS[provider];
  if (!caller || !model || !user)
    return res.status(400).json({ error: "Faltan campos (provider, model, user)." });

  // Key: la que manda el cliente, o la del .env del server como fallback.
  const key = (apiKey && String(apiKey).trim()) || process.env[ENV_KEY[provider]] || "";
  if (!key) return res.status(401).json({ error: `Falta API key para ${provider}.` });

  try {
    const text = await caller({ model, system: system || "", user, key });
    res.json({ text });
  } catch (e) {
    if (Sentry && (!e?.status || e.status >= 500)) Sentry.captureException(e);
    res.status(e?.status || 502).json({ error: sanitize(e?.message || e) });
  }
});

// Servir la PWA buildeada si existe (deploy todo-en-uno, mismo origen → sin CORS).
const dist = join(__dir, "..", "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  // SPA fallback (HashRouter): cualquier ruta no-API devuelve index.html.
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/"))
      return res.sendFile(join(dist, "index.html"));
    next();
  });
  console.log("Sirviendo build estático desde /dist");
}

app.listen(PORT, () => {
  console.log(`Flowin server escuchando en http://localhost:${PORT}`);
  if (ALLOWED.length === 0)
    console.warn(
      "⚠ CORS abierto (cualquier origen). En producción configurá ALLOWED_ORIGINS y/o APP_TOKEN."
    );
});
