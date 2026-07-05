import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CodePre,
  Field,
  Input,
  Page,
  SectionTitle,
  Stat,
  TabPanel,
  Tabs,
} from "@/components/ui";
import {
  computeMerchantStats,
  getStoredSdkKey,
  useApiKeys,
  useLinkMerchant,
  useMerchantDomains,
  useMyBusinesses,
  useUsageEvents,
} from "@/hooks/useData";
import type { LinkMerchantResponse } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import type { MerchantStats, UCPCapability } from "@/types/ucp";

type ComercioTab = "perfil" | "integracion" | "metricas";

const CAPABILITY_LABEL: Partial<Record<UCPCapability, string>> = {
  "dev.ucp.shopping.catalog.search": "catalog - search",
  "dev.ucp.shopping.catalog.lookup": "catalog - lookup",
  "dev.ucp.shopping.checkout": "checkout",
  "dev.ucp.shopping.order": "order",
};

function StatsChart({ stats }: { stats: MerchantStats }) {
  const max = Math.max(...stats.byDay.map((d) => d.queries), 1);
  return (
    <div>
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="flex h-48 min-w-[20rem] items-end gap-2 sm:gap-3">
          {stats.byDay.map((d) => (
            <div key={d.day} className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 rounded-t bg-[var(--color-brand)] transition-[height] duration-500 ease-out"
                  style={{ height: `${(d.queries / max) * 100}%` }}
                  title={`${d.queries} consultas`}
                />
                <div
                  className="w-1/2 rounded-t bg-[var(--color-accent)] transition-[height] duration-500 ease-out"
                  style={{ height: `${(d.purchases / max) * 100}%` }}
                  title={`${d.purchases} compras`}
                />
              </div>
              <span className="text-xs text-[var(--color-subtle)]">{d.day}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)] sm:gap-4">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-brand)]" />
          Consultas agenticas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]" />
          Compras
        </span>
        <span className="w-full text-[var(--color-subtle)] sm:ml-auto sm:w-auto">
          Últimos 7 días
        </span>
      </div>
    </div>
  );
}

