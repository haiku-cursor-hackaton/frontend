import { useMemo, useState } from "react";
import { Badge, Card, cx } from "@/components/ui";
import { businessById, usageEvents } from "@/data/mock";
import { formatDateTime, formatLatency, formatMoney } from "@/lib/money";
import type { UCPOperation, UsageEvent } from "@/types/ucp";

type Filter = "todos" | "compras" | "consultas" | "errores";

const OPERATION_LABEL: Record<UCPOperation, string> = {
  search_catalog: "search_catalog",
  lookup_catalog: "lookup_catalog",
  get_product: "get_product",
  create_checkout: "create_checkout",
  get_checkout: "get_checkout",
  update_checkout: "update_checkout",
  complete_checkout: "complete_checkout",
  cancel_checkout: "cancel_checkout",
  get_order: "get_order",
};

const CAPABILITY_TONE: Record<
  UsageEvent["capability"],
  "brand" | "accent" | "warn"
> = {
  catalog: "brand",
  checkout: "accent",
  order: "warn",
};

const STATUS: Record<
  UsageEvent["status"],
  { label: string; tone: "accent" | "warn" | "danger" }
> = {
  ok: { label: "OK", tone: "accent" },
  pending: { label: "Pendiente", tone: "warn" },
  error: { label: "Error", tone: "danger" },
};

const PURCHASE_OPS: UCPOperation[] = ["create_checkout", "complete_checkout"];

export default function Historial() {
  const [filter, setFilter] = useState<Filter>("todos");

  const rows = useMemo(() => {
    const sorted = [...usageEvents].sort((a, b) =>
      a.occurred_at < b.occurred_at ? 1 : -1,
    );
    if (filter === "todos") return sorted;
    if (filter === "compras")
      return sorted.filter(
        (e) => e.is_purchase || PURCHASE_OPS.includes(e.operation),
      );
    if (filter === "errores") return sorted.filter((e) => e.status === "error");
    return sorted.filter((e) => e.capability === "catalog" || e.capability === "order");
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Historial agéntico</h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Fila = 1 llamada MCP registrada en <code>usage_events</code>.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
          {(["todos", "compras", "consultas", "errores"] as Filter[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cx(
                  "rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                  filter === f
                    ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-fg)]"
                    : "text-[var(--color-muted)]",
                )}
              >
                {f}
              </button>
            ),
          )}
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-subtle)]">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Operación</th>
                <th className="px-5 py-3 font-medium">Capability</th>
                <th className="px-5 py-3 font-medium">Transport</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Comercio</th>
                <th className="px-5 py-3 text-right font-medium">Latencia</th>
                <th className="px-5 py-3 text-right font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const merchant = businessById(e.business_id);
                return (
                  <tr
                    key={e.id}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-5 py-3 text-[var(--color-muted)] whitespace-nowrap">
                      {formatDateTime(e.occurred_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-[var(--color-fg)]">
                          {OPERATION_LABEL[e.operation]}
                        </code>
                        {e.is_purchase ? (
                          <Badge tone="accent">compra</Badge>
                        ) : null}
                      </div>
                      {e.product_ref ? (
                        <div className="text-xs text-[var(--color-subtle)]">
                          {e.product_ref}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={CAPABILITY_TONE[e.capability]}>
                        {e.capability}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-muted)]">
                      {e.transport.toUpperCase()}
                    </td>
                    <td className="px-5 py-3">
                      <div>{e.client_name ?? "—"}</div>
                      <div className="text-xs text-[var(--color-subtle)]">
                        req · {e.request_id}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {merchant?.name ?? e.business_id}
                    </td>
                    <td className="px-5 py-3 text-right text-[var(--color-muted)]">
                      {formatLatency(e.latency_ms)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {e.revenue_minor
                        ? formatMoney(e.revenue_minor, "USD")
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS[e.status].tone}>
                        {STATUS[e.status].label}
                      </Badge>
                      {e.error_code ? (
                        <div className="mt-0.5 text-[10px] text-[var(--color-danger)]">
                          {e.error_code}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-8 text-center text-sm text-[var(--color-subtle)]"
                  >
                    Sin eventos para este filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-[var(--color-subtle)]">
        Cada fila proviene de una tool MCP invocada contra{" "}
        <code>POST /ucp/mcp</code> o del REST equivalente. El comercio ve las
        suyas en <a className="underline" href="/comercio">/comercio</a>.
      </p>
    </div>
  );
}
