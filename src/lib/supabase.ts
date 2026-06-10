import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase env-gated. Supabase se usa SOLO como base de datos/sync;
// la identidad la maneja Clerk (third-party auth). En cada request se adjunta
// el token de sesión de Clerk vía `accessToken`; Supabase lo valida y la RLS
// usa auth.jwt()->>'sub' (= id de usuario de Clerk) para aislar por usuario.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseEnabled = Boolean(url && anon);

// Clerk publica `window.Clerk` cuando <ClerkProvider> está montado.
declare global {
  interface Window {
    Clerk?: { session?: { getToken: () => Promise<string | null> } };
  }
}

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anon as string, {
      // Sin sesión propia de Supabase: la fuente de verdad es Clerk.
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      // Token dinámico de Clerk en cada request (RLS por usuario).
      accessToken: async () => {
        try {
          return (await window.Clerk?.session?.getToken()) ?? null;
        } catch {
          return null;
        }
      }
    })
  : null;
