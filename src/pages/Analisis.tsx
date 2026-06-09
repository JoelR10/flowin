import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { lifeSummary, type Advice, type Sem } from "../lib/advice";

const SEM_DOT: Record<Sem, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500"
};
const SEM_LABEL: Record<Sem, string> = {
  green: "Bien",
  yellow: "Atención",
  red: "A mejorar"
};

export default function Analisis() {
  const navigate = useNavigate();
  const summary = useMemo(() => lifeSummary(), []);
  const conData = summary.items.filter((a) => a.hasState);
  const sinData = summary.items.filter((a) => !a.hasState);

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <h1 className="text-2xl font-bold tracking-tight">Mi vida 🧭</h1>
      <p className="shell-muted mt-1 text-sm">{summary.headline}</p>

      {/* Foco de la semana (el área más floja con datos) */}
      {summary.focus && summary.focus.sem !== "green" && (
        <button
          onClick={() => navigate(`/coach/${summary.focus!.coach.slug}`)}
          className="mt-4 w-full rounded-2xl border-l-4 p-4 text-left shell-card transition hover:-translate-y-0.5"
          style={{ borderLeftColor: summary.focus.coach.color }}
        >
          <p className="text-xs font-bold uppercase tracking-widest shell-muted">
            Foco de la semana
          </p>
          <p className="mt-1 flex items-center gap-2 font-semibold">
            <span>{summary.focus.coach.icon}</span> {summary.focus.coach.name}
            {summary.focus.puntaje !== null && (
              <span className="shell-muted text-sm">· {summary.focus.puntaje}/100</span>
            )}
          </p>
          <p className="shell-muted mt-1 text-sm">{summary.focus.consejo}</p>
        </button>
      )}

      {/* Áreas con datos */}
      {conData.length > 0 && (
        <section className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-widest shell-muted">
            Tus áreas
          </h2>
          <div className="mt-3 space-y-2">
            {conData
              .slice()
              .sort((a, b) => (a.puntaje ?? 0) - (b.puntaje ?? 0))
              .map((a) => (
                <AdviceRow key={a.coach.id} a={a} onOpen={() => navigate(`/coach/${a.coach.slug}`)} />
              ))}
          </div>
        </section>
      )}

      {/* Sin datos aún → tip por defecto */}
      {sinData.length > 0 && (
        <section className="mt-7">
          <h2 className="text-xs font-bold uppercase tracking-widest shell-muted">
            Todavía sin datos
          </h2>
          <p className="shell-muted mt-2 text-sm">
            Abrí estos y registrá para ver tu estado. Mientras, un consejo base:
          </p>
          <div className="mt-3 space-y-2">
            {sinData.map((a) => (
              <AdviceRow key={a.coach.id} a={a} onOpen={() => navigate(`/coach/${a.coach.slug}`)} />
            ))}
          </div>
        </section>
      )}

      <p className="shell-muted mt-6 text-center text-[11px]">
        Consejos calculados con tus propios datos, en tu dispositivo. Sin IA ni internet.
      </p>
    </div>
  );
}

function AdviceRow({ a, onOpen }: { a: Advice; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="shell-card flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:-translate-y-0.5"
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
        style={{ background: `${a.coach.color}22` }}
      >
        {a.coach.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{a.coach.name}</span>
          {a.sem && (
            <span className="flex items-center gap-1 text-[11px] shell-muted">
              <span className={`h-2 w-2 rounded-full ${SEM_DOT[a.sem]}`} />
              {a.puntaje !== null ? `${a.puntaje} · ` : ""}
              {SEM_LABEL[a.sem]}
            </span>
          )}
        </span>
        <span className="shell-muted mt-0.5 block text-xs leading-relaxed">{a.consejo}</span>
        {a.alerta && (
          <span className="mt-1 block text-[11px] text-yellow-500">⚠ {a.alerta}</span>
        )}
      </span>
      <span className="shell-muted shrink-0 self-center">→</span>
    </button>
  );
}
