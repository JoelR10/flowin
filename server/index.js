// Flowin server: sirve el build estático (deploy todo-en-uno, mismo origen).
// Sin IA (los consejos se calculan local en el cliente). Útil para correr la
// PWA + Capacitor desde un solo origen, o desplegar en un Node host.
//   npm run build && npm run server   →   http://localhost:8787
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const __dir = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

// Monitoreo opcional (Sentry), env-gated. Sin SENTRY_DSN no hace nada.
if (process.env.SENTRY_DSN) {
  const Sentry = await import("@sentry/node");
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  console.log("Sentry activo en el server");
}

const app = express();
app.disable("x-powered-by");

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Servir la PWA buildeada. SPA fallback (HashRouter): cualquier ruta no-API
// devuelve index.html.
const dist = join(__dir, "..", "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/"))
      return res.sendFile(join(dist, "index.html"));
    next();
  });
} else {
  console.warn("No existe ../dist. Corré `npm run build` antes de `npm run server`.");
}

app.listen(PORT, () => console.log(`Flowin server en http://localhost:${PORT}`));
