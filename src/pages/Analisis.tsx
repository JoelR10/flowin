import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { COACHES } from "../data/coaches";
import { snapshotAll } from "../lib/coachData";
import { aiReady, analyzeAll, analyzeCoach } from "../lib/ai";
import { AnalysisModal } from "../components/AnalysisModal";

type ModalState = { title: string; subtitle: string; runner: () => Promise<string> } | null;

export default function Analisis() {
  const navigate = useNavigate();
  const ready = aiReady();
  const snaps = useMemo(() => snapshotAll(), []);
  const withData = snaps.filter((s) => s.hasData);
  const empty = snaps.filter((s) => !s.hasData);
  const [modal, setModal] = useState<ModalState>(null);

  function coachMeta(id: string) {
    return COACHES.find((c) => c.id === id)!;
  }

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <h1 className="text-2xl font-bold tracking-tight">Mi vida 🧭</h1>
      <p className="shell-muted mt-1 text-sm">
        La IA lee lo que registraste y te dice dónde estás y qué hacer esta semana.
      </p>

      {!ready ? (
        <div className="shell-card mt-5 rounded-2xl p-5 text-sm">
          <p className="text-3xl">✨</p>
          <h2 className="mt-2 font-bold">Activá la IA para empezar</h2>
          <p className="shell-muted mt-1">
            Es gratis: pegás tu clave de Gemini (Google AI Studio) una vez y queda
            guardada solo en tu dispositivo. Está apagada por defecto.
          </p>
          <button
            onClick={() => navigate("/ajustes")}
            className="mt-4 rounded-xl bg-ac px-4 py-2.5 text-sm font-bold text-black"
          >
            Configurar IA en Ajustes →
          </button>
        </div>
      ) : (
        <>
          {/* Análisis global */}
          <button
            onClick={() =>
              setModal({
                title: "Ordená tu vida",
                subtitle: "Análisis de todas tus áreas",
                runner: analyzeAll
              })
            }
            disabled={withData.length === 0}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-ac to-indigo-500 px-5 py-4 text-left font-bold text-black transition active:scale-[0.99] disabled:opacity-50"
          >
            <span className="block text-base">✨ Analizar todo y ordenar mi vida</span>
            <span className="block text-xs font-medium opacity-80">
              Conecta tus {withData.length} área{withData.length === 1 ? "" : "s"} con datos
            </span>
          </button>

          {withData.length === 0 && (
            <p className="shell-muted mt-3 text-center text-sm">
              Todavía no registraste nada. Abrí un coach y cargá tus primeros datos.
            </p>
          )}

          {/* Por área */}
          {withData.length > 0 && (
            <section className="mt-7">
              <h2 className="text-xs font-bold uppercase tracking-widest shell-muted">
                Analizar un área
              </h2>
              <div className="mt-3 space-y-2">
                {withData.map((s) => {
                  const c = coachMeta(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setModal({
                          title: `Análisis · ${c.name}`,
                          subtitle: "Diagnóstico y plan de la semana",
                          runner: () => analyzeCoach(s.id)
                        })
                      }
                      className="shell-card flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:-translate-y-0.5"
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg"
                        style={{ background: `${c.color}22` }}
                      >
                        {c.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{c.name}</span>
                        <span className="block truncate text-xs shell-muted">{c.category}</span>
                      </span>
                      <span className="text-lg">✨</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sin datos aún */}
          {empty.length > 0 && (
            <section className="mt-7">
              <h2 className="text-xs font-bold uppercase tracking-widest shell-muted">
                Todavía sin datos
              </h2>
              <p className="shell-muted mt-2 text-sm">
                Empezá a registrar en estos para que la IA los tenga en cuenta:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {empty.map((s) => {
                  const c = coachMeta(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/coach/${c.slug}`)}
                      className="shell-border shell-muted rounded-full border px-3 py-1.5 text-xs font-semibold hover:text-txt"
                    >
                      {c.icon} {c.name}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <AnalysisModal
        open={modal !== null}
        title={modal?.title ?? ""}
        subtitle={modal?.subtitle}
        runner={modal?.runner ?? (async () => "")}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
