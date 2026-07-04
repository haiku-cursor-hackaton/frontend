import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, SectionTitle, Stat, cx } from "@/components/ui";
import {
  WELCOME_BONUS_MINOR,
  businessById,
  currentBusinessId,
  currentWallet,
  merchantStats,
  usageEvents,
} from "@/data/mock";
import { formatDateTime, formatLatency, formatMoney } from "@/lib/money";
import type { UCPOperation, UsageEvent } from "@/types/ucp";

const OPERATION_LABEL: Record<UCPOperation, string> = {
  search_catalog: "Búsqueda de catálogo",
  lookup_catalog: "Lookup de catálogo",
  get_product: "Consulta de producto",
  create_checkout: "Checkout creado",
  get_checkout: "Consulta de checkout",
  update_checkout: "Checkout actualizado",
  complete_checkout: "Compra completada",
  cancel_checkout: "Checkout cancelado",
  get_order: "Consulta de orden",
};

const STATUS_TONE: Record<UsageEvent["status"], "accent" | "warn" | "danger"> = {
  ok: "accent",
  pending: "warn",
  error: "danger",
};

function UsageFeed({ events }: { events: UsageEvent[] }) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {events.map((e) => {
        const merchantName = businessById(e.business_id)?.name ?? e.business_id;
        return (
          <div key={e.id} className="flex items-center gap-3 py-3">
            <Badge tone={STATUS_TONE[e.status]}>
              {e.client_name ?? "agent"}
            </Badge>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                {OPERATION_LABEL[e.operation]}
                {e.product_ref ? (
                  <span className="text-[var(--color-muted)]">
                    {" "}
                    · <code className="text-[var(--color-fg)]">{e.product_ref}</code>
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-[var(--color-subtle)]">
                {merchantName} · vía {e.transport.toUpperCase()} ·{" "}
                {formatLatency(e.latency_ms)} · {formatDateTime(e.occurred_at)}
              </div>
            </div>
            {e.is_purchase && e.revenue_minor != null ? (
              <div className="text-sm font-medium">
                {formatMoney(e.revenue_minor, "USD")}
              </div>
            ) : (
              <span className="text-xs text-[var(--color-subtle)]">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function purchasesCount(events: UsageEvent[]): number {
  return events.filter((e) => e.is_purchase).length;
}

function uniqueMerchants(events: UsageEvent[]): number {
  return new Set(events.map((e) => e.business_id)).size;
}

function spendMinor(events: UsageEvent[]): number {
  return events
    .filter((e) => e.is_purchase && e.revenue_minor)
    .reduce((s, e) => s + (e.revenue_minor ?? 0), 0);
}

export default function Dashboard() {
  const [role, setRole] = useState<"cliente" | "comercio">("cliente");

  const clientEvents = useMemo(
    () => [...usageEvents].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1)),
    [],
  );
  const merchantEvents = useMemo(
    () =>
      clientEvents.filter((e) => e.business_id === currentBusinessId),
    [clientEvents],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Inicio</h1>
        <div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
          {(["cliente", "comercio"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cx(
                "rounded-md px-3 py-1.5 text-sm capitalize transition-colors",
                role === r
                  ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-fg)]"
                  : "text-[var(--color-muted)]",
              )}
            >
              Vista {r}
            </button>
          ))}
        </div>
      </div>

      {role === "cliente" ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-muted)]">
                  Saldo disponible
                </span>
                <Badge tone="accent">
                  +{formatMoney(WELCOME_BONUS_MINOR, currentWallet.currency)}
                </Badge>
              </div>
              <div className="mt-2 text-2xl font-bold">
                {formatMoney(currentWallet.available_minor, currentWallet.currency)}
              </div>
              {currentWallet.reserved_minor > 0 ? (
                <div className="mt-1 text-xs text-[var(--color-warn)]">
                  {formatMoney(currentWallet.reserved_minor, currentWallet.currency)}{" "}
                  reservado
                </div>
              ) : null}
            </Card>
            <Stat
              value={purchasesCount(clientEvents)}
              label="Compras agénticas"
              tone="brand"
            />
            <Stat
              value={uniqueMerchants(clientEvents)}
              label="Comercios consultados"
            />
            <Stat
              value={formatMoney(spendMinor(clientEvents), currentWallet.currency)}
              label="Pagos efectuados"
              tone="accent"
            />
          </div>

          <Card className="border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Conecta tu agente</div>
                <p className="text-sm text-[var(--color-muted)]">
                  Vincula Claude, Codex o Gemini vía MCP para comprar y consultar
                  por ti — usa tu API key con scopes{" "}
                  <code className="text-[var(--color-fg)]">catalog:read</code>,{" "}
                  <code className="text-[var(--color-fg)]">checkout:write</code>,{" "}
                  <code className="text-[var(--color-fg)]">purchase:execute</code>.
                </p>
              </div>
              <Link to="/agente">
                <Button variant="primary">Configurar agente</Button>
              </Link>
            </div>
          </Card>

          <div>
            <SectionTitle hint="Últimos usage_events vía UCP">
              Actividad reciente de tu agente
            </SectionTitle>
            <Card padded={false} className="px-5">
              <UsageFeed events={clientEvents.slice(0, 5)} />
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              value={merchantStats.queries_7d}
              label="Consultas agénticas (7d)"
              tone="brand"
            />
            <Stat
              value={merchantStats.purchases_generated}
              label="Compras generadas"
              tone="accent"
            />
            <Stat
              value={`${(merchantStats.conversion_rate * 100).toFixed(1)}%`}
              label="Conversión agéntica"
            />
            <Stat
              value={formatMoney(
                merchantStats.revenue_7d_minor,
                merchantStats.currency,
              )}
              label="Revenue simulado (7d)"
              tone="accent"
            />
          </div>

          <div>
            <SectionTitle hint="Tu comercio, visto por los agentes">
              Consultas y compras recientes
            </SectionTitle>
            <Card padded={false} className="px-5">
              <UsageFeed events={merchantEvents} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
