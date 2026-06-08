# Flowin — Documento de Requerimientos

> App de **coaches personales** en una sola base de código, distribuida como **web (PWA)** y **móvil (Android / iOS)**.
> Versión del documento: 0.1 (borrador) · Fecha: 2026-06-05 · Autor: jito
> Estado: catálogo de coaches en **PLACEHOLDER** — se reconcilia con el `.zip` de coaches HTML hechos en COWORK.

---

## 1. Visión

Flowin reúne un conjunto de **coaches personales** (módulos interactivos ya construidos en HTML) bajo una sola aplicación. El usuario entra, ve un catálogo de coaches, abre el que necesita y lo usa. Cada coach es autocontenido; Flowin es la **cáscara (shell)** que los organiza, los presenta y guarda el progreso/preferencias del usuario.

Objetivo central: **una sola base de código** que corra en navegador y se empaquete como app nativa para publicar en **Google Play** y **App Store**, **reutilizando los coaches HTML existentes sin reescribirlos**.

---

## 2. Alcance

### 2.1 Dentro del MVP
- Catálogo de coaches con búsqueda y filtro.
- Apertura y uso de cada coach (HTML autocontenido).
- Favoritos y "recientes / continuar".
- Persistencia local (sin cuenta): preferencias y progreso.
- Tema claro/oscuro.
- Onboarding mínimo.
- Instalable como PWA y empaquetable con Capacitor (Android/iOS).
- Funcionamiento offline del shell y de los coaches ya cargados.

### 2.2 Fuera del MVP (futuro)
- Cuentas de usuario + sincronización en la nube.
- Monetización (freemium / suscripción).
- Notificaciones push / recordatorios.
- Analítica de uso.
- Panel de administración para gestionar coaches sin tocar código.

---

## 3. Usuarios

- **Usuario final:** persona que quiere apoyo personal en alguna área (ver catálogo en §6). Usa la app principalmente desde el móvil, a veces desde el navegador. Quiere abrir un coach rápido y que recuerde dónde quedó.
- **Creador de coaches (jito):** agrega coaches nuevos dejando caer una carpeta HTML y registrándola en el manifiesto. No debería tener que tocar el código del shell para sumar un coach.

---

## 4. Stack recomendado

Recomendación priorizando la **reutilización del HTML existente** y **una sola base de código** para web + móvil.

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Shell / UI | React + Vite + TypeScript | Rápido, tipado, ideal para iterar con Claude Code |
| Estilos | Tailwind CSS | Productivo, consistente, sin CSS suelto |
| Ruteo | React Router | Catálogo ↔ coach sin recargar |
| Persistencia local | IndexedDB vía `localForage` (o `localStorage` para datos simples) | Local-first, offline, sin backend en MVP |
| PWA | `vite-plugin-pwa` (Workbox) | Instalable + offline + service worker |
| Empaque móvil | **Capacitor** | Envuelve el build web en proyectos Android/iOS nativos → publicar en las tiendas |
| Backend (fase futura) | Supabase (Auth + Postgres + Storage) | Auth y sync con poco esfuerzo para un dev solo |

**Alternativas descartadas y por qué:**
- *Flutter / React Native:* obligarían a reescribir los coaches (están en HTML). Descartado.
- *Next.js:* SSR no aporta nada a una app de coaches local-first y complica el empaque con Capacitor. Descartado para el MVP.

> Decisión clave a confirmar: este stack asume que los coaches son **HTML autocontenidos** que se incrustan. Ver §5 y §11.

---

## 5. Modelo de integración de coaches (contrato)

Cada coach es un **módulo HTML autocontenido** (su propio HTML/CSS/JS). El shell lo carga sin acoplarse a su implementación.

### 5.1 Estructura de un coach
```
public/coaches/<coach-id>/
  index.html        # punto de entrada, todo el coach vive aquí
  assets/           # css, js, imágenes propias del coach
```

### 5.2 Mecanismo de incrustación
- El shell abre cada coach en un **`<iframe>` con `sandbox`** a pantalla completa.
- Ventajas: **aislamiento total** de estilos y JS entre coaches y el shell; los HTML de COWORK funcionan tal cual; agregar un coach no rompe a otro.
- El shell añade una **barra superior** propia (volver, título, opciones) por fuera del iframe.

