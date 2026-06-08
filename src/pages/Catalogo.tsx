import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, COACHES, getCoachBySlug } from "../data/coaches";
import { CoachCard } from "../components/CoachCard";
import { ThemeToggle } from "../components/ThemeToggle";
import { useStore } from "../app/store";

export default function Catalogo() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const { recents } = useStore();
  const navigate = useNavigate();

  // Búsqueda por nombre/tag + filtro por categoría (RF-02).
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COACHES.filter((c) => {
      if (cat && c.category !== cat) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        c.category.toLowerCase().includes(needle) ||
        c.tags.some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [q, cat]);

  // Último coach usado → "Continuar" (RF-06).
  const lastCoach = recents.length
    ? getCoachBySlug(recents[0].coachId) ?? null
    : null;

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest shell-muted">
            Suite personal · {COACHES.length} coaches
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Flowin 🧠</h1>
          <p className="shell-muted mt-1 text-sm">
            Abrí un coach, registrá tus datos y dejá que el motor calcule. Todo
            se guarda en tu dispositivo.
          </p>
        </div>
        <ThemeToggle />
      </div>

      {/* Continuar (RF-06) */}
      {lastCoach && !q && !cat && (
        <button
          onClick={() => navigate(`/coach/${lastCoach.slug}`)}
          className="shell-card mt-4 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:-translate-y-0.5"
        >
          <span
            className="grid h-10 w-10 place-items-center rounded-xl text-xl"
            style={{ background: `${lastCoach.color}22` }}
          >
            {lastCoach.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold uppercase tracking-wider shell-muted">
              Continuar
            </span>
            <span className="block truncate font-semibold">{lastCoach.name}</span>
          </span>
          <span style={{ color: lastCoach.color }} className="font-bold">
            →
          </span>
        </button>
      )}

      {/* Buscador (RF-02) */}
      <div className="mt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar coach o etiqueta…"
          className="shell-card w-full rounded-xl px-4 py-3 text-sm outline-none placeholder:opacity-60 focus:border-ac"
          type="search"
        />
      </div>

      {/* Chips de categoría */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={cat === null} onClick={() => setCat(null)}>
          Todas
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
      </div>

      {/* Grilla (RF-01) */}
      {results.length === 0 ? (
        <p className="shell-muted mt-10 text-center text-sm">
          Sin resultados para “{q}”.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <CoachCard key={c.id} coach={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-ac bg-ac/15 text-ac"
          : "shell-border shell-muted hover:text-txt"
      }`}
    >
      {children}
    </button>
  );
}
