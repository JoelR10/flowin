-- Flowin — auth con Clerk (third-party). La identidad la maneja Clerk; Supabase
-- solo guarda datos. Supabase valida el JWT de Clerk y la RLS aísla por usuario
-- usando el subject del token: auth.jwt()->>'sub' = id de usuario Clerk (texto,
-- ej. "user_2ab…").
--
-- REQUISITO previo (una sola vez, en el dashboard de Supabase):
--   Authentication → Sign In / Providers → Third-Party Auth → Add provider → Clerk
--   (pegás el "Clerk domain" que te da Clerk). Sin esto, Supabase rechaza el token.
--
-- Pegar y ejecutar en Supabase → SQL Editor. Reemplaza el esquema M6 (que usaba
-- Supabase Auth / auth.uid()). Como ya no hay datos de prueba, recrea limpio.

-- 1) user_state ahora con user_id TEXT (id de Clerk, no uuid de auth.users).
drop table if exists public.user_state cascade;
create table public.user_state (
  user_id    text        not null,
  key        text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_state enable row level security;

-- 2) Candados RLS: solo el dueño (el sub del JWT de Clerk == user_id de la fila).
--    Sin token (anon) el sub es NULL → no matchea → acceso denegado.
create policy "user_state_select_own" on public.user_state
  for select using ((auth.jwt() ->> 'sub') = user_id);

create policy "user_state_insert_own" on public.user_state
  for insert with check ((auth.jwt() ->> 'sub') = user_id);

create policy "user_state_update_own" on public.user_state
  for update using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "user_state_delete_own" on public.user_state
  for delete using ((auth.jwt() ->> 'sub') = user_id);

-- 3) Limpieza del esquema M6: profiles/trigger dependían de Supabase Auth
--    (auth.users), que ya no se usa con Clerk.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles cascade;
