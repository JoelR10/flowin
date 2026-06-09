# Flowin — guía para Claude Code

App de **coaches personales** en una sola base de código: **web (PWA)** + **móvil (Capacitor Android/iOS)**.
El shell (React) organiza y presenta coaches HTML autocontenidos que se abren en un `<iframe sandbox>`.
Spec completa: `REQUERIMIENTOS_FLOWIN.md`.

## Stack
- React 18 + Vite 5 + TypeScript
- Tailwind CSS (tema oscuro/claro vía clase en `<html>`)
- React Router (HashRouter — funciona como archivo estático en Capacitor)
- Persistencia local: `localforage` (IndexedDB) — sin backend
- PWA: `vite-plugin-pwa` (Workbox)
- Móvil: Capacitor (`capacitor.config.ts`)

## Comandos
```bash
npm install
npm run dev        # desarrollo (Vite)
npm run build      # tsc -b && vite build  → dist/
npm run preview    # sirve el build (probar PWA/offline)
node scripts/generate-icons.mjs   # regenera íconos PWA
```

## Estructura
```
public/coaches/<id>/index.html   # cada coach, autocontenido
public/coaches/_vendor/          # React/Tailwind/Babel locales (coach 'agenda', offline)
public/icons/                    # íconos PWA generados
src/data/coaches.ts              # MANIFIESTO — fuente de verdad del catálogo (incl. storageKey por coach)
src/lib/storage.ts              # prefs / favoritos / recientes (localforage)
src/lib/coachBridge.ts          # postMessage shell↔coach (opcional, hoy no-op)
src/lib/coachData.ts            # lee el localStorage de cada coach (mismo origen) → snapshots
src/lib/ai.ts                   # servicio IA: Gemini (key local del usuario), analyzeCoach/analyzeAll
src/lib/markdown.ts             # render markdown→HTML seguro para los análisis
src/app/store.tsx               # estado global (tema, favoritos, recientes)
src/pages/                      # Catalogo, CoachView, Analisis, Favoritos, Ajustes, Acerca, Onboarding
src/components/                 # CoachCard, BottomNav, ThemeToggle, AnalysisModal
```

## Regla de oro (RNF-08)
**Sumar un coach = copiar su carpeta a `public/coaches/<id>/` + agregar una entrada en `src/data/coaches.ts`.**
Cero cambios en el shell.

- Si el coach trae CDN externo (React/Tailwind por URL), **vendorizalo** a `public/coaches/_vendor/`
  y reescribí sus `<script src>` a rutas relativas, para no romper el modo offline (RF-11).
- Cada coach guarda su propio estado en `localStorage` (key propia). El shell solo guarda
  prefs/favoritos/recientes. No mezclar.
- **Tema:** el shell pasa su tema al iframe vía `?flowinTheme=dark|light` (ver `CoachView.tsx`).
  Si un coach tiene tema propio (claro/oscuro), que lea ese parámetro al cargar para arrancar
  acorde al shell. Ejemplos hechos: `agenda` (lee el param en su effect de carga) y `finanzas`
  (bloque CSS `html[data-theme="dark"]` + script que aplica `data-theme`). Los 10 coaches del
  Suite son oscuros nativos.

## IA (multi-proveedor, opcional, off por defecto)
- Proveedores: **Gemini** (gratis, default), **Claude** (Anthropic), **ChatGPT** (OpenAI). El usuario
  elige proveedor + pega su **propia key**; todo en localStorage (`flowin_ai_config`: enabled, provider,
  keys{}, models{}). Sin backend, sin keys en el repo. Off por defecto.
- **CORS (verificado real):** Gemini ✅ y Claude ✅ se llaman directo desde el navegador
  (Anthropic requiere header `anthropic-dangerous-direct-browser-access: true`). **OpenAI ❌** bloquea
  el navegador (Failed to fetch) → ChatGPT necesita backend/proxy; la UI lo avisa y el código tira mensaje claro.
- Endpoints: Gemini `generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key=`;
  Anthropic `api.anthropic.com/v1/messages` (x-api-key + anthropic-version 2023-06-01 + browser-access header);
  OpenAI `api.openai.com/v1/chat/completions` (Bearer). Todo en `src/lib/ai.ts`.
- `analyzeCoach(id)` analiza un coach; `analyzeAll()` conecta todas las áreas ("Mi vida"). Lee el localStorage
  de cada coach (`coachData.ts`), NO recalcula puntajes.
- UI: botón ✨ en CoachView, tab "Mi vida" (`/analisis`), config en Ajustes (toggle + proveedor + key + modelo + probar conexión).
- **Guía in-app por proveedor** (Ajustes): cada proveedor (`PROVIDERS` en `ai.ts`) trae `tagline` + `steps[]`
  (pasos PC y móvil) + badge `free`. Gemini marcado "gratis/recomendado". La guía se renderiza colapsable
  con el link directo a sacar la key. Editar pasos = editar `PROVIDERS`.
