import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../app/store";

const slides = [
  {
    emoji: "🧠",
    title: "Tus coaches, en un solo lugar",
    body: "Enfoque, hábitos, finanzas, gym y más. Abrí el que necesités y empezá."
  },
  {
    emoji: "💾",
    title: "Local y privado",
    body: "Todo se guarda en tu dispositivo. Sin cuenta, sin servidor, funciona offline."
  },
  {
    emoji: "📲",
    title: "Instalable",
    body: "Sumala a tu pantalla de inicio como una app más. Lista cuando la necesités."
  }
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const { finishOnboarding } = useStore();
  const navigate = useNavigate();
  const last = i === slides.length - 1;

  function done() {
    finishOnboarding();
    navigate("/", { replace: true });
  }

  const s = slides[i];

  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-10 safe-t">
      <div className="flex justify-end">
        <button onClick={done} className="shell-muted text-sm font-semibold">
          Saltar
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-24 w-24 place-items-center rounded-3xl bg-ac/15 text-5xl">
          {s.emoji}
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">{s.title}</h1>
        <p className="shell-muted mt-2 max-w-xs text-sm leading-relaxed">{s.body}</p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-6 bg-ac" : "w-2 bg-gray-500/50"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => (last ? done() : setI((v) => v + 1))}
        className="rounded-xl bg-ac py-3.5 text-center font-bold text-black transition active:scale-[0.99]"
      >
        {last ? "Empezar" : "Siguiente"}
      </button>
    </div>
  );
}
