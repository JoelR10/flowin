import type { Coach } from "../types";

// Manifiesto de coaches. Regla de oro (RNF-08): sumar un coach =
// copiar su carpeta a public/coaches/<id>/ + agregar una entrada acá.
// Cero cambios en el shell.
export const COACHES: Coach[] = [
  {
    id: "habitos",
    storageKey: "flowin_coach_v1_04",
    slug: "habitos",
    name: "Hábitos y Disciplina",
    shortDescription:
      "Control diario de hábitos base: sueño, agua, entreno, alimentación, estudio y pantalla.",
    longDescription:
      "El motor convierte cada día en un puntaje ponderado de disciplina, con semáforo y alertas.",
    category: "Disciplina",
    tags: ["hábitos", "rutina", "disciplina", "sueño"],
    icon: "🌅",
    color: "#f0a868",
    path: "/coaches/habitos/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "metas",
    storageKey: "flowin_coach_v1_05",
    slug: "metas",
    name: "Metas y OKR Personal",
    shortDescription:
      "OKRs y metas personales con porcentaje de avance, días restantes y semáforo.",
    longDescription: "Evita la dispersión limitando las metas activas.",
    category: "Metas",
    tags: ["okr", "metas", "objetivos", "foco"],
    icon: "🎯",
    color: "#7c83ff",
    path: "/coaches/metas/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "negocios",
    storageKey: "flowin_coach_v1_06",
    slug: "negocios",
    name: "Negocios y Ventas",
    shortDescription:
      "Pipeline de ventas con margen, valor ponderado (forecast) y disciplina de seguimiento.",
    longDescription:
      "El puntaje mide el cumplimiento del forecast vs tu meta mensual.",
    category: "Negocios / Ventas",
    tags: ["ventas", "pipeline", "forecast", "negocios"],
    icon: "💼",
    color: "#27c498",
    path: "/coaches/negocios/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "proyectos",
    storageKey: "flowin_coach_v1_07",
    slug: "proyectos",
    name: "Proyectos y Apps",
    shortDescription: "Salud de proyectos: progreso, riesgo, bloqueos y deadlines.",
    longDescription: "El puntaje es la salud promedio de tus proyectos activos.",
    category: "Proyectos",
    tags: ["proyectos", "apps", "deadlines", "riesgo"],
    icon: "🚀",
    color: "#4db5ff",
    path: "/coaches/proyectos/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "contenido",
    storageKey: "flowin_coach_v1_08",
    slug: "contenido",
    name: "Contenido y Marca Personal",
    shortDescription:
      "Producción y rendimiento de contenido: ejecución, alcance, engagement y leads.",
    longDescription: "Premia publicar más que perfeccionar.",
    category: "Contenido / Marca",
    tags: ["contenido", "marca", "redes", "engagement"],
    icon: "🎬",
    color: "#ff6fae",
    path: "/coaches/contenido/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "aprendizaje",
    storageKey: "flowin_coach_v1_09",
    slug: "aprendizaje",
    name: "Aprendizaje y Habilidades",
    shortDescription:
      "Estudio con evidencia: cumplimiento de tiempo y comprensión real.",
    longDescription: "El puntaje combina ejecución y calidad por sesión.",
    category: "Aprendizaje",
    tags: ["estudio", "aprendizaje", "habilidades", "repaso"],
    icon: "📚",
    color: "#c08bff",
    path: "/coaches/aprendizaje/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "salud",
    storageKey: "flowin_coach_v1_10",
    slug: "salud",
    name: "Salud y Recuperación",
    shortDescription:
      "Readiness no médico: sueño, dolor, fatiga, energía, estrés, movilidad e hidratación.",
    longDescription:
      "Autoconocimiento, no reemplaza criterio médico. Ayuda a decidir si subir o bajar carga.",
    category: "Salud / Recuperación",
    tags: ["salud", "recuperación", "readiness", "descanso"],
    icon: "🫀",
    color: "#5fd0c4",
    path: "/coaches/salud/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "decisiones",
    storageKey: "flowin_coach_v1_11",
    slug: "decisiones",
    name: "Decisiones y Compras",
    shortDescription:
      "Evalúa compras y decisiones por necesidad, beneficio, presupuesto y riesgo.",
    longDescription:
      "Devuelve un score y una recomendación: comprar, esperar o descartar.",
    category: "Decisiones / Compras",
    tags: ["decisiones", "compras", "presupuesto", "riesgo"],
    icon: "🧭",
    color: "#f2c14e",
    path: "/coaches/decisiones/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "relaciones",
    storageKey: "flowin_coach_v1_12",
    slug: "relaciones",
    name: "Relaciones y Networking",
    shortDescription:
      "Cuida tu red: prioridad, valor, confianza y frecuencia de contacto.",
    longDescription: "Penaliza relaciones frías y seguimientos vencidos.",
    category: "Relaciones / Contactos",
    tags: ["relaciones", "networking", "contactos", "seguimiento"],
    icon: "🤝",
    color: "#ff8a5c",
    path: "/coaches/relaciones/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "gym",
    storageKey: "gym_v1",
    slug: "gym",
    name: "Gym Coach App",
    shortDescription:
      "Calorías y macros, rutina semanal, planificador de comidas y registro de entrenos.",
    longDescription:
      "Perfil + dashboard de decisiones de entreno y nutrición.",
    category: "Entreno / Nutrición",
    tags: ["gym", "entreno", "nutrición", "macros"],
    icon: "🏋️",
    color: "#ff5d73",
    path: "/coaches/gym/index.html",
    version: "1.0",
    supportsProgress: true
  },
  {
    id: "agenda",
    storageKey: "agenda",
    slug: "agenda",
    name: "Agenda",
    shortDescription:
      "Cronograma personal con recordatorios y bloques de tiempo del día.",
    longDescription:
      "Organiza tu día por actividades, con avisos configurables. Guarda local.",
    category: "Organización",
    tags: ["agenda", "cronograma", "tiempo", "recordatorios"],
    icon: "🗓️",
    color: "#6aa6ff",
    path: "/coaches/agenda/index.html",
    version: "1.0",
    supportsProgress: false
  },
  {
    id: "finanzas",
    storageKey: "finanzas_planificador_v1",
    slug: "finanzas",
    name: "Planificador Financiero",
    shortDescription:
      "Presupuesto personal: ingresos, gastos, ahorro y metas financieras.",
    longDescription: "Planifica y sigue tus finanzas mes a mes. Guarda local.",
    category: "Finanzas",
    tags: ["finanzas", "presupuesto", "ahorro", "gastos"],
    icon: "💰",
    color: "#3ecf8e",
    path: "/coaches/finanzas/index.html",
    version: "2.0",
    supportsProgress: false
  }
];

export const CATEGORIES: string[] = Array.from(
  new Set(COACHES.map((c) => c.category))
).sort((a, b) => a.localeCompare(b, "es"));

export function getCoachBySlug(slug: string): Coach | undefined {
  return COACHES.find((c) => c.slug === slug);
}
