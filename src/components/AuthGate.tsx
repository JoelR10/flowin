import type { ReactNode } from "react";
import { supabaseEnabled } from "../lib/supabase";
import { useAuth } from "../app/auth";
import { AuthScreen } from "./AuthScreen";

// Puerta de acceso. Sin Supabase configurado → modo local (deja pasar).
// Con Supabase → login obligatorio + espera el sync antes de mostrar la app.
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, session, synced } = useAuth();

  if (!supabaseEnabled) return <>{children}</>;

  if (!ready) {
    return (
      <div className="grid h-full place-items-center shell-muted">Cargando…</div>
    );
  }
  if (!session) return <AuthScreen />;
  if (!synced) {
    return (
      <div className="grid h-full place-items-center shell-muted">
        <span className="animate-pulse text-sm">Sincronizando tu cuenta…</span>
      </div>
    );
  }
  return <>{children}</>;
}
