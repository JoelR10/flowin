// Flowin server: healthcheck + static production build.
// If ../dist exists, it serves the built PWA in the same origin.
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const __dir = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

// Optional server monitoring. Keep SENTRY_DSN empty to run without Sentry.
let Sentry = null;
if (process.env.SENTRY_DSN) {
  Sentry = await import("@sentry/node");
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  console.log("Sentry activo en el server");
}

const app = express();
app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const dist = join(__dir, "..", "dist");
if (existsSync(dist)) {
  app.use(
    express.static(dist, {
      setHeaders(res, path) {
        if (/\.(js|css|svg|png|ico|woff2)$/.test(path)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    })
  );

  // SPA fallback (HashRouter): any non-API GET returns index.html.
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store");
      return res.sendFile(join(dist, "index.html"));
    }
    next();
  });

  console.log("Sirviendo build estatico desde /dist");
}

app.use((err, _req, res, _next) => {
  if (Sentry) Sentry.captureException(err);
  res.status(500).json({ error: "Error interno." });
});

app.listen(PORT, () => {
  console.log(`Flowin server escuchando en http://localhost:${PORT}`);
});
