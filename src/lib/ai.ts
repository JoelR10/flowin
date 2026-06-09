import { snapshotAll, snapshotById, type CoachSnapshot } from "./coachData";

// Servicio de IA multi-proveedor. El usuario elige Gemini (gratis), Claude
// (Anthropic) o ChatGPT (OpenAI) y pega SU propia API key, guardada solo en
// este dispositivo. Llamada directa desde el navegador (los 3 permiten CORS;
// Anthropic requiere el header anthropic-dangerous-direct-browser-access).
// Off por defecto. Sin backend, sin keys en el repo.

export type Provider = "gemini" | "anthropic" | "openai";

export type AIConfig = {
  enabled: boolean;
  provider: Provider;
  keys: Record<Provider, string>;
  models: Record<Provider, string>;
  proxyUrl: string; // endpoint del server proxy (ChatGPT lo necesita por CORS)
  proxyToken: string; // opcional: x-flowin-token si el server tiene APP_TOKEN
};

export type ProviderInfo = {
  id: Provider;
  label: string;
  short: string; // nombre corto para el selector
  keyUrl: string;
  keyHint: string;
  free: boolean;
  needsServer: boolean;
  tagline: string; // 1 línea: para quién conviene
  steps: string[]; // guía paso a paso (PC y móvil)
};

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "gemini",
    short: "Gemini",
    label: "Gemini (Google)",
    keyUrl: "https://aistudio.google.com/apikey",
    keyHint: "Conseguir clave gratis en Google AI Studio",
    free: true,
    needsServer: false,
    tagline: "La más fácil y gratis. Recomendada. Anda en PC y móvil sin servidor.",
    steps: [
      "Tocá “Conseguir clave gratis” (abre Google AI Studio).",
      "Iniciá sesión con tu cuenta de Google y tocá “Crear clave de API”.",
      "Copiá la clave, volvé a Flowin y pegala en el campo de abajo.",
      "Tocá “Probar conexión”. Si dice OK, ya está."
    ]
  },
  {
    id: "anthropic",
    short: "Claude",
    label: "Claude (Anthropic)",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyHint: "Tu API key de Anthropic (console.anthropic.com)",
    free: false,
    needsServer: false,
    tagline: "Respuestas de alta calidad. De pago (tu cuenta Anthropic). PC y móvil, sin servidor.",
    steps: [
      "Tocá el enlace de Anthropic (abre console.anthropic.com).",
      "Iniciá sesión y, si hace falta, cargá crédito en Billing.",
      "Andá a API Keys → “Create Key”, copiá la clave.",
      "Volvé a Flowin, pegala abajo y tocá “Probar conexión”."
    ]
  },
  {
    id: "openai",
    short: "ChatGPT",
    label: "ChatGPT (OpenAI)",
    keyUrl: "https://platform.openai.com/api-keys",
    keyHint: "Tu API key de OpenAI (platform.openai.com)",
    free: false,
    needsServer: true,
    tagline: "De pago. Necesita el servidor de Flowin corriendo (OpenAI bloquea el navegador).",
    steps: [
      "Asegurate de tener el servidor corriendo: en PC, “npm run server”; o uno desplegado.",
      "Tocá el enlace de OpenAI (abre platform.openai.com) → “Create new secret key”.",
      "Copiá la clave, volvé a Flowin y pegala abajo.",
      "Revisá que la “URL del servidor (proxy)” apunte a tu server y tocá “Probar conexión”.",
      "En móvil sin servidor desplegado, ChatGPT no anda: usá Gemini o Claude."
    ]
  }
];

export const MODELS: Record<Provider, { id: string; label: string }[]> = {
  gemini: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash — rápido y gratis" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — equilibrado" },
    { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite — el más rápido" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro — el más potente" }
  ],
  anthropic: [
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 — rápido y económico" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — equilibrado" },
    { id: "claude-opus-4-8", label: "Claude Opus 4.8 — el más potente" }
  ],
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini — rápido y económico" },
    { id: "gpt-4o", label: "GPT-4o — equilibrado" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { id: "gpt-4.1", label: "GPT-4.1 — el más potente" }
  ]
};

export const DEFAULT_AI: AIConfig = {
  enabled: false,
  provider: "gemini",
  keys: { gemini: "", anthropic: "", openai: "" },
  models: {
    gemini: "gemini-2.0-flash",
    anthropic: "claude-sonnet-4-6",
    openai: "gpt-4o-mini"
  },
  proxyUrl: "/api/ai",
  proxyToken: ""
};

