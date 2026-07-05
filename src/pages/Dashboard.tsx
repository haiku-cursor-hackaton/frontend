import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Page, SectionTitle, Stat } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import {
  computeMerchantStats,
  useBusinessMap,
  useBusinessOrders,
  useBusinessWallet,
  useClientOrders,
  useMyBusinesses,
  useProfile,
  useUsageEvents,
  useWallet,
} from "@/hooks/useData";
import { OPERATION_LABEL } from "@/lib/constants";
import { formatDateTime, formatLatency, formatMoney } from "@/lib/money";
import { formatUserDisplayName } from "@/lib/user";
import type { AccountType, OrderRecord, UsageEvent } from "@/types/ucp";

const STATUS_TONE: Record<UsageEvent["status"], "accent" | "warn" | "danger"> = {
  ok: "accent",
  pending: "warn",
  error: "danger",
};

function UsageFeed({
  events,
  businessById,
}: {
  events: UsageEvent[];
  businessById: (id: string) => { name: string } | undefined;
}) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {events.map((e) => {
        const merchantName = e.business_id
          ? businessById(e.business_id)?.name ?? e.business_id
          : "Sin comercio";
        return (
          <div
            key={e.id}
            className="flex flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:gap-3"
          >
            <Badge tone={STATUS_TONE[e.status]}>
              {e.client_name ?? "agent"}
            </Badge>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">
                {OPERATION_LABEL[e.operation]}
                {e.product_ref ? (
                  <span className="text-[var(--color-muted)]">
                    {" "}
                    - <code className="text-[var(--color-fg)]">{e.product_ref}</code>
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-[var(--color-subtle)]">
                {merchantName} - via {e.transport.toUpperCase()} -{" "}
                {formatLatency(e.latency_ms)} - {formatDateTime(e.occurred_at)}
              </div>
            </div>
            {e.is_purchase && e.revenue_minor != null ? (
              <div className="text-sm font-medium sm:text-right">
                {formatMoney(e.revenue_minor, "USD")}
              </div>
            ) : (
              <span className="text-xs text-[var(--color-subtle)]">-</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MerchantOrdersFeed({ orders }: { orders: OrderRecord[] }) {
  if (orders.length === 0) {
    return (
      <p className="py-6 text-sm text-[var(--color-subtle)]">
        Aun no hay ventas registradas.
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {orders.slice(0, 10).map((order) => (
        <div
          key={order.id}
          className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {order.external_order_id || order.id.slice(0, 8)}
            </div>
            <div className="text-xs text-[var(--color-subtle)]">
              {formatDateTime(order.created_at)} - {order.status}
            </div>
          </div>
          <div className="text-sm font-medium text-[var(--color-accent)]">
            +{formatMoney(order.total_minor, order.currency)}
          </div>
        </div>
      ))}
    </div>
  );
}

function MerchantActivityFeed({ events }: { events: UsageEvent[] }) {
  const meaningful = events.filter((e) =>
    ["create_checkout", "complete_checkout", "get_order"].includes(e.operation),
  );

  if (meaningful.length === 0) {
    return (
      <p className="py-4 text-sm text-[var(--color-subtle)]">
        Sin actividad de checkout reciente.
      </p>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {meaningful.slice(0, 8).map((e) => (
        <div
          key={e.id}
          className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 text-sm">
            {OPERATION_LABEL[e.operation]}
            <span className="text-[var(--color-subtle)]">
              {" "}
              - {formatDateTime(e.occurred_at)}
            </span>
          </div>
          <Badge tone={e.status === "error" ? "danger" : "neutral"}>
            {e.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

const CLIENT_PAID_ORDER_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
]);

function paidClientOrders(orders: OrderRecord[]): OrderRecord[] {
  return orders.filter((order) => CLIENT_PAID_ORDER_STATUSES.has(order.status));
}

function purchasesCount(orders: OrderRecord[], events: UsageEvent[]): number {
  const paid = paidClientOrders(orders);
  if (paid.length > 0) return paid.length;
  return events.filter((e) => e.is_purchase).length;
}

function uniqueMerchants(orders: OrderRecord[], events: UsageEvent[]): number {
  const fromOrders = new Set(orders.map((o) => o.business_id).filter(Boolean));
  if (fromOrders.size > 0) return fromOrders.size;
  return new Set(events.map((e) => e.business_id).filter(Boolean)).size;
}

function spendMinor(orders: OrderRecord[], events: UsageEvent[]): number {
  const paidTotal = paidClientOrders(orders).reduce(
    (sum, order) => sum + order.total_minor,
    0,
  );
  if (paidTotal > 0) return paidTotal;
  return events
    .filter((e) => e.is_purchase && e.revenue_minor)
    .reduce((sum, e) => sum + (e.revenue_minor ?? 0), 0);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: myBusinesses = [], isLoading: businessesLoading } =
    useMyBusinesses();
  const { businessById } = useBusinessMap();

  const accountType: AccountType =
    profile?.account_type ??
    (myBusinesses.length > 0
      ? "business"
      : user?.accountType ?? "client");
  const businessIds = useMemo(
    () => myBusinesses.map((business) => business.id),
    [myBusinesses],
  );
  const { data: events = [], isLoading: eventsLoading } = useUsageEvents(
    accountType === "business"
      ? { businessIds, enabled: businessIds.length > 0 }
      : { profileId: user?.id, enabled: Boolean(user?.id) },
  );
  const { data: clientOrders = [], isLoading: clientOrdersLoading } =
    useClientOrders(accountType === "client" ? user?.id : undefined);

  const merchantBusinessId = myBusinesses[0]?.id;
  const { data: merchantOrders = [] } = useBusinessOrders(merchantBusinessId);
  const { data: merchantWallet } = useBusinessWallet(merchantBusinessId);
  const merchantStats = useMemo(
    () =>
      merchantBusinessId
        ? computeMerchantStats(events, merchantBusinessId, {
            orders: merchantOrders,
            wallet: merchantWallet,
          })
        : null,
    [events, merchantBusinessId, merchantOrders, merchantWallet],
  );
  const merchantEvents = useMemo(
    () =>
      merchantBusinessId
        ? events.filter((e) => e.business_id === merchantBusinessId)
        : [],
    [events, merchantBusinessId],
  );
  const displayName = formatUserDisplayName(
    profile?.full_name || user?.name,
    user?.email,
  );

  if (
    profileLoading ||
    walletLoading ||
    businessesLoading ||
    eventsLoading ||
    (accountType === "client" && clientOrdersLoading)
  ) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando datos...
      </div>
    );
  }

  if (accountType === "business") {
    return (
      <Page>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Hola, {displayName}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Resumen de tu comercio y actividad de agentes.
            </p>
          </div>
          <Badge tone="brand">comercio</Badge>
        </div>

        {merchantStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              <Stat
                value={formatMoney(
                  merchantStats.credited_balance_minor,
                  merchantStats.currency,
                )}
                label="Saldo acreditado"
                tone="accent"
              />
              <Stat
                value={merchantStats.purchases_generated}
                label={`Ventas (7d) / ${merchantStats.sales_all_time} total`}
                tone="brand"
              />
              <Stat
                value={formatMoney(
                  merchantStats.revenue_7d_minor,
                  merchantStats.currency,
                )}
                label={`Ingresos 7d (${formatMoney(merchantStats.avg_order_minor_7d, merchantStats.currency)} prom.)`}
              />
              <Stat
                value={`${(merchantStats.conversion_rate * 100).toFixed(0)}%`}
                label={`Checkout a compra (${merchantStats.checkouts_started_7d} iniciados)`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <SectionTitle>Ventas recientes</SectionTitle>
                <Card padded={false} className="px-4 sm:px-5">
                  <MerchantOrdersFeed orders={merchantOrders} />
                </Card>
              </div>
              <div>
                <SectionTitle>
                  Actividad MCP ({merchantStats.queries_7d} consultas en 7d)
                </SectionTitle>
                <Card padded={false} className="px-4 sm:px-5">
                  <MerchantActivityFeed events={merchantEvents} />
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--color-muted)]">
                No tienes un comercio registrado. Conecta tu tienda UCP para ver
                metricas, SDK key y dominios.
              </p>
              <Link to="/comercio">
                <Button variant="primary">Registrar comercio</Button>
              </Link>
            </div>
          </Card>
        )}
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Hola, {displayName}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Tu wallet, agente MCP y compras recientes.
          </p>
        </div>
        <Badge tone="accent">cliente</Badge>
      </div>

      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Card>
            <span className="text-xs text-[var(--color-muted)]">
              Saldo disponible
            </span>
            <div className="mt-2 text-2xl font-bold">
              {wallet
                ? formatMoney(wallet.available_minor, wallet.currency)
                : "-"}
            </div>
            {wallet && wallet.reserved_minor > 0 ? (
              <div className="mt-1 text-xs text-[var(--color-warn)]">
                {formatMoney(wallet.reserved_minor, wallet.currency)} reservado
              </div>
            ) : null}
          </Card>
          <Stat
            value={purchasesCount(clientOrders, events)}
            label="Compras agenticas"
            tone="brand"
          />
          <Stat
            value={uniqueMerchants(clientOrders, events)}
            label="Comercios consultados"
          />
          <Stat
            value={
              wallet
                ? formatMoney(spendMinor(clientOrders, events), wallet.currency)
                : "-"
            }
            label="Pagos efectuados"
            tone="accent"
          />
        </div>

        <Card className="border-[color-mix(in_srgb,var(--color-brand)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Conecta tu agente</div>
              <p className="text-sm text-[var(--color-muted)]">
                Vincula Claude, Codex o Gemini via MCP para comprar y consultar
                por ti.
              </p>
            </div>
            <Link to="/agente" className="block w-full sm:w-auto">
              <Button variant="primary" full className="sm:w-auto">
                Configurar agente
              </Button>
            </Link>
          </div>
        </Card>

        <div>
          <SectionTitle>Actividad reciente de tu agente</SectionTitle>
          <Card padded={false} className="px-4 sm:px-5">
            {events.length > 0 ? (
              <UsageFeed events={events.slice(0, 5)} businessById={businessById} />
            ) : (
              <p className="py-6 text-sm text-[var(--color-subtle)]">
                Aun no hay actividad. Configura tu agente en /agente.
              </p>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
