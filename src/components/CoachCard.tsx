import { useNavigate } from "react-router-dom";
import type { Coach } from "../types";
import { useStore } from "../app/store";

export function CoachCard({ coach }: { coach: Coach }) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(coach.id);

  return (
    <article
      onClick={() => navigate(`/coach/${coach.slug}`)}
      className="shell-card group relative cursor-pointer overflow-hidden rounded-2xl p-5 transition hover:-translate-y-1"
      style={{ boxShadow: "none" }}
    >
      {/* Barra de acento lateral con el color del coach. */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: coach.color }}
        aria-hidden
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(coach.id);
        }}
        aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
        className="absolute right-3 top-3 text-lg leading-none transition hover:scale-110"
      >
        {fav ? "⭐" : "☆"}
      </button>

      <div
        className="mb-3 grid h-12 w-12 place-items-center rounded-xl text-2xl"
        style={{
          background: `linear-gradient(150deg, ${coach.color}, ${coach.color}88)`
        }}
      >
        {coach.icon}
      </div>
      <div
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color: coach.color }}
      >
        {coach.category}
      </div>
      <h3 className="mb-1 mt-0.5 text-base font-semibold">{coach.name}</h3>
      <p className="shell-muted line-clamp-3 text-sm leading-relaxed">
        {coach.shortDescription}
      </p>
      <span
        className="mt-3 inline-block text-sm font-bold"
        style={{ color: coach.color }}
      >
        Abrir →
      </span>
    </article>
  );
}
