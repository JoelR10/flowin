import { useState } from "react";
import { useAuth } from "../app/auth";

// Login obligatorio (email + contraseña) cuando Supabase está configurado.
export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    const fn = mode === "in" ? signIn : signUp;
    const err = await fn(email.trim(), password);
    setBusy(false);
    if (err) {
      // signUp con confirmación por email devuelve un "error" informativo.
      if (mode === "up" && /confirmar/i.test(err)) setInfo(err);
      else setError(err);
    } else if (mode === "up") {
      setInfo("Cuenta creada. Si pide confirmación, revisá tu email.");
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center px-6 safe-t">
      <div className="mb-6 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ac/15 text-3xl">
          🧠
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Flowin</h1>
        <p className="shell-muted mt-1 text-sm">
          {mode === "in" ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
        </p>
      </div>

      <form onSubmit={submit} className="shell-card rounded-2xl p-5">
        <label className="text-xs font-semibold shell-muted">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@email.com"
          className="shell-card mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ac"
        />

        <label className="mt-3 block text-xs font-semibold shell-muted">Contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="shell-card mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ac"
        />

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-400">
            {error}
          </p>
        )}
        {info && (
          <p className="mt-3 rounded-lg border border-green-500/40 bg-green-500/10 p-2 text-xs text-green-500">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-ac py-3 text-center font-bold text-black transition active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "Un momento…" : mode === "in" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode((m) => (m === "in" ? "up" : "in"));
          setError("");
          setInfo("");
        }}
        className="mt-4 text-center text-sm font-semibold text-ac"
      >
        {mode === "in" ? "¿No tenés cuenta? Crear una" : "¿Ya tenés cuenta? Iniciar sesión"}
      </button>
    </div>
  );
}
