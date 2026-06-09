import { COACHES } from "../data/coaches";
import type { Coach } from "../types";
import type { CoachState } from "./coachBridge";

// Consejos locales (sin IA). Cada coach del Suite calcula su propio estado
// (PUNTAJE/ESTADO/ALERTA/RECOMENDACION) y lo emite al shell por postMessage; acá
// lo guardamos y armamos consejos por fórmula según ese estado. Coaches sin
// estado (gym/agenda/finanzas o no abiertos) muestran su tip por defecto.

const KEY = (id: string) => `flowin_state_${id}`;

export function saveCoachState(id: string, s: CoachState): void {
  try {
    localStorage.setItem(KEY(id), JSON.stringify({ ...s, _ts: Date.now() }));
  } catch {
    /* noop */
  }
}

function readState(id: string): CoachState | null {
  try {
    const r = localStorage.getItem(KEY(id));
    return r ? (JSON.parse(r) as CoachState) : null;
  } catch {
    return null;
  }
}

export type Sem = "green" | "yellow" | "red";

export type Advice = {
  coach: Coach;
  hasState: boolean;
  puntaje: number | null;
  estado: string | null;
  sem: Sem | null;
  consejo: string;
  alerta: string | null;
};

function semFromEstado(estado?: string | null): Sem | null {
  if (!estado) return null;
  if (/🟢|✅/.test(estado)) return "green";
  if (/🟡/.test(estado)) return "yellow";
  if (/🔴|⛔/.test(estado)) return "red";
  return null;
}

export function adviceFor(coach: Coach): Advice {
  const s = readState(coach.id);
  const puntaje =
    typeof s?.PUNTAJE === "number" && isFinite(s.PUNTAJE) ? Math.round(s.PUNTAJE) : null;
  const estado = (s?.ESTADO as string) ?? null;
  const reco = ((s?.RECOMENDACION as string) ?? "").trim();
  const alerta = ((s?.ALERTA as string) ?? "").trim();
  return {
    coach,
    hasState: Boolean(s),
    puntaje,
    estado,
    sem: semFromEstado(estado),
    consejo: reco || coach.tip,
    alerta: alerta && !/sin alertas/i.test(alerta) ? alerta : null
  };
}

export function allAdvice(): Advice[] {
  return COACHES.map(adviceFor);
}

export type LifeSummary = {
  items: Advice[];
  focus: Advice | null; // área a atender (menor puntaje)
  strong: Advice | null; // mejor área
  withState: number; // cuántos tienen estado calculado
  headline: string;
};

export function lifeSummary(): LifeSummary {
  const items = allAdvice();
  const scored = items.filter(
    (a): a is Advice & { puntaje: number } => a.puntaje !== null
  );
  scored.sort((a, b) => a.puntaje - b.puntaje);
  const focus = scored[0] ?? null;
  const strong = scored[scored.length - 1] ?? null;

  let headline: string;
  if (scored.length === 0) {
    headline = "Abrí tus coaches y registrá tus primeros datos para ver tu estado y consejos.";
  } else if (focus && focus.sem === "red") {
    headline = `Tu cuello de botella es ${focus.coach.name} (${focus.puntaje}). Empezá por ahí esta semana.`;
  } else if (focus && focus.sem === "yellow") {
    headline = `Vas bien en general. Lo más flojo: ${focus.coach.name} (${focus.puntaje}) — dale una mano.`;
  } else {
    headline = `Estás sólido en tus ${scored.length} áreas con datos. Sostené la constancia.`;
  }
  return { items, focus, strong, withState: scored.length, headline };
}
