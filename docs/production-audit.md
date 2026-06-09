# Auditoria de produccion - Flowin

Fecha: 2026-06-08

Este documento audita Flowin capa por capa con el estandar que debe repetirse en todas las apps nuevas: frontend cerrado, secretos fuera del cliente, base de datos con candados por usuario, APIs reales, hosting seguro, rate limiting, caching, escalabilidad y monitoreo.

Tambien se guardo el estandar global de Codex en:

`C:\Users\JITO\.codex\skills\app-production-audit`

## Resumen ejecutivo

Flowin esta bien encaminada como MVP serio: compila en produccion, no genera sourcemaps publicos, usa Supabase Auth con RLS para separar datos por usuario, tiene proxy de IA, CSP basica, PWA, Sentry opcional y un rate limit inicial.

No esta lista como app publica de alto trafico sin endurecimiento adicional. Los riesgos principales son: modo de IA con API keys en cliente/localStorage, CORS abierto si no se configura el server, rate limit en memoria, falta de headers HTTP de seguridad/cache desde hosting, falta de CI/CD y falta de monitoreo/alertas operativo real.

## Estado por capa

| Capa | Estado | Veredicto |
| --- | --- | --- |
| Frontend comprimido/sin sourcemaps | OK con pendientes | `npm run build` minifica y no hay `.map` en `dist`; compresion gzip/brotli depende del hosting. |
| Secretos | Riesgo | `.env.local` esta gitignored y solo tiene vars Vite; pero IA permite guardar API keys de usuario en `localStorage`. |
| Base de datos/RLS | OK | `user_state` y `profiles` tienen RLS por usuario. |
| Control de versiones | Riesgo | Hay git, commits y rama `main`, pero no hay CI ni politica de release visible. |
| APIs e integraciones | Riesgo | Proxy `/api/ai` existe, pero acepta keys desde cliente y auth del proxy es opcional. |
| Hosting/deployment | No verificado | No hay config de Vercel/Netlify/Render/Fly/Docker/CI detectada. |
| Seguridad | Riesgo | CSP existe en meta del shell, pero faltan headers HTTP y hardening de iframe/coaches. |
| Rate limiting | Riesgo | Existe rate limit en memoria para `/api/ai`; no sirve para multi-instancia/alto flujo. |
| Caching | Riesgo | PWA cachea coaches; faltan headers/CDN strategy para assets, APIs y HTML. |
| Escalabilidad | Riesgo | Arquitectura suficiente para MVP; falta Redis/cola/cuotas/indices revisados bajo carga. |
| Monitoreo | Riesgo | Sentry opcional cliente/server y `/api/health`; faltan alertas, uptime checks y dashboard. |

## Hallazgos por severidad

### High - API keys de IA pueden vivir en cliente/localStorage

Evidencia:

- `src/lib/ai.ts:3-7` documenta claves del usuario en el dispositivo y llamadas directas desde navegador.
- `src/lib/ai.ts:117-140` guarda `flowin_ai_config` en `localStorage`.
- `src/lib/ai.ts:197-225` llama Gemini/Anthropic directo desde el frontend con la key.

Riesgo:

Una app publica no debe depender de secretos en el navegador. Cualquier XSS, extension maliciosa, dispositivo compartido o backup del navegador podria exponer keys.

Fix:

Para produccion, forzar IA solo via servidor: `proxyUrl=/api/ai`, keys solo en `server/.env` o secret manager, y no aceptar `apiKey` desde el body publico. Mantener BYOK solo como modo local/dev claramente separado.

### High - Proxy de IA puede quedar abierto en produccion

Evidencia:

- `server/index.js:34-38` deja `ALLOWED_ORIGINS` y `APP_TOKEN` opcionales.
- `server/index.js:43-49` permite cualquier origen si la allowlist esta vacia.
- `server/index.js:169-170` solo exige token si `APP_TOKEN` existe.
- `server/index.js:203-208` advierte, pero no bloquea el arranque en produccion.

Riesgo:

Si se deploya con keys del servidor y CORS abierto/sin token, terceros podrian usar tu endpoint para gastar credito de IA.

Fix:

En `NODE_ENV=production`, fallar el arranque si faltan `ALLOWED_ORIGINS` y `APP_TOKEN` cuando existan keys de IA. Agregar auth por usuario o cuota por usuario, no solo token compartido.

### High - Rate limiting no escala

Evidencia:

- `server/index.js:55-66` usa `Map` en memoria por IP.

Riesgo:

En serverless, multi-instancia o reinicios, el limite se reinicia o queda fragmentado. No protege costos de IA ni ataques distribuidos.

Fix:

Usar Redis/Upstash/Supabase/Cloudflare rate limiting con limites por IP, usuario, ruta y proveedor. Agregar cuotas diarias para IA.

### Medium - CSP esta en meta y cubre solo el shell

Evidencia:

- `vite.config.ts:5-7` aclara que la CSP cubre el shell y no los coaches.
- `vite.config.ts:21-29` inyecta CSP como `<meta>`, no como header HTTP.

Riesgo:

La CSP en meta ayuda, pero no reemplaza headers completos. Los coaches son documentos aparte y pueden quedar con politica distinta.

Fix:

Configurar headers HTTP en hosting/server: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` segun aplique. Dar CSP tambien a `/coaches/*`.

### Medium - Iframe sandbox funcional pero no aislamiento fuerte

Evidencia:

- `src/pages/CoachView.tsx:112-126` usa `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"`.

Riesgo:

`allow-scripts` + `allow-same-origin` reduce mucho el aislamiento si algun coach HTML queda comprometido. Es necesario para `localStorage`, pero debe tratarse como contenido confiable.

Fix:

Mantener coaches como codigo propio revisado. Para aislamiento real, servir coaches en subdominio/origen separado y comunicar con `postMessage`, o quitar `allow-same-origin` si se migra el storage.

### Medium - Hosting/deployment no esta definido

Evidencia:

- No se detectaron archivos de Vercel, Netlify, Render, Fly, Railway, Docker, GitHub Actions ni workflows.
- `server/index.js:190-199` puede servir `dist`, pero no define compresion ni headers de cache.

Riesgo:

Sin pipeline reproducible es facil deployar con envs incompletas, sin HTTPS/headers, sin rollback y sin checks.

Fix:

Definir plataforma y agregar config: build, env vars, headers, redirects, health check, preview deploys, rollback y dominio HTTPS.

### Medium - No hay CI/CD ni checks de calidad

Evidencia:

- `package.json` solo tiene `build`, `dev`, `preview`, `server`, `serve`, `cap:*`.
- No hay workflow de CI detectado.

Riesgo:

Cambios pueden romper build, RLS, seguridad o dependencias sin aviso antes de deploy.

Fix:

Agregar CI con `npm ci`, `npm run build`, `npm audit --omit=dev`, chequeo de sourcemaps y escaneo de secretos.

### Medium - Vulnerabilidades dev en Vite/esbuild/vite-plugin-pwa

Evidencia:

- `npm audit --omit=dev` devuelve 0 vulnerabilidades prod.
- `npm audit` completo reporta 3 moderadas en dependencias dev: `vite`, `esbuild`, `vite-plugin-pwa`.

Riesgo:

Principalmente afecta servidor de desarrollo y tooling, no el runtime productivo actual, pero conviene actualizar antes de trabajar en redes compartidas o equipos.

Fix:

Planificar upgrade de Vite/PWA plugin, probar build/PWA y revisar breaking changes.

### Medium - Observabilidad incompleta

Evidencia:

- `src/lib/monitoring.ts:7-16` inicia Sentry solo si existe `VITE_SENTRY_DSN`.
- `server/index.js:20-25` inicia Sentry server solo si existe `SENTRY_DSN`.
- `server/index.js:162` expone `/api/health`.

Riesgo:

Sentry opcional no garantiza alertas, uptime checks, trazas, versionado de releases ni metricas de negocio.

Fix:

Configurar DSNs por ambiente, release version, alerts, uptime checks, logs estructurados, request IDs y dashboard de errores/latencia.

### Low - Supabase Auth permite password minimo bajo en config local

Evidencia:

- `supabase/config.toml:181-185` deja `minimum_password_length = 6` y `password_requirements = ""`.

Riesgo:

Para produccion publica, contrasenas debiles aumentan riesgo de cuentas comprometidas.

Fix:

Subir minimo a 8-12, activar requisitos razonables, MFA opcional y captcha/rate limit de auth en Supabase.

## Controles positivos verificados

- Build productivo correcto: `npm run build` pasa.
- No hay archivos `.map` en `dist`.
- `npm audit --omit=dev` no reporta vulnerabilidades productivas.
- `.env.local` existe con Supabase URL/anon key y esta cubierto por `.gitignore` mediante `*.local`.
- No se detectaron secretos privados hardcodeados en fuente fuera de nombres/placeholders.
- `supabase/migrations/0001_init.sql` activa RLS y politicas por usuario para `user_state` y `profiles`.
- `src/components/AuthGate.tsx` exige login cuando Supabase esta configurado.
- `src/lib/sync.ts` no sincroniza API keys de IA.
- `src/lib/markdown.ts` escapa HTML antes de renderizar markdown de IA.
- `server/index.js` desactiva `x-powered-by`, limita JSON a 512kb, sanitiza errores y tiene timeout a proveedores.

## Roadmap inmediato

1. Produccion IA segura:
   - Desactivar llamadas directas frontend a Gemini/Anthropic en build prod.
   - Quitar `apiKey` del body publico o permitirlo solo en modo local.
   - Keys solo en server/secret manager.
   - `ALLOWED_ORIGINS` y `APP_TOKEN` obligatorios si `NODE_ENV=production`.

2. Hosting real:
   - Elegir plataforma.
   - Configurar HTTPS, headers, compresion, cache y rollback.
   - Definir staging/prod.

3. CI/CD:
   - Build, audit, escaneo de secretos, sourcemap check y deploy preview.

4. Rate limiting serio:
   - Redis/Upstash/Cloudflare.
   - Limites por IP, usuario y ruta.
   - Cuotas de IA por dia/mes.

5. Observabilidad:
   - Sentry cliente/server con releases.
   - Uptime checks para `/api/health`.
   - Alertas por error rate, 5xx, latencia y gasto IA.

6. Seguridad avanzada:
   - Headers HTTP reales.
   - CSP para coaches.
   - Revisar sandbox/origen de coaches.
   - Subir requisitos de auth.

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