const CFG_KEY = "flowin_ai_config";

export function getAIConfig(): AIConfig {
  try {
    const r = localStorage.getItem(CFG_KEY);
    if (r) {
      const p = JSON.parse(r);
      return {
        ...DEFAULT_AI,
        ...p,
        keys: { ...DEFAULT_AI.keys, ...(p.keys ?? {}) },
        models: { ...DEFAULT_AI.models, ...(p.models ?? {}) }
      };
    }
  } catch {
    /* noop */
  }
  return JSON.parse(JSON.stringify(DEFAULT_AI));
}

export function setAIConfig(cfg: AIConfig): void {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  } catch {
    /* noop */
  }
}

// Qué proveedores tiene el server con key propia (.env). Lo consulta el cliente
// para ofrecer IA "lista, sin pegar key". Cacheado en memoria.
let serverKeys: Record<Provider, boolean> = {
  gemini: false,
  anthropic: false,
  openai: false
};

function statusUrl(proxyUrl: string): string {
  return `${proxyUrl.replace(/\/$/, "")}/status`;
}

export async function refreshServerStatus(cfg = getAIConfig()): Promise<void> {
  const proxy = (cfg.proxyUrl ?? "").trim();
  if (!proxy) return;
  try {
    const headers: Record<string, string> = {};
    if (cfg.proxyToken) headers["x-flowin-token"] = cfg.proxyToken;
    const r = await fetch(statusUrl(proxy), { headers });
    if (r.ok) {
      const d = await r.json();
      if (d?.providers) serverKeys = { ...serverKeys, ...d.providers };
    }
  } catch {
    /* server no disponible → seguimos con keys del cliente */
  }
}

export function serverHasKey(p: Provider): boolean {
  return serverKeys[p];
}

export function aiReady(cfg = getAIConfig()): boolean {
  if (!cfg.enabled) return false;
  const proxy = (cfg.proxyUrl ?? "").trim();
  // El server tiene la key del proveedor → IA lista, sin key del usuario.
  if (serverKeys[cfg.provider] && proxy) return true;
  const hasClientKey = (cfg.keys[cfg.provider] ?? "").trim().length > 0;
  // ChatGPT necesita el proxy aunque el user tenga su key (OpenAI bloquea el navegador).
  if (cfg.provider === "openai") return hasClientKey && proxy.length > 0;
  return hasClientKey;
}

const SYSTEM = `Sos el coach personal de Flowin: directo, cálido y práctico. Hablás en español rioplatense, claro y sin vueltas.
Te paso datos reales del usuario tomados de uno o varios módulos (hábitos, metas, ventas, proyectos, contenido, aprendizaje, salud, decisiones, relaciones, gym, agenda, finanzas).
Tu trabajo:
1. **Diagnóstico** breve y honesto, apoyado en los números concretos del usuario.
2. **Lo más importante ahora**: el cuello de botella o la palanca principal.
3. **Plan de la semana**: 3 acciones chicas, concretas y medibles, priorizadas.
Reglas: usá los datos reales (citá cifras). No moralices ni rellenes. Para salud hablá de hábitos y recuperación, nunca des diagnósticos médicos; si ves señales serias, sugerí consultar a un profesional. Respondé en markdown con encabezados cortos (##) y listas. Máximo ~300 palabras.`;

// ---- Llamadas por proveedor ----

async function postJSON(
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<Response> {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("Sin conexión o el navegador bloqueó la llamada.");
  }
}

async function errorText(res: Response): Promise<string> {
  try {
    const e = await res.json();
    return e?.error?.message ?? e?.error?.type ?? "";
  } catch {
    return "";
  }
}

function mapStatus(provider: Provider, status: number, detail: string): Error {
  if (status === 401 || status === 403)
    return new Error("API key inválida o sin permisos. Revisala en Ajustes.");
  if (status === 429)
    return new Error("Llegaste al límite del proveedor por ahora. Probá en un rato.");
  if (status === 404)
    return new Error("El modelo elegido no está disponible con tu key. Elegí otro en Ajustes.");
  return new Error(`${provider} ${status}: ${detail || "error desconocido"}`);
}

async function callGemini(user: string, model: string, key: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await postJSON(url, {}, {
    system_instruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
  });
  if (!res.ok) throw mapStatus("gemini", res.status, await errorText(res));
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text.trim()) {
    if (data?.promptFeedback?.blockReason)
      throw new Error("Gemini bloqueó la respuesta por seguridad. Probá con menos datos.");
    throw new Error("El modelo no devolvió texto. Probá de nuevo u otro modelo.");
  }
  return text.trim();
}

