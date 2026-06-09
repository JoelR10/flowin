import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { ErrorBoundary, initMonitoring } from "./lib/monitoring";
import { refreshServerStatus } from "./lib/ai";
import { AuthProvider } from "./app/auth";
import { AuthGate } from "./components/AuthGate";
import { StoreProvider } from "./app/store";
import App from "./App";
import "./styles/index.css";

// Monitoreo (Sentry) — no-op si no hay VITE_SENTRY_DSN.
initMonitoring();

// Detecta si el servidor ya tiene keys de IA → la IA funciona sin pedir nada al usuario.
void refreshServerStatus();

// Service worker (RF-10/RF-11). autoUpdate: se actualiza solo en segundo plano.
registerSW({ immediate: true });

// Orden: ErrorBoundary → Auth (login si Supabase está configurado) → Store → Router.
// HashRouter funciona igual servido como archivo estático (Capacitor) que en web.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={
        <div className="grid h-full place-items-center px-6 text-center shell-muted">
          Algo se rompió. Recargá la app.
        </div>
      }
    >
      <AuthProvider>
        <AuthGate>
          <StoreProvider>
            <HashRouter
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <App />
            </HashRouter>
          </StoreProvider>
        </AuthGate>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
