import { supabase } from "./supabase";
import { COACHES } from "../data/coaches";
import { getFavorites, getPrefs, getRecents, restoreShell } from "./storage";
import type { RecentEntry, UserPrefs } from "../types";

// Sync por usuario contra la tabla `user_state` (protegida con RLS:
// auth.uid() = user_id → nadie ve datos ajenos). Guarda el estado del shell
// (prefs/favoritos/recientes) + el progreso de cada coach (su blob de
// localStorage). No sincroniza secretos ni credenciales privadas.

type Row = { user_id: string; key: string; data: unknown; updated_at: string };

let userId: string | null = null;
export function setSyncUser(id: string | null): void {
  userId = id;
}
function ready(): boolean {
  return Boolean(supabase && userId);
}

const coachKey = (id: string) => `coach:${id}`;

// Trae lo de la nube y lo vuelca al almacenamiento local (el shell y los
// coaches leen de local como siempre). Devuelve cuántas filas había.
export async function pullAll(): Promise<number> {
  if (!ready() || !supabase) return 0;
  const { data, error } = await supabase
    .from("user_state")
    .select("key,data")
    .eq("user_id", userId);
  if (error || !data) return 0;

  const shell: { prefs?: UserPrefs; favorites?: string[]; recents?: RecentEntry[] } = {};
  for (const row of data as { key: string; data: unknown }[]) {
    if (row.key === "prefs") shell.prefs = row.data as UserPrefs;
    else if (row.key === "favorites") shell.favorites = row.data as string[];
    else if (row.key === "recents") shell.recents = row.data as RecentEntry[];
    else if (row.key.startsWith("coach:")) {
      const id = row.key.slice("coach:".length);
      const coach = COACHES.find((c) => c.id === id);
      if (coach) {
        try {
          localStorage.setItem(coach.storageKey, JSON.stringify(row.data));
        } catch {
          /* noop */
        }
      }
    }
  }
  await restoreShell(shell);
  return data.length;
}

async function gather(): Promise<Row[]> {
  const now = new Date().toISOString();
  const uid = userId as string;
  const [prefs, favorites, recents] = await Promise.all([
    getPrefs(),
    getFavorites(),
    getRecents()
  ]);
  const rows: Row[] = [
    { user_id: uid, key: "prefs", data: prefs, updated_at: now },
    { user_id: uid, key: "favorites", data: favorites, updated_at: now },
    { user_id: uid, key: "recents", data: recents, updated_at: now }
  ];
  for (const c of COACHES) {
    try {
      const raw = localStorage.getItem(c.storageKey);
      if (raw) rows.push({ user_id: uid, key: coachKey(c.id), data: JSON.parse(raw), updated_at: now });
    } catch {
      /* noop */
    }
  }
  return rows;
}

export async function pushAll(): Promise<void> {
  if (!ready() || !supabase) return;
  const rows = await gather();
  if (rows.length) await supabase.from("user_state").upsert(rows, { onConflict: "user_id,key" });
}

// Push debounced: lo llaman el store (al cambiar) y CoachView (al salir).
let timer: ReturnType<typeof setTimeout> | null = null;
export function schedulePush(): void {
  if (!ready()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void pushAll(), 1500);
}
