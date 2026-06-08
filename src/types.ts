// Contrato de un coach (manifiesto). Ver REQUERIMIENTOS_FLOWIN.md §5.4.
export type Coach = {
  id: string; // único, estable
  slug: string; // para la URL
  name: string; // nombre visible
  shortDescription: string; // para la tarjeta
  longDescription?: string; // para detalle
  category: string; // p.ej. "Productividad", "Bienestar"
  tags: string[];
  icon: string; // emoji o nombre de ícono
  color: string; // color de acento (hex)
  path: string; // "/coaches/<id>/index.html"
  version: string;
  supportsProgress: boolean; // exporta fila estándar COACH_ID/PUNTAJE/...
  storageKey: string; // clave localStorage donde el coach guarda su estado
};

export type Theme = "light" | "dark";

export type UserPrefs = {
  theme: Theme;
  onboardingDone: boolean;
  locale: string;
};

export type RecentEntry = { coachId: string; lastOpenedAt: number };
