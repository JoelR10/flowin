import { useEffect, useState } from "react";
import { renderMarkdown } from "../lib/markdown";
import { PROVIDERS, getAIConfig } from "../lib/ai";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  runner: () => Promise<string>;
  onClose: () => void;
};

const CONSENT_KEY = "flowin_ai_consent";
function hasConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}
function saveConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    /* noop */
  }
}

type Status = "consent" | "loading" | "done" | "error";

// Modal que ejecuta un análisis de IA al abrirse y muestra el resultado.
// La primera vez pide consentimiento (los datos del coach salen del dispositivo
// hacia el proveedor de IA elegido).
export function AnalysisModal({ open, title, subtitle, runner, onClose }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const providerLabel =
    PROVIDERS.find((p) => p.id === getAIConfig().provider)?.label ?? "el proveedor de IA";

  function run() {
    let alive = true;
    setStatus("loading");
    setText("");
    setError("");
    runner()
      .then((r) => alive && (setText(r), setStatus("done")))
      .catch((e: unknown) => {
        if (alive) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      });
    return () => {
      alive = false;
    };
  }

  useEffect(() => {
    if (!open) return;
    if (!hasConsent()) {
      setStatus("consent");
      return;
    }
    return run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function accept() {
    saveConsent();
    run();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="shell-card flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-2 border-b shell-border px-4 py-3">
          <span className="text-lg">✨</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold">{title}</h2>
            {subtitle && <p className="truncate text-xs shell-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-lg text-lg shell-muted hover:text-txt"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {status === "consent" && (
            <div className="py-4 text-sm">
              <p className="text-2xl">🔒</p>
              <h3 className="mt-2 font-bold">Antes de analizar</h3>
              <p className="shell-muted mt-1 leading-relaxed">
                Para darte el análisis, Flowin enviará los datos que registraste en este coach a{" "}
                <b className="text-txt">{providerLabel}</b>. No se guardan en ningún servidor de
                Flowin. ¿Querés continuar?
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={accept}
                  className="rounded-xl bg-ac px-4 py-2.5 text-sm font-bold text-black"
                >
                  Entiendo, analizar
                </button>
                <button
                  onClick={onClose}
                  className="shell-card rounded-xl px-4 py-2.5 text-sm font-semibold shell-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="animate-pulse text-3xl">🧠</span>
              <p className="text-sm shell-muted">Analizando tus datos…</p>
            </div>
          )}
          {status === "error" && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
              <p className="font-semibold text-red-400">No se pudo analizar</p>
              <p className="mt-1 shell-muted">{error}</p>
            </div>
          )}
          {status === "done" && (
            <div
              className="ai-md text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
            />
          )}
        </div>

        <footer className="border-t shell-border px-4 py-2 text-center text-[11px] shell-muted safe-b">
          Datos enviados a {providerLabel} · generado por IA · revisá con tu criterio
        </footer>
      </div>
    </div>
  );
}
