import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useBootstrapAccount, useBootstrapMerchant } from "@/hooks/useData";
import { WELCOME_BONUS_MINOR } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button, Field, Input, Textarea } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import { formatMoney } from "@/lib/money";
import type { AccountType } from "@/types/ucp";

export default function Login() {
  const { signIn, signUp, signInWithOAuth, demoMode } = useAuth();
  const bootstrap = useBootstrapAccount();
  const bootstrapMerchant = useBootstrapMerchant();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("client");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignUp && accountType === "business") {
      if (!businessCategory.trim() || !businessDescription.trim()) {
        setError("Categoria y descripcion son obligatorias.");
        return;
      }
    }
    setBusy(true);
    const { error: authError } = isSignUp
      ? await signUp(email, password, accountType, name.trim())
      : await signIn(email, password);
    if (authError) {
      setBusy(false);
      setError(authError);
      return;
    }

    if (isSignUp && isSupabaseConfigured) {
      try {
        const trimmedName = name.trim();
        if (accountType === "client") {
          await bootstrap.mutateAsync({
            full_name: trimmedName || undefined,
          });
        } else if (accountType === "business") {
          await bootstrapMerchant.mutateAsync({
            full_name: trimmedName || undefined,
            business_name: trimmedName || undefined,
            category: businessCategory.trim(),
            description: businessDescription.trim(),
          });
        }
      } catch (err) {
        setBusy(false);
        setError(
          err instanceof Error
            ? err.message
            : "Cuenta creada, pero falló la configuración inicial.",
        );
        return;
      }
    }

    setBusy(false);
    navigate(isSignUp && accountType === "business" ? "/comercio" : "/");
  }

  async function oauth(provider: "google" | "github") {
    setError(null);
    const { error: authError } = await signInWithOAuth(provider);
    if (authError) setError(authError);
    else if (demoMode) navigate("/");
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <ThemeToggle className="absolute right-4 top-4 z-10" />
      <div className="hidden flex-col justify-between bg-[var(--color-brand-strong)] p-10 text-[var(--color-on-brand)] lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--color-on-brand)_16%,transparent)] text-sm font-bold">
            g
          </span>
          <span className="text-lg font-semibold">genko</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">
            Commerce agéntico
            <br />
            sobre UCP
          </h2>
          <p className="max-w-xs text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-on-brand)_62%,transparent)]">
            Conecta tu wallet, emite API keys MCP y deja que tus agentes compren
            en comercios reales.
          </p>
        </div>

        <p className="text-xs text-[color-mix(in_srgb,var(--color-on-brand)_44%,transparent)]">
          {formatMoney(WELCOME_BONUS_MINOR, "USD")} de saldo de bienvenida al
          registrarte
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-brand-strong)] text-sm font-bold text-[var(--color-on-brand)]">
                g
              </span>
              <span className="text-lg font-semibold">genko</span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-semibold">
              {isSignUp ? "Crea tu cuenta" : "Bienvenido de vuelta"}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {isSignUp
                ? "Empieza con saldo simulado para probar compras agénticas."
                : "Ingresa con tu email y contraseña."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isSignUp ? (
              <div>
                <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">
                  Tipo de cuenta
                </span>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                  {[
                    {
                      id: "client" as AccountType,
                      label: "Cliente",
                      hint: "Wallet y agente MCP",
                    },
                    {
                      id: "business" as AccountType,
                      label: "Comercio",
                      hint: "Tienda y SDK",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAccountType(option.id)}
                      className={`rounded-md px-3 py-2 text-left transition-all ${
                        accountType === option.id
                          ? "bg-[var(--color-surface-2)] text-[var(--color-fg)] shadow-[var(--shadow-card)]"
                          : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]/60"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="block text-[10px] text-[var(--color-subtle)]">
                        {option.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isSignUp ? (
              <Field
                label={
                  accountType === "business"
                    ? "Nombre del comercio"
                    : "Nombre"
                }
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    accountType === "business"
                      ? "Mi tienda"
                      : "Tu nombre"
                  }
                  autoComplete="name"
                  required
                />
              </Field>
            ) : null}

            {isSignUp && accountType === "business" ? (
              <>
                <Field label="Categoria">
                  <Input
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    placeholder="Ej. moda, electronica, alimentos"
                    required
                  />
                </Field>
                <Field label="Descripcion">
                  <Textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Cuenta que vende tu tienda y que la hace unica"
                    rows={3}
                    required
                  />
                </Field>
              </>
            ) : null}

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Contraseña">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
              />
            </Field>

            {error ? (
              <p className="rounded-lg bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-danger)]">
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" full disabled={busy}>
              {busy
                ? "Procesando…"
                : isSignUp
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[var(--color-muted)]">
            {isSignUp ? "¿Ya tienes cuenta?" : "¿Primera vez?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp((v) => !v);
                setError(null);
              }}
              className="font-medium text-[var(--color-fg)] underline-offset-2 hover:underline"
            >
              {isSignUp ? "Inicia sesión" : "Crea una cuenta"}
            </button>
          </p>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--color-subtle)]">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            o
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

          {demoMode ? (
            <p className="mt-6 text-center text-xs text-[var(--color-subtle)]">
              Modo demo — cualquier email y contraseña de 4+ caracteres funciona.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