- Modelos elegibles por proveedor (Gemini default `gemini-2.0-flash`, Claude `claude-sonnet-4-6`, OpenAI `gpt-4o-mini`). Si un model id falla (404), elegir otro.

## Server (proxy IA + deploy todo-en-uno)
- `server/index.js` (Express). `npm run server` → `http://localhost:8787`.
- `POST /api/ai` `{provider, model, system, user, apiKey}` → llama al proveedor server-side y
  devuelve `{text}`. Key: la del cliente, o fallback a `.env` del server (`server/.env`, ver `.env.example`).
- **Desbloquea ChatGPT**: OpenAI bloquea el navegador (CORS); el server hace la llamada. Gemini/Claude
  siguen yendo directo del navegador (no dependen del server).
- En dev, Vite proxya `/api` → `:8787` (ver `vite.config.ts`). El cliente usa `proxyUrl` (default `/api/ai`).
- Si existe `dist/`, el server lo sirve → `npm run serve` (build + server) = **deploy de un solo origen**
  (app + coaches + API juntos, sin CORS). Verificado: sirve app, coaches y `/api/ai`.
- **Endurecimiento** (env, ver `server/.env.example`): `ALLOWED_ORIGINS` (allowlist CORS; vacío=abierto+warning),
  `APP_TOKEN` (exige header `x-flowin-token`; el cliente lo manda desde `proxyToken` en Ajustes), rate-limit
  en memoria (30/min/IP), timeout 30s en upstream, errores sanitizados (oculta keys), status real del upstream.
- **Privacidad (cliente):** AnalysisModal pide **consentimiento una vez** (`flowin_ai_consent`) nombrando el
  proveedor antes de mandar datos; footer lo recuerda.
- **CSP** (S3): inyectada solo en el build de prod (plugin en `vite.config.ts`, `apply:'build'`) — dev sin CSP
  para no romper HMR. Cubre el shell; los coaches (iframe) son docs aparte. Si el proxy vive en otro origen,
  agregarlo a `connect-src`.

## Despliegue (coaches listos para cualquier target)
- Coaches **100% self-contained**: 0 requests externos (CDN/fetch/fuentes), vendor por ruta relativa
  (`../_vendor/`), sin rutas absolutas internas. Offline total. Portables a cualquier host.
- Shell usa `import.meta.env.BASE_URL` para el iframe del coach → anda en **raíz** y en **subpath**.
- Targets OK: estático en dominio raíz ✅, all-in-one node (`npm run serve`) ✅, PWA (https) ✅, Capacitor ✅.
- **Subpath** (p.ej. `/flowin/`): además setear `base: '/flowin/'` en `vite.config.ts` y rebuild.
- ChatGPT en producción necesita el server desplegado (Node host o serverless) y la `proxyUrl` apuntándole.

## Cuentas + nube + monitoreo (M6, env-gated)
- **Supabase Auth (login obligatorio email+contraseña)** + sync por usuario. Activado solo si están
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (ver `.env.example`). Sin ellas → la app corre en **modo local**
  (sin login, como el MVP). `src/lib/supabase.ts` (`supabaseEnabled`), `src/app/auth.tsx` (AuthProvider),
  `src/components/AuthGate.tsx` + `AuthScreen.tsx`. Orden en `main.tsx`: ErrorBoundary → Auth → Store → Router.
- **Sync (`src/lib/sync.ts`):** tabla `user_state` (RLS: `auth.uid()=user_id` → nadie ve datos ajenos).
  Guarda prefs/favoritos/recientes + el blob de cada coach. NO sube las API keys de IA (quedan locales).
  Pull al iniciar sesión (si vacío, sube lo local); push debounced desde el store (cambios) y CoachView (salir).
- **SQL:** `supabase/migrations/0001_init.sql` (tabla + RLS + perfiles + trigger). Correr en Supabase → SQL Editor.
- **Monitoreo (Sentry, opcional):** cliente `src/lib/monitoring.ts` (`VITE_SENTRY_DSN`), server `SENTRY_DSN`. Sin DSN = no-op.
- **Setup para activar M6:** crear proyecto Supabase → copiar URL+anon key a `.env` (raíz) → correr el SQL →
  (en Auth settings, decidir si exigís confirmación por email) → `npm run build`. Sentry: crear proyecto React + poner DSN.
- Pendiente: rate-limit del proxy en multi-instancia → Redis (hoy en memoria, 1 instancia).

## Estado actual
M0–M3 hechos: catálogo + búsqueda/filtro, abrir coach en iframe, volver con scroll, favoritos,
recientes/continuar, tema claro/oscuro, onboarding, persistencia local, PWA instalable + offline.
12 coaches reales cargados (10 del Suite + Agenda + Planificador). IA opcional (Gemini) integrada.
Arreglos aplicados: quitado el link roto "Volver al hub" (404) en los 10 coaches del Suite;
hábitos ya no da 6 pts gratis en día vacío; corregido texto del motor de Salud.

**Pendiente:** M5 Capacitor (build Android/iOS, íconos/splash nativos, pruebas en dispositivo).
M6 futuro: cuentas + sync (Supabase), monetización, notificaciones.
