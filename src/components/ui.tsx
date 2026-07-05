import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
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
        "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-all duration-300 ease-out hover:shadow-[var(--shadow-pop)]",
        padded && "p-3 sm:p-4 md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex min-h-0 flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]", className)}>
      {children}
    </div>
  );
}

export function CodePre({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <pre
      className={cx(
        "max-h-[min(20rem,55vh)] overflow-auto overscroll-contain rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 font-mono text-[11px] leading-relaxed whitespace-pre text-[var(--color-fg)] sm:text-xs",
        className,
      )}
    >
      {children}
    </pre>
  );
}

type TabItem<T extends string = string> = {
  id: T;
  label: string;
  meta?: ReactNode;
};

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  className,
}: {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        "flex w-full max-w-full gap-1 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-card)] sm:inline-flex sm:w-auto",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cx(
              "relative inline-flex min-h-9 flex-1 shrink-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium outline-none transition-all duration-300 ease-out sm:flex-none",
              "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-fg)_15%,transparent)]",
              selected
                ? "bg-[var(--color-fg)] text-[var(--color-surface)] shadow-[var(--shadow-card)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
            )}
          >
            <span>{tab.label}</span>
            {tab.meta != null ? (
              <span
                className={cx(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  selected
                    ? "bg-[color-mix(in_srgb,var(--color-surface)_18%,transparent)] text-[var(--color-surface)]"
                    : "bg-[var(--color-surface-2)] text-[var(--color-subtle)]",
                )}
              >
                {tab.meta}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const first = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, total);

  if (total <= pageSize) return null;

  return (
    <div
      className={cx(
        "flex flex-col gap-3 border-t border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <span>
        {first}-{last} de {total}
      </span>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2.5"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="min-w-14 text-center">
          {currentPage}/{pageCount}
        </span>
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2.5"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type MobileRecordField = {
  label: string;
  value: ReactNode;
};

type MobileRecord = {
  id: string;
  title: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  fields?: MobileRecordField[];
  footer?: ReactNode;
};

export function MobileRecordList({
  records,
  empty,
  className,
}: {
  records: MobileRecord[];
  empty: ReactNode;
  className?: string;
}) {
  if (records.length === 0) {
    return (
      <div
        className={cx(
          "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-subtle)]",
          className,
        )}
      >
        {empty}
      </div>
    );
  }

  return (
    <div className={cx("space-y-3", className)}>
      {records.map((record) => (
        <article
          key={record.id}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {record.eyebrow ? (
                <div className="mb-1 text-xs text-[var(--color-subtle)]">
                  {record.eyebrow}
                </div>
              ) : null}
              <div className="break-words text-sm font-medium text-[var(--color-fg)]">
                {record.title}
              </div>
            </div>
            {record.meta ? <div className="shrink-0">{record.meta}</div> : null}
          </div>

          {record.fields && record.fields.length > 0 ? (
            <dl className="mt-3 grid grid-cols-1 gap-3 text-xs min-[420px]:grid-cols-2">
              {record.fields.map((field) => (
                <div key={field.label} className="min-w-0">
                  <dt className="text-[var(--color-subtle)]">{field.label}</dt>
                  <dd className="mt-0.5 break-words text-[var(--color-muted)]">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {record.footer ? (
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              {record.footer}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function TabPanel({
  children,
  className,
  scroll = true,
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <div
      className={cx(
        "min-h-0 animate-panel-in",
        scroll && "overflow-auto pr-1",
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
    <div className="mb-3 flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:items-center sm:gap-3">
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
    "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-fg)_15%,transparent)]";
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--color-brand-strong)] text-[var(--color-on-brand)] shadow-[var(--shadow-card)] hover:bg-[var(--color-brand)]",
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

const fieldControlClass =
  "w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] outline-none transition-colors focus:border-[var(--color-fg)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-fg)_10%,transparent)]";

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={cx(
        fieldControlClass,
        "placeholder:text-[var(--color-subtle)]",
        props.className,
      )}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cx(
          fieldControlClass,
          "cursor-pointer appearance-none pr-9 hover:bg-[var(--color-surface-2)] disabled:cursor-not-allowed disabled:opacity-50",
          props.className,
        )}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
      />
    </div>
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
          "absolute top-0.5 h-4 w-4 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
