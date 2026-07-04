import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Badge, Button, Field, Input } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { WELCOME_BONUS_MINOR } from "@/data/mock";

export default function Login() {
  const { signIn, signUp, signInWithOAuth, demoMode } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"up" | "in">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === "up" ? signUp : signIn;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) setError(error);
    else navigate("/");
  }

  async function oauth(provider: "google" | "github") {
    setError(null);
    const { error } = await signInWithOAuth(provider);
    if (error) setError(error);
    else if (demoMode) navigate("/");
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">genko</span>
            <Badge tone="brand">UCP</Badge>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            Compra con tus agentes de IA. Conecta comercios y clientes vía UCP.
          </p>
        </div>

        <div className="mb-4 inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
          {(["up", "in"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                "rounded-md px-3 py-1.5 text-sm transition-colors " +
                (mode === m
                  ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-fg)]"
                  : "text-[var(--color-muted)]")
              }
            >
              {m === "up" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          {error ? (
            <p className="text-xs text-[var(--color-danger)]">{error}</p>
          ) : null}

          <Button type="submit" variant="primary" full disabled={busy}>
            {busy ? "Procesando…" : mode === "up" ? "Crear cuenta" : "Entrar"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-[var(--color-subtle)]">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          o continúa con
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <div className="flex gap-2">
          <Button full onClick={() => oauth("google")}>
            Google
          </Button>
          <Button full onClick={() => oauth("github")}>
            GitHub
          </Button>
        </div>

        {mode === "up" ? (
          <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] p-3 text-sm">
            <span className="font-medium text-[var(--color-accent)]">
              Bono de bienvenida:
            </span>{" "}
            te regalamos {formatMoney(WELCOME_BONUS_MINOR, "USD")} en saldo para
            probar compras agénticas.
          </div>
        ) : null}

        <p className="mt-4 text-center text-xs text-[var(--color-subtle)]">
          {demoMode
            ? "Modo demo: cualquier email + contraseña (4+) funciona."
            : "Autenticación gestionada por Supabase."}
        </p>
      </div>
    </div>
  );
}
