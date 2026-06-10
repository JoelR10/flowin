import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// CSP solo en el build de producción (en dev rompería el HMR de Vite, que usa
// inline + eval). Cubre el shell; los coaches son documentos aparte (su iframe).
// - Supabase (sync/realtime): *.supabase.co. Self-hosted en otro dominio → agregalo.
// - Clerk (login Google + correo): carga clerk.browser.js desde su Frontend API
//   y llama a su API. Dev = *.clerk.accounts.dev. Si usás dominio propio de Clerk
//   (clerk.tudominio.com), agregá ese host a script-src y connect-src.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data: https://img.clerk.com https://*.googleusercontent.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  "worker-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://accounts.google.com",
  "form-action 'self'"
].join("; ");

function cspPlugin(): Plugin {
  return {
    name: "flowin-csp",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "</head>",
        `  <meta http-equiv="Content-Security-Policy" content="${CSP}">\n  </head>`
      );
    }
  };
}

// Flowin shell. Los coaches viven en /public/coaches/<id>/index.html y se
// sirven como estáticos; el shell los abre en un <iframe sandbox>.
export default defineConfig({
  plugins: [
    cspPlugin(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "Flowin — Coaches personales",
        short_name: "Flowin",
        description: "Tus coaches personales en una sola app.",
        lang: "es",
        theme_color: "#0a0d13",
        background_color: "#0a0d13",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // El shell (JS/CSS/HTML buildeado) se precachea.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // Los coaches son grandes y vendor/babel pesa ~3MB: NO precachear,
        // cachear en runtime → "un coach ya visitado funciona offline" (RF-11).
        globIgnores: ["**/coaches/**"],
        navigateFallbackDenylist: [/^\/coaches\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/coaches/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "flowin-coaches",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 }
            }
          }
        ]
      }
    })
  ]
});
