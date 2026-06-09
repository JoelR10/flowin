import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../app/store";
import { useAuth } from "../app/auth";
import { supabaseEnabled } from "../lib/supabase";
import { refreshServerStatus, serverHasKey } from "../lib/ai";
import {
  MODELS,
  PROVIDERS,
  getAIConfig,
  setAIConfig,
  testConnection,
  type AIConfig,
  type Provider
} from "../lib/ai";

export default function Ajustes() {
  const { prefs, toggleTheme } = useStore();
  const { email, signOut } = useAuth();
  const navigate = useNavigate();
  const dark = prefs.theme === "dark";

  const [ai, setAi] = useState<AIConfig>(getAIConfig());
  const [guide, setGuide] = useState(true);
  const [, forceTick] = useState(0);

  // Consulta si el servidor ya tiene keys → IA sin pedir nada al usuario.
  useEffect(() => {
    void refreshServerStatus().then(() => forceTick((t) => t + 1));
  }, []);
  const viaServer = serverHasKey(ai.provider);
  const [test, setTest] = useState<{ state: "idle" | "loading" | "ok" | "err"; msg: string }>({
    state: "idle",
    msg: ""
  });

  function update(patch: Partial<AIConfig>) {
    const next = { ...ai, ...patch };
    setAi(next);
    setAIConfig(next);
    setTest({ state: "idle", msg: "" });
  }
  function setKey(value: string) {
    update({ keys: { ...ai.keys, [ai.provider]: value } });
  }
  function setModel(value: string) {
    update({ models: { ...ai.models, [ai.provider]: value } });
  }
  function setProxy(value: string) {
    update({ proxyUrl: value });
  }
  function setToken(value: string) {
    update({ proxyToken: value });
  }

  const prov = PROVIDERS.find((p) => p.id === ai.provider)!;
  const currentKey = ai.keys[ai.provider] ?? "";

  async function probar() {
    setTest({ state: "loading", msg: "" });
    try {
      await testConnection(ai);
      setTest({ state: "ok", msg: "Conexión OK ✓" });
    } catch (e) {
      setTest({ state: "err", msg: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="px-5 pb-6 pt-6 safe-t">
      <h1 className="text-2xl font-bold tracking-tight">Ajustes ⚙️</h1>

      <div className="mt-5 space-y-3">
        {/* Tema (RF-08) */}
        <div className="shell-card flex items-center justify-between rounded-2xl p-4">
          <div>
            <p className="font-semibold">Tema</p>
            <p className="shell-muted text-sm">{dark ? "Oscuro" : "Claro"} · se recuerda</p>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={dark}
            aria-label="Alternar tema claro/oscuro"
            className={`relative h-7 w-12 rounded-full transition ${dark ? "bg-ac" : "bg-gray-400"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                dark ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* IA */}
        <div className="shell-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <p className="font-semibold">✨ Asistente IA</p>
              <p className="shell-muted text-sm">
                Analiza tus coaches. Gemini es gratis; también Claude o ChatGPT con tu key. Apagado por defecto.
              </p>
            </div>
            <button
              onClick={() => update({ enabled: !ai.enabled })}
              role="switch"
              aria-checked={ai.enabled}
              aria-label="Activar IA"
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                ai.enabled ? "bg-ac" : "bg-gray-400"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  ai.enabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {ai.enabled && (
            <div className="mt-4 space-y-3 border-t shell-border pt-4">
              {/* Proveedor */}
              <div>
                <label className="text-xs font-semibold shell-muted">Proveedor</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => update({ provider: p.id as Provider })}
                      className={`relative rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                        ai.provider === p.id
                          ? "border-ac bg-ac/15 text-ac"
                          : "shell-border shell-muted hover:text-txt"
                      }`}
                    >
                      {p.short}
                      {p.free && (
                        <span className="absolute -right-1 -top-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-bold text-black">
                          gratis
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {viaServer && (
                <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-xs text-green-500">
                  ✓ IA lista vía el servidor de Flowin — <b>no necesitás pegar ninguna clave</b>.
                  Ya podés analizar tus coaches. (Si querés, podés usar tu propia clave abajo.)
                </div>
              )}

              {/* Guía rápida por proveedor (PC y móvil) */}
              <div className="rounded-xl border shell-border p-3">
                <p className="text-xs shell-muted">{prov.tagline}</p>
                <button
                  onClick={() => setGuide((g) => !g)}
                  className="mt-2 text-xs font-bold text-ac"
                >
                  {guide ? "▾" : "▸"} 📘 Cómo conectar {prov.short} (PC y móvil)
                </button>
                {guide && (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs shell-muted">
                    {prov.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                )}
                <a
                  href={prov.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-lg bg-ac/15 px-3 py-1.5 text-xs font-bold text-ac"
                >
                  {prov.keyHint} →
                </a>
              </div>

              {ai.provider === "openai" && (
                <div className="space-y-2">
                  <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-500">
                    ChatGPT se conecta vía el servidor de Flowin (OpenAI bloquea el navegador).
                    Corré <code>npm run server</code>. Gemini y Claude van directo, sin server.
                  </p>
                  <div>
                    <label className="text-xs font-semibold shell-muted">URL del servidor (proxy)</label>
                    <input
                      type="text"
                      value={ai.proxyUrl}
                      onChange={(e) => setProxy(e.target.value)}
                      placeholder="/api/ai"
                      autoComplete="off"
                      className="shell-card mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ac"
                    />
                    <p className="mt-1 text-[11px] shell-muted">
                      Local: <code>/api/ai</code> (con el server corriendo). Producción: la URL de tu
                      server, p.ej. <code>https://tu-server.com/api/ai</code>.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold shell-muted">
                      Token del servidor (opcional)
                    </label>
                    <input
                      type="password"
                      value={ai.proxyToken}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Solo si tu server tiene APP_TOKEN"
                      autoComplete="off"
                      className="shell-card mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ac"
                    />
                  </div>
                </div>
              )}

              {/* Key del proveedor seleccionado */}
              <div>
                <label className="text-xs font-semibold shell-muted">
                  API key · {prov.label}
                  {(viaServer || ai.provider === "openai") && " (opcional · el servidor ya tiene una)"}
                </label>
                <input
                  type="password"
                  value={currentKey}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Pegá tu clave aquí"
                  autoComplete="off"
                  className="shell-card mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ac"
                />
              </div>

              {/* Modelo del proveedor seleccionado */}
              <div>
                <label className="text-xs font-semibold shell-muted">Modelo</label>
                <select
                  value={ai.models[ai.provider]}
                  onChange={(e) => setModel(e.target.value)}
                  className="shell-card mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-ac"
                >
                  {MODELS[ai.provider].map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={probar}
                  disabled={!currentKey.trim() || test.state === "loading"}
                  className="rounded-xl bg-ac px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                >
                  {test.state === "loading" ? "Probando…" : "Probar conexión"}
                </button>
                {test.state === "ok" && (
                  <span className="text-sm font-semibold text-green-500">{test.msg}</span>
                )}
              </div>
              {test.state === "err" && (
                <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-400">
                  {test.msg}
                </p>
              )}
              <p className="text-[11px] shell-muted">
                Tus claves se guardan solo en este dispositivo. No se suben a ningún lado.
              </p>
            </div>
          )}
        </div>

        {/* Cuenta (M6) — solo si Supabase está configurado */}
        {supabaseEnabled && email && (
          <div className="shell-card flex items-center justify-between rounded-2xl p-4">
            <div className="min-w-0 pr-3">
              <p className="font-semibold">Cuenta</p>
              <p className="shell-muted truncate text-sm">{email}</p>
            </div>
            <button
              onClick={() => void signOut()}
              className="shrink-0 rounded-xl border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-400"
            >
              Cerrar sesión
            </button>
          </div>
        )}

        <Row label="Acerca de Flowin" emoji="ℹ️" onClick={() => navigate("/acerca")} />
      </div>

      <p className="shell-muted mt-6 text-xs leading-relaxed">
        {supabaseEnabled
          ? "Tus datos se sincronizan con tu cuenta y cada usuario ve solo lo suyo. También quedan en este dispositivo para uso offline. Tus claves de IA no se suben: quedan solo acá."
          : "Tus datos (preferencias, favoritos y el progreso de cada coach) viven en este dispositivo. No hay cuenta ni servidor."}
      </p>
    </div>
  );
}

function Row({
  label,
  emoji,
  onClick
}: {
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shell-card flex w-full items-center justify-between rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
    >
      <span className="flex items-center gap-3 font-semibold">
        <span className="text-lg">{emoji}</span>
        {label}
      </span>
      <span className="shell-muted">→</span>
    </button>
  );
}
