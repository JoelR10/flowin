# Auditoria de produccion - Flowin

Fecha: 2026-06-08

Este documento audita Flowin capa por capa con el estandar que debe repetirse en todas las apps nuevas: frontend cerrado, secretos fuera del cliente, base de datos con candados por usuario, APIs reales, hosting seguro, rate limiting, caching, escalabilidad y monitoreo.

Tambien se guardo el estandar global de Codex como skill local:

`app-production-audit`

## Resumen ejecutivo

Flowin queda mas limpia para produccion: la IA fue eliminada por decision de producto, ya no hay proxy `/api/ai`, no quedan API keys de IA en el frontend, el build no genera sourcemaps publicos, Supabase tiene RLS por usuario y el server puede servir la PWA con healthcheck.

No esta lista como app publica de alto trafico sin terminar hosting, CI/CD, headers HTTP, observabilidad y estrategia de cache/escala. Como MVP serio, la base ya esta bastante sana.

## Estado por capa

| Capa | Estado | Veredicto |
| --- | --- | --- |
| Frontend minificado/sin sourcemaps | OK | `npm run build` minifica y no publica `.map`; gzip/brotli queda a cargo del hosting. |
| Secretos | OK con vigilancia | No hay API keys privadas de IA ni secretos server en cliente; revisar siempre `.env*` antes de commit. |
| Base de datos/RLS | OK | `user_state` y `profiles` tienen politicas RLS por usuario. |
| Control de versiones | Pendiente | Hay git local; falta preparar commit limpio, remoto y politica de release. |
| APIs e integraciones | Basico | Solo queda `/api/health`; futuras APIs deben tener auth, validacion, rate limit y logs. |
| Hosting/deployment | Pendiente | Falta plataforma, dominio, HTTPS, headers, cache, preview deploys y rollback. |
| Seguridad | Media | Server Node agrega headers basicos; CSP existe en meta del shell; faltan headers completos por hosting y CSP para coaches. |
| Rate limiting | Pendiente | No hay APIs sensibles ahora; cuando se agreguen, usar limite por IP/usuario/ruta. |
| Caching | Media | PWA cachea shell/coaches; server da cache largo a assets, pero falta politica CDN/HTML por hosting. |
| Escalabilidad | Media | Correcta para MVP local/PWA; alto trafico requiere CDN, indices, cuotas, colas y metricas. |
| Monitoreo | Pendiente | Sentry opcional y `/api/health`; faltan alertas, uptime checks, releases y dashboard. |

## Hallazgos principales

### Medium - Hosting/deployment no esta definido

No hay config de Vercel, Netlify, Render, Fly, Railway, Docker ni GitHub Actions. El server puede servir `dist`, pero produccion necesita plataforma concreta, HTTPS, envs, health check, cache, rollback y dominio.

### Medium - CSP en meta no reemplaza headers HTTP

`vite.config.ts` inyecta CSP para el shell en build y `server/index.js` agrega headers basicos (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`). Para produccion publica, mover/reforzar en hosting: `Content-Security-Policy`, `Strict-Transport-Security`, cache por ruta y CSP tambien para coaches.

### Medium - Iframe sandbox requiere tratar coaches como codigo confiable

`CoachView` usa sandbox con scripts y same-origin para que los coaches funcionen y guarden estado. Eso esta bien para codigo propio, pero si algun dia se cargan coaches de terceros, conviene origen separado y comunicacion solo por `postMessage`.

### Medium - Falta CI/CD

Agregar pipeline con `npm ci`, `npm run build`, `npm audit --omit=dev`, chequeo de sourcemaps, escaneo de secretos y deploy preview. Sin CI, un cambio pequeno puede romper produccion sin aviso.

### Medium - Observabilidad incompleta

Sentry existe como opt-in (`VITE_SENTRY_DSN`, `SENTRY_DSN`) y el server expone `/api/health`. Falta configurar DSNs reales, releases, alertas, uptime checks, request IDs y logs estructurados.

### Low - Password policy local de Supabase es debil

`supabase/config.toml` usa minimo 6 caracteres. Para produccion publica, subir a 8-12, activar requisitos razonables, captcha/rate limit de auth y MFA opcional.

### Low - Dependencias dev con vulnerabilidades moderadas

`npm audit --omit=dev` debe quedar limpio para runtime. El audit completo puede reportar vulnerabilidades en tooling dev; planificar upgrade de Vite/PWA plugin cuando no rompa el build.

## Controles positivos verificados

- Build productivo probado con `npm run build`.
- No se generan sourcemaps publicos en `dist`.
- `npm audit --omit=dev` reporta 0 vulnerabilidades runtime.
- La IA fue retirada: no hay `src/lib/ai.ts`, no hay `AnalysisModal`, no hay `/api/ai`.
- CSP de build ya no permite proveedores externos de IA.
- `server/index.js` desactiva `x-powered-by`, agrega headers basicos, sirve assets con cache largo y expone `/api/health`.
- Supabase RLS protege datos por usuario.
- Sync por usuario no sincroniza secretos privados.
- Sentry cliente/server esta listo como opcional por ambiente.

## Roadmap inmediato

1. Preparar commit limpio y configurar remoto Git.
2. Elegir hosting y agregar config de deploy con HTTPS, headers, cache y rollback.
3. Agregar CI/CD con build, audit, sourcemap check y secret scan.
4. Configurar monitoreo real con Sentry, uptime checks y alertas.
5. Empaquetar Android/iOS con Capacitor cuando el build web este estable.
6. Definir escritorio: PWA instalable o wrapper Electron/Tauri si se necesita app nativa.

## Estandar para todas las apps nuevas

Toda app que creemos debe tener, como minimo:

- Frontend minificado, comprimido por hosting y sin sourcemaps publicos.
- Cero secretos privados en frontend o git.
- BD con RLS/candados por usuario desde la primera migracion.
- APIs server-side con validacion, auth, rate limit y logs.
- CI/CD con build, audit y escaneo.
- Hosting con HTTPS, headers, cache, rollback y ambientes.
- Monitoreo con errores, uptime, logs, releases y alertas.
- Estrategia de escalabilidad: cache, colas, indices, cuotas y degradacion controlada.
