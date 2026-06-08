import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Coaches", icon: "🧠", end: true },
  { to: "/analisis", label: "Mi vida", icon: "🧭", end: false },
  { to: "/favoritos", label: "Favoritos", icon: "⭐", end: false },
  { to: "/ajustes", label: "Ajustes", icon: "⚙️", end: false }
];

export function BottomNav() {
  return (
    <nav className="shell-card safe-b sticky bottom-0 z-10 flex justify-around border-x-0 border-b-0 px-2 pt-2">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-xs font-semibold transition ${
              isActive ? "text-ac" : "shell-muted hover:text-txt"
            }`
          }
        >
          <span className="text-lg leading-none">{it.icon}</span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
