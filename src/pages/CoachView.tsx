import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCoachBySlug } from "../data/coaches";
import { useStore } from "../app/store";
import { listenToCoach } from "../lib/coachBridge";
import { aiReady, analyzeCoach } from "../lib/ai";
import { AnalysisModal } from "../components/AnalysisModal";

export default function CoachView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { prefs, isFavorite, toggleFavorite, registerOpen } = useStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const showAI = aiReady();

  const coach = slug ? getCoachBySlug(slug) : undefined;

  // Marca el coach como reciente al abrir (RF-06).
  useEffect(() => {
    if (coach) registerOpen(coach.id);
  }, [coach, registerOpen]);

  // Puente opcional: si el coach pide volver (NAVIGATE_BACK) o avisa que cargó.
  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;
    return listenToCoach(el, {
      onReady: () => setLoaded(true),
      onNavigateBack: () => navigate(-1)
    });
  }, [navigate]);

  if (!coach) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold">Coach no encontrado</p>
          <button
            onClick={() => navigate("/")}
            className="mt-3 rounded-lg bg-ac px-4 py-2 text-sm font-bold text-black"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  const fav = isFavorite(coach.id);
  // Pasa el tema del shell al coach. Los coaches que lo soportan (agenda,
  // finanzas) leen ?flowinTheme y arrancan en claro/oscuro acorde.
  // Usa BASE_URL para que ande en cualquier despliegue (raíz o subpath).
  const base = import.meta.env.BASE_URL || "/";
  const rel = coach.path.replace(/^\//, "");
  const sep = rel.includes("?") ? "&" : "?";
  const src = `${base}${rel}${sep}flowinTheme=${prefs.theme}`;

  return (
    <div className="flex h-full flex-col">
      {/* Barra superior del shell, por fuera del iframe (RF-03). */}
      <header
        className="shell-card safe-t flex items-center gap-2 border-x-0 border-t-0 px-3 py-2.5"
        style={{ borderBottomColor: coach.color }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="grid h-9 w-9 place-items-center rounded-lg text-lg shell-muted transition hover:text-txt"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{coach.icon}</span>
            <h1 className="truncate text-sm font-bold">{coach.name}</h1>
          </div>
          <p className="truncate text-[11px] shell-muted">{coach.category}</p>
        </div>
        {showAI && (
          <button
            onClick={() => setAiOpen(true)}
            aria-label="Analizar con IA"
            title="Analizar con IA"
            className="grid h-9 w-9 place-items-center rounded-lg text-lg transition hover:scale-110"
          >
            ✨
          </button>
        )}
        <button
          onClick={() => toggleFavorite(coach.id)}
          aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="grid h-9 w-9 place-items-center rounded-lg text-lg transition hover:scale-110"
        >
          {fav ? "⭐" : "☆"}
        </button>
      </header>

      <AnalysisModal
        open={aiOpen}
        title={`Análisis · ${coach.name}`}
        subtitle="Diagnóstico y plan de la semana"
        runner={() => analyzeCoach(coach.id)}
        onClose={() => setAiOpen(false)}
      />

      {/* Coach autocontenido, aislado en iframe sandbox (RNF-05/RNF-06).
          allow-scripts + allow-same-origin: los coaches usan localStorage para
          guardar su propio progreso. Mismo origen que el shell. */}
      <div className="relative min-h-0 flex-1">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center shell-muted">
            <span className="animate-pulse text-sm">Cargando {coach.name}…</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={src}
          src={src}
          title={coach.name}
          onLoad={() => setLoaded(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          className="h-full w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
