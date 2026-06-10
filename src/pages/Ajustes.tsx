import { useNavigate } from "react-router-dom";
import { useStore } from "../app/store";
import { useAuth } from "../app/auth";
import { clerkEnabled } from "../lib/clerk";
import { supabaseEnabled } from "../lib/supabase";

export default function Ajustes() {
  const { prefs, toggleTheme } = useStore();
  const { email, signOut } = useAuth();
  const navigate = useNavigate();
  const dark = prefs.theme === "dark";

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <h1 className="text-2xl font-bold tracking-tight">Ajustes ⚙️</h1>

      <div className="mt-5 space-y-3">
        {/* Tema (RF-08) */}
        <div className="shell-card flex items-center justify-between rounded-2xl p-4">
          <div>
            <p className="font-semibold">Tema</p>
            <p className="shell-muted text-sm">{dark ? "Oscuro" : "Claro"} · se recuerda</p>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={dark}
            aria-label="Alternar tema claro/oscuro"
            className={`relative h-7 w-12 rounded-full transition ${dark ? "bg-ac" : "bg-gray-400"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                dark ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Cuenta — solo si Clerk está configurado (login activo) */}
        {clerkEnabled && email && (
          <div className="shell-card flex items-center justify-between rounded-2xl p-4">
            <div className="min-w-0 pr-3">
              <p className="font-semibold">Cuenta</p>
              <p className="shell-muted truncate text-sm">{email}</p>
            </div>
            <button
              onClick={() => void signOut()}
              className="shrink-0 rounded-xl border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-400"
            >
              Cerrar sesión
            </button>
          </div>
        )}

        <Row label="Acerca de Flowin" emoji="ℹ️" onClick={() => navigate("/acerca")} />
      </div>

      <p className="shell-muted mt-6 text-xs leading-relaxed">
        {clerkEnabled && supabaseEnabled
          ? "Tus datos se sincronizan con tu cuenta y cada usuario ve solo lo suyo. También quedan en este dispositivo para uso offline."
          : clerkEnabled
            ? "Tu cuenta solo controla el acceso. Tus datos (preferencias, favoritos y progreso) viven en este dispositivo."
            : "Tus datos (preferencias, favoritos y el progreso de cada coach) viven en este dispositivo. No hay cuenta ni servidor."}
      </p>
    </div>
  );
}

function Row({
  label,
  emoji,
  onClick
}: {
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shell-card flex w-full items-center justify-between rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
    >
      <span className="flex items-center gap-3 font-semibold">
        <span className="text-lg">{emoji}</span>
        {label}
      </span>
      <span className="shell-muted">→</span>
    </button>
  );
}
