import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Page, SectionTitle, Stat } from "@/components/ui";
import { useAuth } from "@/auth/AuthContext";
import {
  computeMerchantStats,
  useBusinessMap,
  useMyBusinesses,
  useProfile,
  useUsageEvents,
  useWallet,
} from "@/hooks/useData";
import { WELCOME_BONUS_MINOR, OPERATION_LABEL } from "@/lib/constants";
import { formatDateTime, formatLatency, formatMoney } from "@/lib/money";
import { formatUserDisplayName } from "@/lib/user";
import type { AccountType, UsageEvent } from "@/types/ucp";

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

function purchasesCount(events: UsageEvent[]): number {
  return events.filter((e) => e.is_purchase).length;
}

function uniqueMerchants(events: UsageEvent[]): number {
  return new Set(events.map((e) => e.business_id).filter(Boolean)).size;
}

function spendMinor(events: UsageEvent[]): number {
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

  const merchantBusinessId = myBusinesses[0]?.id;
  const merchantStats = useMemo(
    () =>
      merchantBusinessId
        ? computeMerchantStats(events, merchantBusinessId)
        : null,
    [events, merchantBusinessId],
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

  if (profileLoading || walletLoading || businessesLoading || eventsLoading) {
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
                value={merchantStats.queries_7d}
                label="Consultas agenticas (7d)"
                tone="brand"
              />
              <Stat
                value={merchantStats.purchases_generated}
                label="Compras generadas"
                tone="accent"
              />
              <Stat
                value={`${(merchantStats.conversion_rate * 100).toFixed(1)}%`}
                label="Conversion agentica"
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
              <SectionTitle>Consultas y compras recientes</SectionTitle>
              <Card padded={false} className="px-4 sm:px-5">
                {merchantEvents.length > 0 ? (
                  <UsageFeed
                    events={merchantEvents}
                    businessById={businessById}
                  />
                ) : (
                  <p className="py-6 text-sm text-[var(--color-subtle)]">
                    Sin eventos para tu comercio aun.
                  </p>
                )}
              </Card>
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
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">
                Saldo disponible
              </span>
              {wallet ? (
                <Badge tone="accent">
                  +{formatMoney(WELCOME_BONUS_MINOR, wallet.currency)}
                </Badge>
              ) : null}
            </div>
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
            value={purchasesCount(events)}
            label="Compras agenticas"
            tone="brand"
          />
          <Stat value={uniqueMerchants(events)} label="Comercios consultados" />
          <Stat
            value={wallet ? formatMoney(spendMinor(events), wallet.currency) : "-"}
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
