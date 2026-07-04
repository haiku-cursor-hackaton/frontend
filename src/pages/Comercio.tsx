import { useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
  Stat,
} from "@/components/ui";
import {
  apiKeys,
  businessById,
  currentBusinessId,
  merchantDomains,
  merchantStats,
  usageEvents,
} from "@/data/mock";
import { formatMoney } from "@/lib/money";
import type { UCPCapability } from "@/types/ucp";

const CAPABILITY_LABEL: Record<UCPCapability, string> = {
  "dev.ucp.shopping.catalog.search": "catalog · search",
  "dev.ucp.shopping.catalog.lookup": "catalog · lookup",
  "dev.ucp.shopping.checkout": "checkout",
  "dev.ucp.shopping.order": "order",
};

function StatsChart() {
  const max = Math.max(...merchantStats.byDay.map((d) => d.queries));
  return (
    <div>
      <div className="flex h-48 items-end gap-3">
        {merchantStats.byDay.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-40 w-full items-end justify-center gap-1">
              <div
                className="w-1/2 rounded-t bg-[var(--color-brand)]"
                style={{ height: `${(d.queries / max) * 100}%` }}
                title={`${d.queries} consultas`}
              />
              <div
                className="w-1/2 rounded-t bg-[var(--color-accent)]"
                style={{ height: `${(d.purchases / max) * 100}%` }}
                title={`${d.purchases} compras`}
              />
            </div>
            <span className="text-xs text-[var(--color-subtle)]">{d.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-brand)]" />
          Consultas agénticas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]" />
          Compras
        </span>
        <span className="ml-auto text-[var(--color-subtle)]">
          Fuente: usage_events · últimos 7 días
        </span>
      </div>
    </div>
  );
}

export default function Comercio() {
  const business = businessById(currentBusinessId);
  const sdkKey = useMemo(
    () =>
      apiKeys.find(
        (k) => k.key_type === "sdk" && k.business_id === currentBusinessId,
      ),
    [],
  );
  const domains = useMemo(
    () => merchantDomains.filter((d) => d.business_id === currentBusinessId),
    [],
  );

  const errorRate = useMemo(() => {
    const mine = usageEvents.filter((e) => e.business_id === currentBusinessId);
    if (mine.length === 0) return 0;
    return mine.filter((e) => e.status === "error").length / mine.length;
  }, []);

  if (!business) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold">Panel de comercio</h1>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">
            Aún no tienes un comercio registrado en genko. Usa el formulario
            abajo para conectar tu tienda UCP.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{business.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>{business.category}</span>
            <span className="text-[var(--color-subtle)]">·</span>
            {business.status === "active" ? (
              <Badge tone="accent">activo</Badge>
            ) : business.status === "pending" ? (
              <Badge tone="warn">pendiente</Badge>
            ) : (
              <Badge tone="danger">suspendido</Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-[var(--color-subtle)]">
          business_id · <code className="text-[var(--color-fg)]">{business.id}</code>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle hint="/.well-known/ucp">Perfil UCP</SectionTitle>
          <Card>
            <div className="space-y-4">
              <Field label="well_known_url">
                <Input readOnly value={business.well_known_url} />
              </Field>
              <Field label="ucp_base_url (REST)">
                <Input readOnly value={business.ucp_base_url} />
              </Field>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">
                  Capabilities detectadas
                </span>
                <div className="flex flex-wrap gap-2">
                  {business.ucp_capabilities.map((c) => (
                    <Badge key={c} tone="brand">
                      {CAPABILITY_LABEL[c]}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--color-subtle)]">
                  Cache de <code>ucp_capabilities</code>. Se refresca al probar
                  el perfil.
                </p>
              </div>
              <div className="flex gap-2">
                <Button>Refrescar perfil</Button>
                <Button variant="ghost">Probar /mcp</Button>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle hint="merchant_domains">
            Dominios verificados
          </SectionTitle>
          <Card>
            <div className="space-y-2">
              {domains.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <code className="text-[var(--color-fg)]">{d.domain}</code>
                  {d.verified ? (
                    <Badge tone="accent">verificado</Badge>
                  ) : (
                    <Badge tone="warn">pendiente</Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-end gap-2">
              <Field label="Nuevo dominio">
                <Input placeholder="shop.tu-tienda.com" />
              </Field>
              <Button>Añadir</Button>
            </div>
            <p className="mt-3 text-xs text-[var(--color-subtle)]">
              Solo dominios verificados pueden resolverse desde un{" "}
              <code>merchant_url</code> pasado por un agente.
            </p>
          </Card>
        </div>

        <div>
          <SectionTitle hint="SDK Python (ucp-merchant)">Integración</SectionTitle>
          <Card>
            <div className="space-y-4">
              <Field label={sdkKey?.label ?? "API key SDK"}>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={sdkKey ? `${sdkKey.key_prefix}…` : "sin key"}
                  />
                  <Button>Copiar prefijo</Button>
                </div>
              </Field>
              {sdkKey ? (
                <div className="flex flex-wrap gap-1">
                  {sdkKey.scopes.map((s) => (
                    <Badge key={s} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">
                  Snippet de instalación
                </span>
                <pre className="overflow-x-auto rounded-lg bg-[var(--color-surface-2)] px-3 py-2.5 text-xs text-[var(--color-fg)]">{`pip install ucp-merchant

# expone /.well-known/ucp, /ucp/v1/*, /ucp/mcp
# ver python-sdk/README.md`}</pre>
              </div>
              <p className="text-sm text-[var(--color-muted)]">
                Implementa un <code>MerchantAdapter</code> con{" "}
                <code>get_products()</code> y <code>create_order()</code>.
                El SDK expone las 9 tools UCP automáticamente.
              </p>
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle hint="usage_events">Métricas (7d)</SectionTitle>
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <Stat
                value={merchantStats.queries_7d}
                label="Consultas MCP"
                tone="brand"
              />
              <Stat
                value={merchantStats.purchases_generated}
                label="Compras generadas"
                tone="accent"
              />
              <Stat
                value={formatMoney(
                  merchantStats.revenue_7d_minor,
                  merchantStats.currency,
                )}
                label="Revenue simulado"
                tone="accent"
              />
              <Stat
                value={`${(errorRate * 100).toFixed(1)}%`}
                label="Errores"
                tone={errorRate > 0.05 ? "danger" : "neutral"}
              />
            </div>
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle>Consultas vs. compras</SectionTitle>
        <Card>
          <StatsChart />
        </Card>
      </div>
    </div>
  );
}
