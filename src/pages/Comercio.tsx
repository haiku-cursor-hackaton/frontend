import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  cx,
} from "@/components/ui";
import {
  computeMerchantStats,
  getStoredSdkInstallPrompt,
  getStoredSdkKey,
  useApiKeys,
  useMerchantDomains,
  useMyBusinesses,
  useUsageEvents,
} from "@/hooks/useData";
import {
  buildSdkInstallPrompt,
  displaySdkInstallPrompt,
  maskSecret,
} from "@/lib/sdk-config";
import { formatMoney } from "@/lib/money";
import type { MerchantStats, UCPCapability } from "@/types/ucp";

type ComercioTab = "integracion" | "metricas";

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

function EyeToggle({
  reveal,
  onReveal,
}: {
  reveal: boolean;
  onReveal: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={reveal ? "Ocultar keys" : "Mostrar keys"}
      title={reveal ? "Ocultar keys" : "Mostrar keys"}
      onClick={onReveal}
      className={cx(
        "grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-fg)_15%,transparent)]",
        reveal && "bg-[var(--color-surface-2)] text-[var(--color-fg)]",
      )}
    >
      {reveal ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}

export default function Comercio() {
  const [tab, setTab] = useState<ComercioTab>("integracion");
  const [revealSecrets, setRevealSecrets] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
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
  const sdkInstallPrompt = useMemo(() => {
    if (sdkKeyPlaintext) return buildSdkInstallPrompt(sdkKeyPlaintext);
    return getStoredSdkInstallPrompt();
  }, [sdkKeyPlaintext]);

  const displayedSdkKey = useMemo(() => {
    if (!sdkKeyPlaintext) return null;
    return revealSecrets ? sdkKeyPlaintext : maskSecret(sdkKeyPlaintext);
  }, [sdkKeyPlaintext, revealSecrets]);

  const displayedInstallPrompt = useMemo(() => {
    if (!sdkInstallPrompt) return null;
    return displaySdkInstallPrompt(
      sdkInstallPrompt,
      sdkKeyPlaintext,
      revealSecrets,
    );
  }, [sdkInstallPrompt, sdkKeyPlaintext, revealSecrets]);

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

  const isPending = business ? business.status !== "active" : true;

  async function copyText(text: string, which: "key" | "prompt") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "key") {
        setCopiedKey(true);
        window.setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedPrompt(true);
        window.setTimeout(() => setCopiedPrompt(false), 2000);
      }
    } catch {
      /* ignore */
    }
  }

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="shrink-0 text-lg font-semibold">
            {business ? business.name : "Panel de comercio"}
          </h1>
          {sdkKeyPlaintext || sdkInstallPrompt ? (
            <EyeToggle
              reveal={revealSecrets}
              onReveal={() => setRevealSecrets((v) => !v)}
            />
          ) : null}
        </div>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>API key SDK</SectionTitle>
            {sdkKeyPlaintext ? (
              <Button
                variant="ghost"
                className="min-h-10"
                onClick={() => copyText(sdkKeyPlaintext, "key")}
              >
                {copiedKey ? "Copiado" : "Copiar"}
              </Button>
            ) : null}
          </div>
          {displayedSdkKey ? (
            <CodePre>{displayedSdkKey}</CodePre>
          ) : sdkKey ? (
            <CodePre>{maskSecret("")}</CodePre>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>Coding agent prompt</SectionTitle>
            {sdkInstallPrompt ? (
              <Button
                variant="ghost"
                className="min-h-10"
                onClick={() => copyText(sdkInstallPrompt, "prompt")}
              >
                {copiedPrompt ? "Copiado" : "Copiar"}
              </Button>
            ) : null}
          </div>
          {displayedInstallPrompt ? (
            <CodePre>{displayedInstallPrompt}</CodePre>
          ) : null}
        </Card>
      </Page>
    );
  }

  return (
    <Page>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{business.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
              {business.category ? <span>{business.category}</span> : null}
              {business.category ? (
                <span className="text-[var(--color-subtle)]">-</span>
              ) : null}
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
          { id: "integracion", label: "Integracion" },
          { id: "metricas", label: "Metricas", meta: "7d" },
        ]}
      />

      {tab === "integracion" ? (
        <TabPanel key="integracion">
          <div className="space-y-4">
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

            <SectionTitle>SDK y agente</SectionTitle>
            <Card>
            <div className="space-y-4">
              {(sdkKeyPlaintext || sdkInstallPrompt) ? (
                <div className="flex justify-end">
                  <EyeToggle
                    reveal={revealSecrets}
                    onReveal={() => setRevealSecrets((v) => !v)}
                  />
                </div>
              ) : null}
              {sdkKeyPlaintext ? (
                <>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      className="min-h-10"
                      onClick={() => copyText(sdkKeyPlaintext, "key")}
                    >
                      {copiedKey ? "Copiado" : "Copiar key"}
                    </Button>
                  </div>
                  <CodePre>{displayedSdkKey}</CodePre>
                </>
              ) : (
                <Field label={sdkKey?.label ?? "API key SDK"}>
                  <Input
                    readOnly
                    value={sdkKey ? `${sdkKey.key_prefix}...` : "sin key"}
                  />
                </Field>
              )}
              {sdkKey ? (
                <div className="flex flex-wrap gap-1">
                  {sdkKey.scopes.map((s) => (
                    <Badge key={s} tone="neutral">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {displayedInstallPrompt ? (
                <>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      className="min-h-10"
                      onClick={() =>
                        sdkInstallPrompt && copyText(sdkInstallPrompt, "prompt")
                      }
                      disabled={!sdkInstallPrompt}
                    >
                      {copiedPrompt ? "Copiado" : "Copiar prompt"}
                    </Button>
                  </div>
                  <CodePre>{displayedInstallPrompt}</CodePre>
                </>
              ) : null}
            </div>
          </Card>
          </div>
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
