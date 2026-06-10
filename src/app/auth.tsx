import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useClerk,
  useUser
} from "@clerk/clerk-react";
import { esES } from "@clerk/localizations";
import { clerkEnabled, clerkPublishableKey } from "../lib/clerk";
import { supabaseEnabled } from "../lib/supabase";
import { pullAll, pushAll, setSyncUser } from "../lib/sync";

type AuthCtx = {
  ready: boolean; // auth inicializado
  signedIn: boolean; // hay sesión
  synced: boolean; // datos de la nube ya traídos (true si no hay Supabase)
  email: string | null;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

// Modo local (sin Clerk configurado): todo abierto, sin login ni sync.
function LocalProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthCtx>(
    () => ({ ready: true, signedIn: true, synced: true, email: null, signOut: async () => {} }),
    []
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Puente Clerk → Flowin. Vive dentro de <ClerkProvider>. Conecta la sesión de
// Clerk con el sync de Supabase (RLS por el id de usuario de Clerk).
function ClerkBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    let alive = true;
    if (isSignedIn && userId) {
      setSyncUser(userId);
      void (async () => {
        if (supabaseEnabled) {
          try {
            const n = await pullAll();
            if (n === 0) await pushAll();
          } catch {
            /* sync best-effort */
          }
        }
        if (alive) setSynced(true);
      })();
    } else {
      setSyncUser(null);
      setSynced(false);
    }
    return () => {
      alive = false;
    };
  }, [isLoaded, isSignedIn, userId]);

  const value = useMemo<AuthCtx>(
    () => ({
      ready: isLoaded,
      signedIn: Boolean(isSignedIn),
      synced: supabaseEnabled ? synced : true,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      signOut: async () => {
        await clerk.signOut();
      }
    }),
    [isLoaded, isSignedIn, synced, user, clerk]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <LocalProvider>{children}</LocalProvider>;
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey as string}
      afterSignOutUrl="/"
      telemetry={false}
      localization={esES}
    >
      <ClerkBridge>{children}</ClerkBridge>
    </ClerkProvider>
  );
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fuera de <AuthProvider>");
  return c;
}
