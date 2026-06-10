import { SignIn } from "@clerk/clerk-react";

// Login con Clerk: muestra Google + correo automáticamente según lo que
// habilites en el dashboard de Clerk. routing="virtual" porque esta pantalla
// se renderiza FUERA del HashRouter (la puerta AuthGate está por encima).
//
// Tema: Flowin es oscuro por defecto; respetamos el preferido del sistema.
const prefersDark =
  typeof window !== "undefined" &&
  !window.matchMedia?.("(prefers-color-scheme: light)").matches;

const appearance = {
  variables: {
    colorPrimary: "#6aa6ff",
    borderRadius: "0.9rem",
    ...(prefersDark
      ? {
          colorBackground: "#0f141b",
          colorInputBackground: "#0f141b",
          colorInputText: "#e5e7eb",
          colorText: "#e5e7eb",
          colorTextSecondary: "#9aa4b2"
        }
      : {})
  },
  elements: { rootBox: "mx-auto", card: "shadow-none" }
};

export function AuthScreen() {
  return (
    <div className="grid h-full place-items-center px-4 py-8 safe-t">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ac/15 text-3xl">
            🧠
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Flowin</h1>
          <p className="shell-muted mt-1 text-sm">Iniciá sesión para continuar</p>
        </div>
        <div className="grid place-items-center">
          <SignIn routing="virtual" appearance={appearance} forceRedirectUrl="/" />
        </div>
      </div>
    </div>
  );
}
