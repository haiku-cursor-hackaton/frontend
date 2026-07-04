import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-[var(--color-fg)]">
        {children}
      </h2>
      {hint ? (
        <span className="text-xs text-[var(--color-subtle)]">{hint}</span>
      ) : null}
    </div>
  );
}

type Tone = "brand" | "accent" | "warn" | "danger" | "neutral";

const toneText: Record<Tone, string> = {
  brand: "text-[var(--color-brand)]",
  accent: "text-[var(--color-accent)]",
  warn: "text-[var(--color-warn)]",
  danger: "text-[var(--color-danger)]",
  neutral: "text-[var(--color-fg)]",
};

export function Stat({
  value,
  label,
  tone = "neutral",
}: {
  value: ReactNode;
  label: string;
  tone?: Tone;
}) {
  return (
    <Card>
      <div className={cx("text-2xl font-bold", toneText[tone])}>{value}</div>
      <div className="mt-1 text-xs text-[var(--color-muted)]">{label}</div>
    </Card>
  );
}

const badgeTone: Record<Tone, string> = {
  brand: "bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] text-[var(--color-brand)]",
  accent:
    "bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]",
  warn: "bg-[color-mix(in_srgb,var(--color-warn)_18%,transparent)] text-[var(--color-warn)]",
  danger:
    "bg-[color-mix(in_srgb,var(--color-danger)_18%,transparent)] text-[var(--color-danger)]",
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        badgeTone[tone],
      )}
    >
      {children}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  full?: boolean;
};

export function Button({
  variant = "secondary",
  full,
  className,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-fg)_15%,transparent)]";
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--color-brand-strong)] text-white shadow-[var(--shadow-card)] hover:bg-[var(--color-brand)]",
    secondary:
      "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
    ghost:
      "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
  };
  return (
    <button
      className={cx(base, variants[variant], full && "w-full", className)}
      {...rest}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-subtle)] focus:border-[var(--color-fg)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-fg)_10%,transparent)]",
        props.className,
      )}
    />
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative h-5 w-9 rounded-full transition-colors",
        checked ? "bg-[var(--color-brand-strong)]" : "bg-[var(--color-border-strong)]",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