### 5.3 Comunicación shell ↔ coach (opcional en MVP)
Vía `window.postMessage` con un protocolo mínimo y tipado:
- `COACH_READY` — el coach avisa que cargó.
- `PROGRESS_SAVE { payload }` — el coach pide guardar progreso.
- `PROGRESS_LOAD_REQUEST` / `PROGRESS_LOAD_RESPONSE { payload }` — recuperar progreso.
- `NAVIGATE_BACK` — el coach pide volver al catálogo.

> Si los coaches actuales no necesitan hablar con el shell, esto queda para después. El MVP puede funcionar con coaches que guardan su propio estado internamente.

### 5.4 Manifiesto de coaches
Lista central que alimenta el catálogo. Un objeto por coach:

```ts
type Coach = {
  id: string;              // único, estable
  slug: string;            // para la URL
  name: string;            // nombre visible
  shortDescription: string;// para la tarjeta
  longDescription?: string;// para detalle
  category: string;        // p.ej. "Productividad", "Bienestar"
  tags: string[];
  icon: string;            // nombre de ícono o ruta
  color: string;           // color de acento de la tarjeta
  path: string;            // "/coaches/<id>/index.html"
  version: string;
  supportsProgress: boolean;
};
```

**Regla de oro:** agregar un coach = copiar su carpeta a `public/coaches/` + agregar una entrada al manifiesto. Cero cambios en el shell.

---

## 6. Catálogo de coaches (PLACEHOLDER)

> ⚠️ Esta lista es **provisional** para poder diseñar el catálogo. Se **reemplaza con los coaches reales del `.zip`** apenas lo subás. El nombre "Flowin" sugiere foco en flujo/productividad/desarrollo personal; ajustá categorías a lo que ya tenés.

| id | Nombre (tentativo) | Categoría | Descripción corta |
|----|--------------------|-----------|-------------------|
| `enfoque` | Coach de Enfoque | Productividad | Sesiones de concentración y manejo de distracciones |
| `habitos` | Coach de Hábitos | Productividad | Crear y sostener hábitos |
| `finanzas` | Coach de Finanzas | Finanzas personales | Presupuesto y metas de ahorro |
| `estudio` | Coach de Estudio | Aprendizaje | Técnicas de estudio y repaso |
| `bienestar` | Coach de Bienestar | Bienestar | Respiración, descanso y ánimo |

Campos por coach a confirmar con el zip: nombre real, categoría, ícono, color, y si guarda progreso.

---

## 7. Requerimientos funcionales (MVP)

- **RF-01 — Catálogo:** pantalla principal que lista todos los coaches desde el manifiesto, en tarjetas con ícono, nombre, categoría y descripción corta.
- **RF-02 — Búsqueda y filtro:** buscar por nombre/tag y filtrar por categoría.
- **RF-03 — Abrir coach:** al tocar una tarjeta, el coach se abre en pantalla completa (iframe sandbox) con barra superior (volver, título, opciones).
- **RF-04 — Navegación:** volver al catálogo sin recargar la app y conservando la posición de scroll previa.
- **RF-05 — Favoritos:** marcar/desmarcar coaches como favoritos; sección de favoritos; persiste localmente.
- **RF-06 — Recientes / Continuar:** acceso rápido al último coach usado y a los recientes.
- **RF-07 — Persistencia local:** preferencias y progreso se guardan sin necesidad de cuenta.
- **RF-08 — Tema:** alternar claro/oscuro; recordar la elección.
- **RF-09 — Onboarding:** 1–3 pantallas la primera vez; se puede saltar; no se repite.
- **RF-10 — Instalación/empaque:** instalable como PWA en web y empaquetable como app nativa (Capacitor) para Android/iOS.
- **RF-11 — Offline:** el shell y los coaches ya cargados funcionan sin conexión.
- **RF-12 — Acerca de:** pantalla con versión, créditos y enlaces.

---

## 8. Requerimientos no funcionales

- **RNF-01 — Responsive:** móvil primero (desde 320px), tablet y escritorio.
- **RNF-02 — Rendimiento:** transición percibida a un coach < 300 ms; primera carga liviana.
- **RNF-03 — Offline-first:** service worker que cachea shell + coaches.
- **RNF-04 — Accesibilidad básica:** buen contraste, navegación por teclado, etiquetas en controles.
- **RNF-05 — Aislamiento:** estilos y JS de cada coach aislados del shell y entre sí (iframe sandbox).
- **RNF-06 — Seguridad:** iframe con permisos mínimos; sin secretos en el cliente; Content Security Policy.
- **RNF-07 — i18n-ready:** español por defecto, textos del shell centralizados para traducir luego.
- **RNF-08 — Mantenibilidad:** sumar un coach = 1 carpeta + 1 entrada de manifiesto, sin tocar el shell.
- **RNF-09 — Compatibilidad (a confirmar):** navegadores modernos; Android 8+ / iOS 14+.

