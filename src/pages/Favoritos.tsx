import { useMemo } from "react";
import { useStore } from "../app/store";
import { COACHES, getCoachBySlug } from "../data/coaches";
import { CoachCard } from "../components/CoachCard";

export default function Favoritos() {
  const { favorites, recents } = useStore();

  const favCoaches = useMemo(
    () => COACHES.filter((c) => favorites.includes(c.id)),
    [favorites]
  );

  const recentCoaches = useMemo(
    () =>
      recents
        .map((r) => getCoachBySlug(r.coachId))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [recents]
  );

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <h1 className="text-2xl font-bold tracking-tight">Tu actividad ⭐</h1>

      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-widest shell-muted">
          Favoritos
        </h2>
        {favCoaches.length === 0 ? (
          <p className="shell-muted mt-2 text-sm">
            Todavía no marcaste favoritos. Tocá la ☆ en cualquier coach.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favCoaches.map((c) => (
              <CoachCard key={c.id} coach={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-widest shell-muted">
          Recientes
        </h2>
        {recentCoaches.length === 0 ? (
          <p className="shell-muted mt-2 text-sm">Sin coaches abiertos aún.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentCoaches.map((c) => (
              <CoachCard key={c.id} coach={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
