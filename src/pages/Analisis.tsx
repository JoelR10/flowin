import { useMemo, useState } from "react";
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

// "Mi vida" es SOLO LECTURA: resúmenes, estadísticas y resultados. Acá no se
// ingresan valores; eso se hace en cada coach (pestaña Coaches). Tocar una
// tarjeta abre un panel de resumen con el detalle y un CTA explícito al coach.
export default function Analisis() {
  const summary = useMemo(() => lifeSummary(), []);
  const [sel, setSel] = useState<Advice | null>(null);
  const conData = summary.items.filter((a) => a.hasState);
  const sinData = summary.items.filter((a) => !a.hasState);

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <h1 className="text-2xl font-bold tracking-tight">Mi vida 🧭</h1>
      <p className="shell-muted mt-1 text-sm">{summary.headline}</p>

      {/* Foco de la semana (el área más floja con datos) */}
      {summary.focus && summary.focus.sem !== "green" && (
        <button
          onClick={() => setSel(summary.focus)}
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
                <AdviceRow key={a.coach.id} a={a} onOpen={() => setSel(a)} />
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
            Acá vas a ver tu estado cuando registres en cada coach. Mientras, un consejo base:
          </p>
          <div className="mt-3 space-y-2">
            {sinData.map((a) => (
              <AdviceRow key={a.coach.id} a={a} onOpen={() => setSel(a)} />
            ))}
          </div>
        </section>
      )}

      <p className="shell-muted mt-6 text-center text-[11px]">
        Consejos calculados con tus propios datos, en tu dispositivo. Sin IA ni internet.
      </p>

      {sel && <DetailSheet a={sel} onClose={() => setSel(null)} />}
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

// Panel de resumen (solo lectura). El único camino a "ingresar valores" es el
// CTA explícito que lleva al coach.
function DetailSheet({ a, onClose }: { a: Advice; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Resumen de ${a.coach.name}`}
    >
      <div
        className="shell-card w-full max-w-md rounded-t-3xl border-b-0 p-5"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-500/40" />

        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl"
            style={{ background: `${a.coach.color}22` }}
          >
            {a.coach.icon}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-bold">{a.coach.name}</h3>
            <p className="shell-muted truncate text-xs">{a.coach.category}</p>
          </div>
        </div>

        {/* Estadísticas / resultado */}
        <div className="mt-4 flex items-center gap-4">
          <div className="shell-card rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-bold leading-none">
              {a.puntaje !== null ? a.puntaje : "—"}
            </p>
            <p className="shell-muted mt-1 text-[10px] uppercase tracking-wider">de 100</p>
          </div>
          <div className="min-w-0">
            {a.sem ? (
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className={`h-2.5 w-2.5 rounded-full ${SEM_DOT[a.sem]}`} />
                {a.estado ?? SEM_LABEL[a.sem]}
              </p>
            ) : (
              <p className="text-sm font-semibold shell-muted">Sin datos todavía</p>
            )}
            {a.alerta && <p className="mt-1 text-xs text-yellow-500">⚠ {a.alerta}</p>}
          </div>
        </div>

        {/* Consejo */}
        <p className="shell-muted mt-4 text-sm leading-relaxed">{a.consejo}</p>

        <button
          onClick={() => navigate(`/coach/${a.coach.slug}`)}
          className="mt-5 w-full rounded-xl bg-ac py-3 text-center font-bold text-black transition active:scale-[0.99]"
        >
          {a.hasState ? "Abrir el coach" : "Registrar en el coach"} →
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl py-2.5 text-center text-sm font-semibold shell-muted"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
