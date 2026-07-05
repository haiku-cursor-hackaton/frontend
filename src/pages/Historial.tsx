import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Card,
  MobileRecordList,
  Pagination,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { useBusinessMap, useUsageEvents } from "@/hooks/useData";
import { OPERATION_LABEL } from "@/lib/constants";
import { formatDateTime, formatLatency, formatMoney } from "@/lib/money";
import type { UCPOperation, UsageEvent } from "@/types/ucp";

type Filter = "todos" | "compras" | "consultas" | "errores";

const CAPABILITY_TONE: Record<
  UsageEvent["capability"],
  "brand" | "accent" | "warn" | "neutral"
> = {
  catalog: "brand",
  checkout: "accent",
  order: "warn",
  wallet: "neutral",
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
const HISTORY_PAGE_SIZE = 8;

export default function Historial() {
  const [filter, setFilter] = useState<Filter>("todos");
  const [page, setPage] = useState(1);
  const { data: usageEvents = [], isLoading } = useUsageEvents();
  const { businessById } = useBusinessMap();

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
    return sorted.filter((e) => e.capability !== "checkout");
  }, [filter, usageEvents]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const pageCount = Math.max(1, Math.ceil(rows.length / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedRows = rows.slice(
    (currentPage - 1) * HISTORY_PAGE_SIZE,
    currentPage * HISTORY_PAGE_SIZE,
  );

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando historial...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Historial agentico</h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Fila = 1 llamada MCP registrada en <code>usage_events</code>.
          </p>
        </div>
        <Tabs<Filter>
          ariaLabel="Filtros de historial"
          active={filter}
          onChange={setFilter}
          tabs={[
            { id: "todos", label: "Todos", meta: usageEvents.length },
            {
              id: "compras",
              label: "Compras",
              meta: usageEvents.filter(
                (e) => e.is_purchase || PURCHASE_OPS.includes(e.operation),
              ).length,
            },
            { id: "consultas", label: "Consultas" },
            {
              id: "errores",
              label: "Errores",
              meta: usageEvents.filter((e) => e.status === "error").length,
            },
          ]}
        />
      </div>

      <TabPanel key={filter} className="flex-1">
        <div className="md:hidden">
          <MobileRecordList
            records={paginatedRows.map((e) => {
              const merchant = e.business_id ? businessById(e.business_id) : undefined;
              return {
                id: e.id,
                eyebrow: formatDateTime(e.occurred_at),
                title: (
                  <div className="space-y-1">
                    <span>{OPERATION_LABEL[e.operation]}</span>
                    {e.is_purchase ? (
                      <span className="ml-2 align-middle">
                        <Badge tone="accent">compra</Badge>
                      </span>
                    ) : null}
                  </div>
                ),
                meta: <Badge tone={STATUS[e.status].tone}>{STATUS[e.status].label}</Badge>,
                fields: [
                  {
                    label: "Comercio",
                    value: (merchant?.name ?? e.business_id) || "Sin comercio",
                  },
                  { label: "Cliente", value: e.client_name ?? "-" },
                  { label: "Capability", value: e.capability },
                  { label: "Transport", value: e.transport.toUpperCase() },
                  { label: "Latencia", value: formatLatency(e.latency_ms) },
                  {
                    label: "Revenue",
                    value: e.revenue_minor
                      ? formatMoney(e.revenue_minor, "USD")
                      : "-",
                  },
                ],
                footer:
                  e.product_ref || e.error_code ? (
                    <div className="space-y-1 text-xs">
                      {e.product_ref ? (
                        <div className="text-[var(--color-subtle)]">
                          Producto:{" "}
                          <code className="text-[var(--color-fg)]">
                            {e.product_ref}
                          </code>
                        </div>
                      ) : null}
                      {e.error_code ? (
                        <div className="text-[var(--color-danger)]">
                          {e.error_code}
                        </div>
                      ) : null}
                    </div>
                  ) : null,
              };
            })}
            empty="Sin eventos para este filtro."
          />
          <Pagination
            page={currentPage}
            pageSize={HISTORY_PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
            className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        </div>

        <Card padded={false} className="hidden overflow-hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-subtle)]">
                  <th className="px-5 py-3 font-medium">Fecha</th>
                  <th className="px-5 py-3 font-medium">Operacion</th>
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
                {paginatedRows.map((e) => {
                  const merchant = e.business_id ? businessById(e.business_id) : undefined;
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-2)]/60"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-[var(--color-muted)]">
                        {formatDateTime(e.occurred_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--color-fg)]">
                            {OPERATION_LABEL[e.operation]}
                          </span>
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
                        <div>{e.client_name ?? "-"}</div>
                        <div className="text-xs text-[var(--color-subtle)]">
                          req - {e.request_id}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {(merchant?.name ?? e.business_id) || "Sin comercio"}
                      </td>
                      <td className="px-5 py-3 text-right text-[var(--color-muted)]">
                        {formatLatency(e.latency_ms)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {e.revenue_minor
                          ? formatMoney(e.revenue_minor, "USD")
                          : "-"}
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
          <Pagination
            page={currentPage}
            pageSize={HISTORY_PAGE_SIZE}
            total={rows.length}
            onPageChange={setPage}
          />
        </Card>
      </TabPanel>
    </div>
  );
}
