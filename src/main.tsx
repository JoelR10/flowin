import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { StoreProvider } from "./app/store";
import App from "./App";
import "./styles/index.css";

// Service worker (RF-10/RF-11). autoUpdate: se actualiza solo en segundo plano.
registerSW({ immediate: true });

// HashRouter: rutas tipo /#/coach/gym → funcionan igual servidas como archivo
// estático (Capacitor) que en web, sin configurar rewrites del servidor.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <HashRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </HashRouter>
    </StoreProvider>
  </React.StrictMode>
);
