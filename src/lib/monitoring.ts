import * as Sentry from "@sentry/react";

// Monitoreo env-gated. Sin VITE_SENTRY_DSN no hace nada (no se inicia Sentry).
let started = false;

export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || started) return;
  started = true;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    // No grabamos sesiones de usuario por privacidad (datos sensibles en pantalla).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0
  });
}

export const ErrorBoundary = Sentry.ErrorBoundary;

export function captureError(err: unknown): void {
  if (started) Sentry.captureException(err);
}