async function callAnthropic(user: string, model: string, key: string): Promise<string> {
  const res = await postJSON(
    "https://api.anthropic.com/v1/messages",
    {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      // Habilita llamadas directas desde el navegador (CORS).
      "anthropic-dangerous-direct-browser-access": "true"
    },
    {
      model,
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: "user", content: user }]
    }
  );
  if (!res.ok) throw mapStatus("anthropic", res.status, await errorText(res));
  const data = await res.json();
  const text: string =
    data?.content
      ?.filter((b: { type?: string }) => b.type === "text")
      .map((b: { text?: string }) => b.text ?? "")
      .join("") ?? "";
  if (!text.trim()) throw new Error("Claude no devolvió texto. Probá de nuevo.");
  return text.trim();
}

// ChatGPT (y cualquier proveedor) vía el server proxy de Flowin.
// El server agrega la key (la del cliente o la de su .env) y llama al proveedor.
async function callProxy(
  user: string,
  provider: Provider,
  model: string,
  key: string,
  proxyUrl: string,
  token: string
): Promise<string> {
  let res: Response;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["x-flowin-token"] = token;
    res = await fetch(proxyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ provider, model, system: SYSTEM, user, apiKey: key })
    });
  } catch {
    throw new Error(
      "No se pudo contactar el servidor. Corré `npm run server` (o configurá la URL del proxy en Ajustes)."
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw mapStatus(provider, res.status, data?.error ?? "");
  if (!data?.text) throw new Error(data?.error || "El servidor no devolvió texto.");
  return data.text as string;
}

async function call(user: string, cfg: AIConfig): Promise<string> {
  const provider = cfg.provider;
  const key = (cfg.keys[provider] ?? "").trim();
  const model = cfg.models[provider];
  const proxy = (cfg.proxyUrl ?? "").trim();
  const token = (cfg.proxyToken ?? "").trim();

  // 1) El server tiene la key → proxy con key vacía (la pone el server). Cero config para el user.
  if (serverHasKey(provider) && proxy) return callProxy(user, provider, model, "", proxy, token);

  // 2) ChatGPT siempre por proxy (OpenAI bloquea el navegador) con la key del cliente.
  if (provider === "openai") {
    if (!proxy)
      throw new Error("ChatGPT necesita el servidor. Configurá la URL del proxy en Ajustes.");
    if (!key) throw new Error("Falta tu API key de OpenAI (o que el server tenga una).");
    return callProxy(user, "openai", model, key, proxy, token);
  }

  // 3) Gemini/Claude directo desde el navegador con la key del cliente.
  if (!key) throw new Error("Falta la API key. Activala en Ajustes.");
  return provider === "anthropic" ? callAnthropic(user, model, key) : callGemini(user, model, key);
}

// ---- Prompts ----

function block(s: CoachSnapshot): string {
  if (!s.hasData)
    return `### ${s.name} (${s.category})\n_Sin datos registrados todavía._`;
  return `### ${s.name} (${s.category})\nPara qué sirve: ${s.purpose}\nDatos (JSON):\n${JSON.stringify(
    s.data
  )}`;
}

export async function analyzeCoach(id: string, cfg = getAIConfig()): Promise<string> {
  const s = snapshotById(id);
  if (!s) throw new Error("Coach no encontrado.");
  if (!s.hasData)
    throw new Error("Este coach todavía no tiene datos. Registrá algo y volvé a intentar.");
  return call(`Analizá SOLO este módulo del usuario.\n\n${block(s)}`, cfg);
}

export async function analyzeAll(cfg = getAIConfig()): Promise<string> {
  const all = snapshotAll();
  const withData = all.filter((s) => s.hasData);
  if (withData.length === 0)
    throw new Error("Todavía no hay datos en ningún coach. Usá al menos uno y volvé.");
  const empties = all.filter((s) => !s.hasData).map((s) => s.name);
  const user = `Te paso TODOS los módulos del usuario. Conectá las áreas y ayudame a ordenar mi vida: dónde estoy bien, cuál es el cuello de botella, y UN plan de pocas acciones para esta semana que mueva varias áreas a la vez.

${withData.map(block).join("\n\n")}

${empties.length ? `Módulos sin datos aún: ${empties.join(", ")}. Mencioná en una línea cuáles convendría empezar a usar primero.` : ""}`;
  return call(user, cfg);
}

export async function testConnection(cfg: AIConfig): Promise<string> {
  return call('Respondé solo con: "Conexión OK".', cfg);
}
