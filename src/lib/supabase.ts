import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase env-gated. Si no hay URL+anon key configuradas, la app sigue
// en modo local (sin login). Si están, se activa login obligatorio + sync (RLS).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseEnabled = Boolean(url && anon);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    })
  : null;
