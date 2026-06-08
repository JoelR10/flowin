import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useStore } from "./app/store";
import { BottomNav } from "./components/BottomNav";
import Catalogo from "./pages/Catalogo";
import CoachView from "./pages/CoachView";
import Analisis from "./pages/Analisis";
import Favoritos from "./pages/Favoritos";
import Ajustes from "./pages/Ajustes";
import Acerca from "./pages/Acerca";
import Onboarding from "./pages/Onboarding";

// Posición de scroll por ruta → volver al catálogo sin perder el lugar (RF-04).
const scrollPositions = new Map<string, number>();

export default function App() {
  const { ready, prefs } = useStore();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Restaura el scroll guardado al entrar a una ruta.
  useEffect(() => {
    const el = mainRef.current;
    if (el) el.scrollTop = scrollPositions.get(location.pathname) ?? 0;
  }, [location.pathname]);

  // Evita parpadeo hasta cargar prefs desde IndexedDB.
  if (!ready) {
    return (
      <div className="grid h-full place-items-center shell-muted">Cargando…</div>
    );
  }

  // Onboarding gate (RF-09): primera vez → onboarding; no se repite.
  if (!prefs.onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  const isCoachView = location.pathname.startsWith("/coach/");
  const isOnboarding = location.pathname === "/onboarding";
  const chromeless = isCoachView || isOnboarding;

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col lg:max-w-5xl">
      <main
        ref={mainRef}
        onScroll={() =>
          scrollPositions.set(location.pathname, mainRef.current?.scrollTop ?? 0)
        }
        className={
          chromeless ? "min-h-0 flex-1" : "min-h-0 flex-1 overflow-y-auto"
        }
      >
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/analisis" element={<Analisis />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/acerca" element={<Acerca />} />
          <Route path="/coach/:slug" element={<CoachView />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!chromeless && <BottomNav />}
    </div>
  );
}
