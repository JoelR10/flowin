# Flowin - guia para Claude Code

App de coaches personales en una sola base de codigo: web PWA + movil via Capacitor.
El shell React organiza 12 coaches autocontenidos que se abren en un iframe sandbox.
Spec completa: `REQUERIMIENTOS_FLOWIN.md`.

## Stack
- React 18 + Vite 5 + TypeScript.
- Tailwind CSS con tema oscuro/claro en el shell.
- React Router con HashRouter para que funcione como estatico y en Capacitor.
- Persistencia local con `localforage` e IndexedDB; cada coach mantiene su propio `localStorage`.
- PWA con `vite-plugin-pwa`.
- Movil via Capacitor (`capacitor.config.ts`).
- Supabase Auth/sync opcional, activado por env.

## Comandos
```bash
npm install
npm run dev
npm run build
npm run preview
npm run server
npm run serve
node scripts/generate-icons.mjs
```

## Estructura
```text
public/coaches/<id>/index.html   # cada coach, autocontenido
public/coaches/_vendor/          # React/Tailwind/Babel locales para coaches offline
public/icons/                    # iconos PWA generados
src/data/coaches.ts              # manifiesto y storageKey por coach
src/lib/storage.ts               # prefs / favoritos / recientes
src/lib/coachBridge.ts           # postMessage shell <-> coach
src/lib/advice.ts                # consejos locales, sin IA ni internet
src/lib/sync.ts                  # sync Supabase por usuario
src/app/store.tsx                # estado global
src/pages/                       # Catalogo, CoachView, Analisis, Favoritos, Ajustes, Acerca, Onboarding
src/components/                  # CoachCard, BottomNav, ThemeToggle y componentes de auth
```

## Regla de oro
Sumar un coach = copiar su carpeta a `public/coaches/<id>/` + agregar una entrada en `src/data/coaches.ts`.
El shell no debe necesitar cambios para cada nuevo coach.

- Si un coach trae CDN externo, vendorizarlo a `public/coaches/_vendor/` y reescribir scripts a rutas relativas.
- Cada coach guarda su estado en su propia key de `localStorage`.
- El shell pasa el tema al iframe con `?flowinTheme=dark|light`.
- Los coaches son codigo propio y confiable; mantenerlos revisados porque usan sandbox con scripts y same-origin.

## Consejos locales
Flowin no tiene modulo IA. El apartado "Mi vida" usa consejos rule-based calculados en el dispositivo, sin keys, sin proveedores externos y sin internet.

- `src/lib/advice.ts` genera foco semanal, areas y consejos por coach.
- Los coaches del Suite emiten estado con `window.parent.postMessage({__flowin:'state', payload})`.
- `src/lib/coachBridge.ts` recibe ese estado y `CoachView` lo guarda en `localStorage['flowin_state_<id>']`.
- `Analisis.tsx` muestra foco, estado por areas y tips cuando aun no hay datos.
- `Ajustes.tsx` ya no tiene configuracion IA.

## Server
`server/index.js` es un servidor Express minimo para produccion:

- `GET /api/health` devuelve estado de salud.
- Si existe `dist/`, sirve la PWA y los coaches en el mismo origen.
- Assets estaticos versionados tienen cache largo; fallback SPA tiene `no-store`.
- `x-powered-by` esta desactivado.
- Sentry server es opcional con `SENTRY_DSN`.
- No existe proxy IA ni endpoints con API keys.

## Despliegue
- Build productivo: `npm run build`.
- Servir build en Node: `npm run server` despues de compilar, o `npm run serve` para build + server.
- Targets previstos: web estatica/PWA, Node all-in-one, Capacitor Android/iOS.
- Subpath, por ejemplo `/flowin/`: configurar `base` en `vite.config.ts` y reconstruir.
- Produccion real debe definir hosting, HTTPS, headers, cache, monitoreo, CI/CD y rollback.

## Cuentas + nube + monitoreo
- Supabase Auth se activa con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Sin esas envs, Flowin corre en modo local.
- `supabase/migrations/0001_init.sql` crea `user_state`, `profiles` y RLS por usuario.
- `src/lib/sync.ts` guarda prefs/favoritos/recientes y blobs de cada coach; no sincroniza secretos privados.
- Sentry cliente es opcional con `VITE_SENTRY_DSN`; server con `SENTRY_DSN`.

## Estado actual
MVP web/PWA con 12 coaches reales: 10 del Suite + Agenda + Planificador.
Se quitaron datos de prueba/personales y referencias con nombre propio.
La IA fue eliminada por decision de producto; quedan consejos locales profesionales.

Produccion local verificada con `npm run build` + `npm run server`.

Pendiente natural:
- Preparar commit y remoto Git.
- Configurar hosting/deploy.
- Empaquetar Android/iOS con Capacitor.
- Definir estrategia desktop web/PWA o wrapper si se requiere app instalable de escritorio.
