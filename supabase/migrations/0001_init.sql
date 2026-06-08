-- Flowin — esquema inicial (M6). Pegar y ejecutar en Supabase → SQL Editor.
-- Crea la tabla de estado por usuario con Row-Level Security:
-- cada usuario SOLO puede leer/escribir SUS propias filas (auth.uid() = user_id).

-- Estado por usuario: prefs, favoritos, recientes y el progreso de cada coach.
-- Una fila por (user_id, key). data es JSON libre.
create table if not exists public.user_state (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  key        text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Activar RLS (sin políticas, nadie puede tocar nada).
alter table public.user_state enable row level security;

-- Candados: solo el dueño de la fila.
drop policy if exists "user_state_select_own" on public.user_state;
create policy "user_state_select_own" on public.user_state
  for select using (auth.uid() = user_id);

drop policy if exists "user_state_insert_own" on public.user_state;
create policy "user_state_insert_own" on public.user_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_state_update_own" on public.user_state;
create policy "user_state_update_own" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_state_delete_own" on public.user_state;
create policy "user_state_delete_own" on public.user_state
  for delete using (auth.uid() = user_id);

-- (Opcional) Perfil por usuario, por si después querés nombre/avatar.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Crear el perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
