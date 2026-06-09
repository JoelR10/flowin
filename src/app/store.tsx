import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { RecentEntry, Theme, UserPrefs } from "../types";
import * as db from "../lib/storage";
import { schedulePush } from "../lib/sync";

type Store = {
  ready: boolean;
  prefs: UserPrefs;
  favorites: string[];
  recents: RecentEntry[];
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  isFavorite: (coachId: string) => boolean;
  toggleFavorite: (coachId: string) => void;
  registerOpen: (coachId: string) => void;
  finishOnboarding: () => void;
};

const StoreContext = createContext<Store | null>(null);

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefsState] = useState<UserPrefs>(db.DEFAULT_PREFS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<RecentEntry[]>([]);

  // Carga inicial desde IndexedDB.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, f, r] = await Promise.all([
        db.getPrefs(),
        db.getFavorites(),
        db.getRecents()
      ]);
      if (!alive) return;
      setPrefsState(p);
      applyThemeClass(p.theme);
      setFavorites(f);
      setRecents(r);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Sync a la nube (M6): al cambiar prefs/favoritos/recientes, push debounced.
  // No-op si no hay sesión (modo local).
  useEffect(() => {
    if (ready) schedulePush();
  }, [ready, prefs, favorites, recents]);

  const setTheme = useCallback((t: Theme) => {
    setPrefsState((prev) => {
      const next = { ...prev, theme: t };
      applyThemeClass(t);
      void db.setPrefs(next);
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefsState((prev) => {
      const t: Theme = prev.theme === "dark" ? "light" : "dark";
      const next = { ...prev, theme: t };
      applyThemeClass(t);
      void db.setPrefs(next);
      return next;
    });
  }, []);

  // Update funcional: compone sobre el estado actual (sin re-leer storage) →
  // dos toggles rápidos no se pisan. Persiste el resultado calculado.
  const toggleFavorite = useCallback((coachId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(coachId)
        ? prev.filter((id) => id !== coachId)
        : [...prev, coachId];
      void db.setFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (coachId: string) => favorites.includes(coachId),
    [favorites]
  );

  const registerOpen = useCallback((coachId: string) => {
    setRecents((prev) => {
      const next = [
        { coachId, lastOpenedAt: Date.now() },
        ...prev.filter((r) => r.coachId !== coachId)
      ].slice(0, 12);
      void db.setRecents(next);
      return next;
    });
  }, []);

  const finishOnboarding = useCallback(() => {
    setPrefsState((prev) => {
      const next = { ...prev, onboardingDone: true };
      void db.setPrefs(next);
      return next;
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      prefs,
      favorites,
      recents,
      setTheme,
      toggleTheme,
      isFavorite,
      toggleFavorite,
      registerOpen,
      finishOnboarding
    }),
    [
      ready,
      prefs,
      favorites,
      recents,
      setTheme,
      toggleTheme,
      isFavorite,
      toggleFavorite,
      registerOpen,
      finishOnboarding
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
