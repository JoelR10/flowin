import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseEnabled } from "../lib/supabase";
import { pullAll, pushAll, setSyncUser } from "../lib/sync";

type AuthCtx = {
  ready: boolean; // auth inicializado
  session: Session | null;
  synced: boolean; // datos de la nube ya traídos
  email: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

function mapError(msg: string): string {
  if (/invalid login/i.test(msg)) return "Email o contraseña incorrectos.";
  if (/already registered/i.test(msg)) return "Ese email ya tiene cuenta. Iniciá sesión.";
  if (/password should be/i.test(msg)) return "La contraseña es muy corta (mínimo 6).";
  if (/confirm/i.test(msg)) return "Revisá tu email para confirmar la cuenta.";
  return msg;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!supabaseEnabled); // sin Supabase: listo ya
  const [session, setSession] = useState<Session | null>(null);
  const [synced, setSynced] = useState(false);

  // Al haber sesión: traer la nube; si está vacía, subir lo local (migración).
  const onSession = useCallback(async (s: Session | null) => {
    setSession(s);
    if (s?.user) {
      setSyncUser(s.user.id);
      try {
        const n = await pullAll();
        if (n === 0) await pushAll();
      } catch {
        /* sync best-effort */
      }
      setSynced(true);
    } else {
      setSyncUser(null);
      setSynced(false);
    }
  }, []);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      void onSession(data.session).finally(() => setReady(true));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      void onSession(s);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [onSession]);

  const signIn = useCallback(async (em: string, pw: string) => {
    if (!supabase) return "Supabase no configurado.";
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    return error ? mapError(error.message) : null;
  }, []);

  const signUp = useCallback(async (em: string, pw: string) => {
    if (!supabase) return "Supabase no configurado.";
    const { error } = await supabase.auth.signUp({ email: em, password: pw });
    return error ? mapError(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      ready,
      session,
      synced,
      email: session?.user?.email ?? null,
      signIn,
      signUp,
      signOut
    }),
    [ready, session, synced, signIn, signUp, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fuera de <AuthProvider>");
  return c;
}
