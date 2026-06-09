// Puente opcional shell ↔ coach vía postMessage (REQUERIMIENTOS_FLOWIN.md §5.3).
// Los coaches actuales guardan su propio estado, así que esto es no-op salvo
// que un coach decida hablar con el shell. Protocolo mínimo y tipado.

export type CoachMessage =
  | { type: "COACH_READY" }
  | { type: "PROGRESS_SAVE"; payload: unknown }
  | { type: "PROGRESS_LOAD_REQUEST" }
  | { type: "NAVIGATE_BACK" };

export type ShellMessage = { type: "PROGRESS_LOAD_RESPONSE"; payload: unknown };

// Fila de estado que emiten los coaches del Suite (COACH_ID, PUNTAJE, ESTADO,
// ALERTA, RECOMENDACION…). El shell la usa para los consejos locales.
export type CoachState = {
  COACH_ID?: string;
  AREA?: string;
  PUNTAJE?: number;
  ESTADO?: string;
  ALERTA?: string;
  RECOMENDACION?: string;
  [k: string]: unknown;
};

type Handlers = {
  onReady?: () => void;
  onProgressSave?: (payload: unknown) => void;
  onLoadRequest?: () => void;
  onNavigateBack?: () => void;
  onState?: (state: CoachState) => void;
};

// Escucha mensajes de un iframe coach. Devuelve función de limpieza.
export function listenToCoach(
  iframe: HTMLIFrameElement,
  handlers: Handlers
): () => void {
  function onMessage(ev: MessageEvent) {
    // Aceptar solo mensajes del propio iframe (mismo origen).
    if (ev.source !== iframe.contentWindow) return;
    const raw = ev.data as { __flowin?: string; payload?: CoachState } | undefined;
    // Estado emitido por los coaches del Suite ({__flowin:'state', payload}).
    if (raw && raw.__flowin === "state" && raw.payload) {
      handlers.onState?.(raw.payload);
      return;
    }
    const msg = ev.data as CoachMessage | undefined;
    if (!msg || typeof msg.type !== "string") return;
    switch (msg.type) {
      case "COACH_READY":
        handlers.onReady?.();
        break;
      case "PROGRESS_SAVE":
        handlers.onProgressSave?.(msg.payload);
        break;
      case "PROGRESS_LOAD_REQUEST":
        handlers.onLoadRequest?.();
        break;
      case "NAVIGATE_BACK":
        handlers.onNavigateBack?.();
        break;
    }
  }
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

export function sendToCoach(iframe: HTMLIFrameElement, msg: ShellMessage): void {
  iframe.contentWindow?.postMessage(msg, "*");
}
