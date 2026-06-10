import type { ReactNode } from "react";
import { clerkEnabled } from "../lib/clerk";
import { useAuth } from "../app/auth";
import { AuthScreen } from "./AuthScreen";

// Puerta de acceso. Sin Clerk configurado → modo local (deja pasar).
// Con Clerk → login obligatorio + espera el sync (si hay Supabase) antes de la app.
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, signedIn, synced } = useAuth();

  if (!clerkEnabled) return <>{children}</>;

  if (!ready) {
    return <div className="grid h-full place-items-center shell-muted">Cargando…</div>;
  }
  if (!signedIn) return <AuthScreen />;
  if (!synced) {
    return (
      <div className="grid h-full place-items-center shell-muted">
        <span className="animate-pulse text-sm">Sincronizando tu cuenta…</span>
      </div>
    );
  }
  return <>{children}</>;
}