---

## 9. Modelo de datos local (MVP)

Sin backend. Todo en el dispositivo.

```ts
type UserPrefs = { theme: "light" | "dark"; onboardingDone: boolean; locale: string };
type Favorites = string[];                 // ids de coaches
type Recents = { coachId: string; lastOpenedAt: number }[];
type CoachProgress = Record<string, unknown>; // por coachId, JSON libre que define cada coach
```

> A confirmar: si el progreso lo guarda el shell (vía `PROGRESS_SAVE`) o cada coach por su cuenta. Para el MVP lo más simple es que cada coach guarde lo suyo y el shell solo guarde prefs/favoritos/recientes.

---

## 10. Estructura de repositorio sugerida (para Claude Code)

```
flowin/
├─ public/
│  ├─ coaches/
│  │  └─ <coach-id>/index.html (+ assets/)
│  └─ icons/                  # íconos PWA / splash
├─ src/
│  ├─ app/                    # arranque, layout, tema
│  ├─ pages/                  # Catalogo, CoachView, Favoritos, Ajustes, Acerca, Onboarding
│  ├─ components/             # tarjetas, barra superior, buscador, etc.
│  ├─ data/coaches.ts         # manifiesto de coaches
│  ├─ lib/storage.ts          # wrapper de persistencia local
│  ├─ lib/coachBridge.ts      # postMessage shell ↔ coach (opcional)
│  └─ styles/
├─ capacitor.config.ts
├─ vite.config.ts
├─ CLAUDE.md                  # instrucciones para Claude Code
├─ REQUERIMIENTOS_FLOWIN.md   # este documento
└─ package.json
```

---

## 11. Orden de construcción (milestones)

- **M0 — Setup:** Vite + React + TS + Tailwind; estructura de carpetas; manifiesto con 1 coach de prueba; tema base.
- **M1 — Núcleo de navegación:** catálogo (RF-01) + abrir coach en iframe (RF-03) + volver (RF-04).
- **M2 — Estado local:** tema (RF-08), favoritos (RF-05), recientes (RF-06), onboarding (RF-09), persistencia (RF-07).
- **M3 — PWA:** service worker, manifest, instalable, offline (RF-10/RF-11).
- **M4 — Coaches reales:** poblar el manifiesto con los coaches del `.zip`; ajustar contrato si hace falta.
- **M5 — Capacitor:** build Android/iOS, íconos y splash, pruebas en dispositivo, preparación para tiendas.
- **M6 — Futuro:** auth + sync (Supabase), monetización, notificaciones.

---

## 12. Criterios de aceptación (núcleo)

- Desde el catálogo puedo abrir cualquier coach y usarlo completo, y volver sin perder el catálogo. *(M1)*
- Mis favoritos, tema y recientes siguen ahí al cerrar y reabrir la app. *(M2)*
- La app se instala desde el navegador y abre sin conexión; un coach ya visitado funciona offline. *(M3)*
- Agregar un coach nuevo solo requiere su carpeta + una línea en el manifiesto. *(RNF-08)*
- Existe un build de Android (y de iOS) que abre Flowin como app nativa. *(M5)*

---

## 13. Decisiones abiertas / supuestos a confirmar

1. **Catálogo de coaches** = placeholder. Se reemplaza con el `.zip`. **(bloquea M4)**
2. **Integración por iframe** asumida (coaches autocontenidos). A confirmar al ver cómo están armados los HTML de COWORK.
3. **Sin cuentas en el MVP** (local-first). ¿Necesitás login/sincronización desde el inicio o puede esperar a M6?
4. **Progreso:** ¿lo maneja cada coach internamente o lo centraliza el shell?
5. **Sin monetización en el MVP.** ¿Gratis, freemium o suscripción más adelante?
6. **Compatibilidad mínima** de Android/iOS por confirmar.

---

## 14. Próximo paso

Subí el `.zip` de coaches. Con eso:
- Reemplazo la §6 con el catálogo real.
- Ajusto el contrato de §5 a cómo están construidos tus HTML.
- Genero un `CLAUDE.md` inicial para que Claude Code arranque en M0 sin perderse.
