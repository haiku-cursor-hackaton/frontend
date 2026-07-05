import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
  Stat,
  TabPanel,
  Tabs,
} from "@/components/ui";
import {
  computeMerchantStats,
  useApiKeys,
  useMerchantDomains,
  useMyBusinesses,
  useRegisterMerchant,
  useUsageEvents,
} from "@/hooks/useData";
import type { RegisterMerchantResponse } from "@/lib/api";
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
      <div className="flex h-48 items-end gap-3">
        {stats.byDay.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
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
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-brand)]" />
          Consultas agenticas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]" />
          Compras
        </span>
        <span className="ml-auto text-[var(--color-subtle)]">
          Fuente: usage_events - ultimos 7 dias
        </span>
      </div>
    </div>
  );
}

export default function Comercio() {
  const [tab, setTab] = useState<ComercioTab>("perfil");
  const [merchantName, setMerchantName] = useState("");
  const [merchantCategory, setMerchantCategory] = useState("retail");
  const [merchantRootUrl, setMerchantRootUrl] = useState("");
  const [merchantInboundKey, setMerchantInboundKey] = useState("");
  const [registrationResult, setRegistrationResult] =
    useState<RegisterMerchantResponse | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const { data: myBusinesses = [], isLoading } = useMyBusinesses();
  const business = myBusinesses[0];
  const { data: allKeys = [] } = useApiKeys();
  const { data: domains = [] } = useMerchantDomains(business?.id);
  const { data: usageEvents = [] } = useUsageEvents();
  const registerMerchant = useRegisterMerchant();

  const sdkKey = useMemo(
    () =>
      allKeys.find(
        (k) => k.key_type === "sdk" && k.business_id === business?.id,
      ),
    [allKeys, business?.id],
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

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando comercio...
      </div>
    );
  }

  if (!business) {
    async function handleRegisterMerchant(e: React.FormEvent) {
      e.preventDefault();
      setRegistrationError(null);
      setRegistrationResult(null);
      try {
        const result = await registerMerchant.mutateAsync({
          name: merchantName.trim(),
          category: merchantCategory.trim() || undefined,
          root_url: merchantRootUrl.trim(),
          ucp_inbound_api_key: merchantInboundKey.trim() || undefined,
        });
        setRegistrationResult(result);
        setTab("integracion");
      } catch (err) {
        setRegistrationError(
          err instanceof Error ? err.message : "No se pudo registrar el comercio",
        );
      }
    }

    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <h1 className="shrink-0 text-lg font-semibold">Panel de comercio</h1>
        <TabPanel className="flex-1">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <form className="space-y-4" onSubmit={handleRegisterMerchant}>
                <div>
                  <h2 className="text-sm font-semibold">Registrar comercio UCP</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Pega la URL raiz del comercio. Genko lee{" "}
                    <code>/.well-known/ucp</code>, guarda el endpoint REST y emite
                    la key que el SDK usa como <code>UCP_PLATFORM_API_KEY</code>.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre">
                    <Input
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="Lithe"
                      required
                    />
                  </Field>
                  <Field label="Categoria">
                    <Input
                      value={merchantCategory}
                      onChange={(e) => setMerchantCategory(e.target.value)}
                      placeholder="retail"
                    />
                  </Field>
                </div>

                <Field label="URL raiz">
                  <Input
                    value={merchantRootUrl}
                    onChange={(e) => setMerchantRootUrl(e.target.value)}
                    placeholder="https://tu-tienda.com"
                    required
                  />
                </Field>

                <Field label="UCP_GATEWAY_API_KEY (opcional)">
                  <Input
                    type="password"
                    value={merchantInboundKey}
                    onChange={(e) => setMerchantInboundKey(e.target.value)}
                    placeholder="Misma clave configurada en el comercio"
                  />
                  <p className="mt-1 text-xs text-[var(--color-subtle)]">
                    Usala si el comercio protege <code>/ucp/v1/*</code>; Genko la
                    enviara como Bearer en cada llamada REST.
                  </p>
                </Field>

                {registrationError ? (
                  <p className="rounded-lg bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-danger)]">
                    {registrationError}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={registerMerchant.isPending}
                  >
                    {registerMerchant.isPending
                      ? "Registrando..."
                      : "Registrar comercio"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Contrato esperado</div>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    El comercio debe exponer discovery y REST UCP. Lithe ya trae
                    esa superficie con el SDK Python; el MCP publico vive en
                    Genko.
                  </p>
                </div>
                <div className="space-y-2 text-xs text-[var(--color-muted)]">
                  <div>
                    <code className="text-[var(--color-fg)]">
                      GET /.well-known/ucp
                    </code>
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
            </Card>
          </div>

          {registrationResult ? (
            <Card className="mt-4 border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]">
              <div className="space-y-2">
                <div className="text-sm font-medium text-[var(--color-accent)]">
                  Comercio registrado
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  Configurala en el comercio como{" "}
                  <code>UCP_PLATFORM_API_KEY</code>. El backend solo muestra la
                  clave completa una vez.
                </p>
                <code className="block break-all rounded-lg bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-fg)]">
                  {registrationResult.sdk_api_key}
                </code>
              </div>
            </Card>
          ) : null}
        </TabPanel>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{business.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
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
        <span className="max-w-full break-all text-xs text-[var(--color-subtle)]">
          business_id -{" "}
          <code className="text-[var(--color-fg)]">{business.id}</code>
        </span>
      </div>

      <Tabs<ComercioTab>
        ariaLabel="Secciones de comercio"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "perfil", label: "Perfil UCP" },
          { id: "integracion", label: "Integracion" },
          { id: "metricas", label: "Metricas", meta: "7d" },
        ]}
      />

      {tab === "perfil" ? (
        <TabPanel key="perfil" className="flex-1">
          <div className="grid gap-4 lg:grid-cols-2">
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
                          {CAPABILITY_LABEL[c] ?? c}
                        </Badge>
                      ))}
                    </div>
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
        <TabPanel key="integracion" className="flex-1">
          <SectionTitle hint="SDK Python (genko-sdk)">Integracion</SectionTitle>
          <Card>
            <div className="space-y-4">
              {registrationResult ? (
                <div className="rounded-lg border border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] p-3">
                  <p className="mb-1 text-xs font-medium text-[var(--color-accent)]">
                    SDK key emitida. Guardala ahora; no se volvera a mostrar:
                  </p>
                  <code className="break-all text-xs">
                    {registrationResult.sdk_api_key}
                  </code>
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
              <pre className="overflow-x-auto rounded-lg bg-[var(--color-surface-2)] px-3 py-2.5 text-xs text-[var(--color-fg)]">{`pip install -e ../python-sdk

# store env
UCP_PLATFORM_URL=<URL del backend Genko>
UCP_PLATFORM_API_KEY=<gk_sdk_...>
UCP_GATEWAY_API_KEY=<opcional, si proteges REST>

# expone /.well-known/ucp y /ucp/v1/*
# /ucp/mcp solo para demos con enable_mcp=True
# ver python-sdk/README.md`}</pre>
            </div>
          </Card>
        </TabPanel>
      ) : (
        <TabPanel key="metricas" className="flex-1">
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
    </div>
  );
}
