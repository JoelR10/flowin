import { useStore } from "../app/store";

// Botón rápido de tema, a la vista en las pantallas principales (RF-08).
// Así el usuario cambia claro/oscuro sin entrar a Ajustes.
export function ThemeToggle() {
  const { prefs, toggleTheme } = useStore();
  const dark = prefs.theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={dark ? "Tema claro" : "Tema oscuro"}
      className="shell-card grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition hover:scale-105"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
