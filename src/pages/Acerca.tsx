import { useNavigate } from "react-router-dom";
import { COACHES } from "../data/coaches";

export default function Acerca() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <button
        onClick={() => navigate(-1)}
        className="shell-muted mb-4 text-sm font-semibold hover:text-txt"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold tracking-tight">Acerca de Flowin</h1>
      <p className="shell-muted mt-1 text-sm">Versión 0.1.0 · {COACHES.length} coaches</p>

      <div className="shell-card mt-5 rounded-2xl p-4 text-sm leading-relaxed">
        <p>
          <b>Flowin</b> reúne tus coaches personales en una sola app. Cada coach
          es un módulo autocontenido; el shell los organiza, los presenta y
          recuerda tus favoritos y dónde quedaste.
        </p>
        <p className="shell-muted mt-3">
          Local-first: funciona offline y sin cuenta. Instalable como app desde
          el navegador y empaquetable para Android/iOS.
        </p>
      </div>

      <div className="shell-card mt-3 rounded-2xl p-4 text-sm">
        <p className="font-semibold">Créditos</p>
        <p className="shell-muted mt-1">
          Coaches y diseño original por JITO. Shell construido con React, Vite,
          Tailwind y Capacitor.
        </p>
      </div>

      <p className="shell-muted mt-6 text-center text-xs">
        Hecho con 🧠 para mantener el flow.
      </p>
    </div>
  );
}
