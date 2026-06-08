// Puente opcional shell ↔ coach vía postMessage (REQUERIMIENTOS_FLOWIN.md §5.3).
// Los coaches actuales guardan su propio estado, así que esto es no-op salvo
// que un coach decida hablar con el shell. Protocolo mínimo y tipado.

export type CoachMessage =
  | { type: "COACH_READY" }
  | { type: "PROGRESS_SAVE"; payload: unknown }
  | { type: "PROGRESS_LOAD_REQUEST" }
  | { type: "NAVIGATE_BACK" };

export type ShellMessage = { type: "PROGRESS_LOAD_RESPONSE"; payload: unknown };

type Handlers = {
  onReady?: () => void;
  onProgressSave?: (payload: unknown) => void;
  onLoadRequest?: () => void;
  onNavigateBack?: () => void;
};

// Escucha mensajes de un iframe coach. Devuelve función de limpieza.
export function listenToCoach(
  iframe: HTMLIFrameElement,
  handlers: Handlers
): () => void {
  function onMessage(ev: MessageEvent) {
    // Aceptar solo mensajes del propio iframe (mismo origen).
    if (ev.source !== iframe.contentWindow) return;
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
