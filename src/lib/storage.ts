import localforage from "localforage";
import type { RecentEntry, Theme, UserPrefs } from "../types";

// Persistencia local-first (RF-07). IndexedDB vía localForage, con fallback
// a localStorage. El shell solo guarda prefs/favoritos/recientes; cada coach
// guarda su propio estado internamente (ver REQUERIMIENTOS_FLOWIN.md §9).
localforage.config({
  name: "flowin",
  storeName: "flowin_shell",
  description: "Preferencias, favoritos y recientes del shell de Flowin"
});

const K = {
  prefs: "prefs",
  favorites: "favorites",
  recents: "recents"
} as const;

export const DEFAULT_PREFS: UserPrefs = {
  theme: "dark",
  onboardingDone: false,
  locale: "es"
};

export async function getPrefs(): Promise<UserPrefs> {
  const p = await localforage.getItem<UserPrefs>(K.prefs);
  return { ...DEFAULT_PREFS, ...(p ?? {}) };
}

export async function setPrefs(prefs: UserPrefs): Promise<void> {
  await localforage.setItem(K.prefs, prefs);
}

export async function setTheme(theme: Theme): Promise<void> {
  const p = await getPrefs();
  await setPrefs({ ...p, theme });
}

export async function markOnboardingDone(): Promise<void> {
  const p = await getPrefs();
  await setPrefs({ ...p, onboardingDone: true });
}

// ---- Sync (M6): volcar estado de la nube al almacenamiento local ----
export async function restoreShell(s: {
  prefs?: UserPrefs;
  favorites?: string[];
  recents?: RecentEntry[];
}): Promise<void> {
  if (s.prefs) await localforage.setItem(K.prefs, s.prefs);
  if (Array.isArray(s.favorites)) await localforage.setItem(K.favorites, s.favorites);
  if (Array.isArray(s.recents)) await localforage.setItem(K.recents, s.recents);
}

// ---- Favoritos (RF-05) ----
export async function getFavorites(): Promise<string[]> {
  return (await localforage.getItem<string[]>(K.favorites)) ?? [];
}

export async function toggleFavorite(coachId: string): Promise<string[]> {
  const cur = await getFavorites();
  const next = cur.includes(coachId)
    ? cur.filter((id) => id !== coachId)
    : [...cur, coachId];
  await localforage.setItem(K.favorites, next);
  return next;
}

// Setters "raw" para guardar exactamente lo que ya tiene el estado del shell
// (evita races por re-lectura cuando hay toggles rápidos).
export async function setFavorites(ids: string[]): Promise<void> {
  await localforage.setItem(K.favorites, ids);
}
export async function setRecents(r: RecentEntry[]): Promise<void> {
  await localforage.setItem(K.recents, r);
}

// ---- Recientes / Continuar (RF-06) ----
const MAX_RECENTS = 12;

export async function getRecents(): Promise<RecentEntry[]> {
  return (await localforage.getItem<RecentEntry[]>(K.recents)) ?? [];
}

export async function pushRecent(coachId: string): Promise<RecentEntry[]> {
  const cur = await getRecents();
  const next: RecentEntry[] = [
    { coachId, lastOpenedAt: Date.now() },
    ...cur.filter((r) => r.coachId !== coachId)
  ].slice(0, MAX_RECENTS);
  await localforage.setItem(K.recents, next);
  return next;
}
