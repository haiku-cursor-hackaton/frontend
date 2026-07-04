import type { CurrencyCode, Total, TotalType } from "@/types/ucp";

/**
 * Formatea un importe en UNIDADES MENORES (UCP) a string de moneda.
 * `formatMoney(2500, "USD")` -> "$25.00"
 */
export function formatMoney(minor: number, currency: CurrencyCode): string {
  const value = minor / 100;
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/**
 * Formatea un importe con signo explícito. Útil para movimientos de wallet:
 * `formatSignedMoney(-1200, "USD")` -> "-$12.00"
 * `formatSignedMoney(1500, "USD")` -> "+$15.00"
 */
export function formatSignedMoney(
  minor: number,
  currency: CurrencyCode,
): string {
  const sign = minor > 0 ? "+" : minor < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(minor), currency)}`;
}

const TOTAL_LABELS: Record<TotalType, string> = {
  subtotal: "Subtotal",
  discount: "Descuento",
  shipping: "Envío",
  tax: "Impuestos",
  total: "Total",
};

export function totalLabel(type: TotalType): string {
  return TOTAL_LABELS[type];
}

export function findTotal(totals: Total[], type: TotalType): number {
  return totals.find((t) => t.type === type)?.amount ?? 0;
}

/** Fecha RFC 3339 -> texto corto en español. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Devuelve `123 ms` / `1.4 s` según la magnitud. */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}
