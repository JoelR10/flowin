import { COACHES, getCoachBySlug } from "../data/coaches";
import type { Coach } from "../types";

// Lee los datos que cada coach guarda en su propio localStorage. El shell y los
// coaches comparten origen, así que el shell puede leer esas claves directo.
// No recalcula puntajes (eso vive dentro del coach): entrega los datos crudos,
// recortados, para que la IA los interprete.

export type CoachSnapshot = {
  id: string;
  name: string;
  category: string;
  purpose: string;
  hasData: boolean;
  data: unknown; // datos crudos compactados, o null si el coach no se usó
};

const MAX_ITEMS = 40; // recorta arrays largos para no inflar el prompt

function readRaw(key: string): unknown {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}

function capArrays(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(-MAX_ITEMS);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = Array.isArray(v) ? v.slice(-MAX_ITEMS) : v;
    }
    return out;
  }
  return value;
}

function hasContent(raw: unknown): boolean {
  if (!raw) return false;
  if (Array.isArray(raw)) return raw.length > 0;
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    // coaches del Suite guardan {cfg, entries}
    if (Array.isArray(o.entries)) return o.entries.length > 0;
    // gym guarda {plan, entrenos, cuerpo, perfil}
    if (Array.isArray(o.entrenos) || Array.isArray(o.cuerpo)) {
      return (
        (Array.isArray(o.entrenos) && o.entrenos.length > 0) ||
        (Array.isArray(o.cuerpo) && o.cuerpo.length > 0)
      );
    }
    return Object.keys(o).length > 0;
  }
  return false;
}

export function snapshotOf(coach: Coach): CoachSnapshot {
  const raw = readRaw(coach.storageKey);
  return {
    id: coach.id,
    name: coach.name,
    category: coach.category,
    purpose: coach.longDescription
      ? `${coach.shortDescription} ${coach.longDescription}`
      : coach.shortDescription,
    hasData: hasContent(raw),
    data: raw ? capArrays(raw) : null
  };
}

export function snapshotById(id: string): CoachSnapshot | null {
  const c = getCoachBySlug(id) ?? COACHES.find((x) => x.id === id);
  return c ? snapshotOf(c) : null;
}

export function snapshotAll(): CoachSnapshot[] {
  return COACHES.map(snapshotOf);
}

export function coachesWithData(): CoachSnapshot[] {
  return snapshotAll().filter((s) => s.hasData);
}