export default function Comercio() {
  const [tab, setTab] = useState<ComercioTab>("perfil");
  const [linkRootUrl, setLinkRootUrl] = useState("");
  const [linkInboundKey, setLinkInboundKey] = useState("");
  const [linkResult, setLinkResult] = useState<LinkMerchantResponse | null>(
    null,
  );
  const [linkError, setLinkError] = useState<string | null>(null);
  const { data: myBusinesses = [], isLoading } = useMyBusinesses();
  const business = myBusinesses[0];
  const businessIds = useMemo(() => (business ? [business.id] : []), [business]);
  const { data: allKeys = [] } = useApiKeys({
    businessIds,
    enabled: businessIds.length > 0,
  });
  const { data: domains = [] } = useMerchantDomains(business?.id);
  const { data: usageEvents = [] } = useUsageEvents({
    businessIds,
    enabled: businessIds.length > 0,
  });
  const linkMerchant = useLinkMerchant(business?.id);

  const sdkKey = useMemo(
    () =>
      allKeys.find(
        (k) => k.key_type === "sdk" && k.business_id === business?.id,
      ),
    [allKeys, business?.id],
  );
  const sdkKeyPlaintext = useMemo(
    () => (sdkKey ? getStoredSdkKey(sdkKey.key_prefix) : undefined),
    [sdkKey],
  );

  const merchantStats = useMemo(
    () =>
      business ? computeMerchantStats(usageEvents, business.id) : null,
    [usageEvents, business],
  );

  const errorRate = useMemo(() => {
    if (!business) return 0;
    const mine = usageEvents.filter((e) => e.business_id === business.id);
    if (mine.length === 0) return 0;
    return mine.filter((e) => e.status === "error").length / mine.length;
  }, [usageEvents, business]);

  async function handleLinkMerchant(e: React.FormEvent) {
    e.preventDefault();
    setLinkError(null);
    setLinkResult(null);
    try {
      const result = await linkMerchant.mutateAsync({
        root_url: linkRootUrl.trim(),
        ucp_inbound_api_key: linkInboundKey.trim() || undefined,
      });
      setLinkResult(result);
      setTab("integracion");
    } catch (err) {
      setLinkError(
        err instanceof Error ? err.message : "No se pudo vincular la URL del comercio",
      );
    }
  }

  const isPending = business ? business.status !== "active" : true;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando comercio...
      </div>
    );
  }

  if (!business || isPending) {
    return (
      <Page>
        <div className="shrink-0">
          <h1 className="text-lg font-semibold">
            {business ? business.name : "Panel de comercio"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Wallet y SDK key ya listas. Solo falta vincular la URL de tu tienda
            UCP para activarla.
          </p>
        </div>
        <TabPanel>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              {business ? (
                <div className="mb-4">
                  <Badge tone="warn">Pendiente de vinculación</Badge>
                </div>
              ) : (
                <div className="mb-4 rounded-lg bg-[color-mix(in_srgb,var(--color-warn)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-muted)]">
                  Preparando tu comercio...
                </div>
              )}
              <form className="space-y-4" onSubmit={handleLinkMerchant}>
                <div>
                  <h2 className="text-sm font-semibold">Vincular URL del comercio</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Pega la URL raíz de tu tienda. Genko lee{" "}
                    <code>/.well-known/ucp</code>, guarda el endpoint REST y activa
                    tu SDK key existente como <code>UCP_PLATFORM_API_KEY</code>.
                  </p>
                </div>

                <Field label="URL raíz">
                  <Input
                    value={linkRootUrl}
                    onChange={(e) => setLinkRootUrl(e.target.value)}
                    placeholder="https://tu-tienda.com"
                    required
                  />
                </Field>

                <Field label="UCP_GATEWAY_API_KEY (opcional)">
                  <Input
                    type="password"
                    value={linkInboundKey}
                    onChange={(e) => setLinkInboundKey(e.target.value)}
                    placeholder="Misma clave configurada en el comercio"
                  />
                  <p className="mt-1 text-xs text-[var(--color-subtle)]">
                    Úsala si el comercio protege <code>/ucp/v1/*</code>; Genko la
                    enviará como Bearer en cada llamada REST.
                  </p>
                </Field>

                {linkError ? (
                  <p className="rounded-lg bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-danger)]">
                    {linkError}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    full
                    className="sm:w-auto"
                    disabled={linkMerchant.isPending || !business}
                  >
                    {linkMerchant.isPending
                      ? "Vinculando..."
                      : "Vincular comercio"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Contrato esperado</div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Tu tienda debe exponer discovery y REST UCP.
                  </p>
                  <div className="mt-2 space-y-1.5 text-xs text-[var(--color-muted)]">
                    <div>
                      <code className="text-[var(--color-fg)]">GET /.well-known/ucp</code>
                    </div>
                    <div>
                      <code className="text-[var(--color-fg)]">
                        POST /ucp/v1/catalog/search
                      </code>
                    </div>
                    <div>
                      <code className="text-[var(--color-fg)]">
                        POST /ucp/v1/checkout-sessions
                      </code>
                    </div>
                    <div>
                      <code className="text-[var(--color-fg)]">
                        POST /ucp/v1/checkout-sessions/{"{id}"}/complete
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {sdkKey && sdkKeyPlaintext ? (
            <Card className="mt-4 border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]">
              <div className="space-y-2">
                <div className="text-sm font-medium text-[var(--color-accent)]">
                  SDK key lista (mostrada una sola vez)
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  Configúrala en tu comercio como <code>UCP_PLATFORM_API_KEY</code>.
                </p>
                <code className="block break-all rounded-lg bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-fg)]">
                  {sdkKeyPlaintext}
                </code>
              </div>
            </Card>
          ) : sdkKey ? (
            <Card className="mt-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">SDK key activa</div>
                <p className="text-xs text-[var(--color-muted)]">
                  Prefijo <code>{sdkKey.key_prefix}...</code>. El plaintext solo se
                  muestra al momento de emitirla; si lo perdiste, revócala y
                  emite una nueva.
                </p>
              </div>
            </Card>
          ) : null}
        </TabPanel>
      </Page>
    );
  }

  return (
    <Page>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{business.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
              <span>{business.category}</span>
              <span className="text-[var(--color-subtle)]">-</span>
              {business.status === "active" ? (
                <Badge tone="accent">activo</Badge>
              ) : business.status === "pending" ? (
                <Badge tone="warn">pendiente</Badge>
              ) : (
                <Badge tone="danger">suspendido</Badge>
              )}
            </div>
          </div>
        </div>

      <Tabs<ComercioTab>
        ariaLabel="Secciones de comercio"
        active={tab}
        onChange={setTab}
        className="w-full"
        tabs={[
          { id: "perfil", label: "Perfil UCP" },
          { id: "integracion", label: "Integracion" },
          { id: "metricas", label: "Metricas", meta: "7d" },
        ]}
      />

      {tab === "perfil" ? (
        <TabPanel key="perfil">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <SectionTitle>Perfil UCP</SectionTitle>
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
                          {CAPABILITY_LABEL[c] ?? c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <SectionTitle>Dominios verificados</SectionTitle>
              <Card>
                <div className="space-y-2">
                  {domains.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-col items-start gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <code className="text-[var(--color-fg)]">{d.domain}</code>
                      {d.verified ? (
                        <Badge tone="accent">verificado</Badge>
                      ) : (
                        <Badge tone="warn">pendiente</Badge>
                      )}
                    </div>
                  ))}
                  {domains.length === 0 ? (
                    <p className="text-sm text-[var(--color-subtle)]">
                      Sin dominios registrados.
                    </p>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>
      ) : tab === "integracion" ? (
        <TabPanel key="integracion">
          <SectionTitle>Integracion</SectionTitle>
          <Card>
            <div className="space-y-4">
              {linkResult ? (
                <div className="rounded-lg border border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] p-3">
                  <p className="mb-1 text-xs font-medium text-[var(--color-accent)]">
                    Comercio vinculado en <code>{linkResult.domain}</code>. Ya
                    puede recibir tráfico UCP.
                  </p>
                </div>
              ) : null}
              {sdkKeyPlaintext ? (
                <div className="rounded-lg border border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] p-3">
                  <p className="mb-1 text-xs font-medium text-[var(--color-accent)]">
                    SDK key emitida al registrarte. Guárdala ahora; no se
                    volverá a mostrar:
                  </p>
                  <code className="break-all text-xs">{sdkKeyPlaintext}</code>
                </div>
              ) : null}
              <Field label={sdkKey?.label ?? "API key SDK"}>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={sdkKey ? `${sdkKey.key_prefix}...` : "sin key"}
                  />
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
              <p className="text-sm text-[var(--color-muted)]">
                En produccion el comercio monta discovery y REST UCP; los agentes
                llaman al gateway de Genko en <code>POST /mcp</code>.
              </p>
              <CodePre>{`pip install -e ../python-sdk

# store env
UCP_PLATFORM_URL=<URL del backend Genko>
UCP_PLATFORM_API_KEY=<gk_sdk_...>
UCP_GATEWAY_API_KEY=<opcional, si proteges REST>

# expone /.well-known/ucp y /ucp/v1/*
# /ucp/mcp solo para demos con enable_mcp=True
# ver python-sdk/README.md`}</CodePre>
            </div>
          </Card>
        </TabPanel>
      ) : (
        <TabPanel key="metricas">
          {merchantStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
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

              <div>
                <SectionTitle>Consultas vs. compras</SectionTitle>
                <Card>
                  <StatsChart stats={merchantStats} />
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <p className="text-sm text-[var(--color-muted)]">
                Aun no hay metricas para este comercio.
              </p>
            </Card>
          )}
        </TabPanel>
      )}
    </Page>
  );
}
