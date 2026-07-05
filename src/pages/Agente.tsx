import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  MobileRecordList,
  Pagination,
  SectionTitle,
  TabPanel,
  Tabs,
  cx,
} from "@/components/ui";
import {
  getStoredMcpKey,
  queryKeys,
  storeMcpKey,
  useActiveBusinesses,
  useApiKeys,
  useMerchantDomains,
  useProfile,
} from "@/hooks/useData";
import { CAPABILITY_LABEL, OPERATION_LABEL } from "@/lib/constants";
import { callMcpTool, merchantUrlFromBusiness } from "@/lib/mcp-client";
import { formatDateTime, formatLatency } from "@/lib/money";
import type {
  Business,
  UCPCapabilityGroup,
  UCPOperation,
  UsageStatus,
} from "@/types/ucp";

type AgentTab = "conexion" | "operacion" | "respuesta" | "log";
const LOG_PAGE_SIZE = 10;

type ToolInput = {
  key: string;
  label: string;
  param?: string;
  placeholder?: string;
  optional?: boolean;
};

interface Tool {
  id: UCPOperation;
  capability: UCPCapabilityGroup;
  label: string;
  description: string;
  inputs: ToolInput[];
  requiresMerchant?: boolean;
}

const TOOLS: Tool[] = [
  {
    id: "get_user_profile",
    capability: "wallet",
    label: OPERATION_LABEL.get_user_profile,
    description: "Consulta tu perfil MCP y el saldo disponible de wallet.",
    inputs: [],
    requiresMerchant: false,
  },
  {
    id: "search_catalog",
    capability: "catalog",
    label: OPERATION_LABEL.search_catalog,
    description: "Busca productos en el catalogo del comercio.",
    inputs: [
      { key: "query", label: "Texto de busqueda", param: "query", placeholder: "cargador usb" },
      {
        key: "price_max",
        label: "Precio maximo",
        param: "filters.price.max",
        placeholder: "10000",
        optional: true,
      },
    ],
  },
  {
    id: "lookup_catalog",
    capability: "catalog",
    label: OPERATION_LABEL.lookup_catalog,
    description: "Resuelve productos por su id exacto.",
    inputs: [
      {
        key: "ids",
        label: "IDs de producto",
        param: "ids",
        placeholder: "product_123, product_456",
      },
    ],
  },
  {
    id: "get_product",
    capability: "catalog",
    label: OPERATION_LABEL.get_product,
    description: "Devuelve el detalle de un producto.",
    inputs: [
      { key: "id", label: "ID del producto", param: "id", placeholder: "product_123" },
    ],
  },
  {
    id: "create_checkout",
    capability: "checkout",
    label: OPERATION_LABEL.create_checkout,
    description: "Crea un checkout con los productos seleccionados.",
    inputs: [
      { key: "product_id", label: "ID del producto", param: "line_items[].item.id", placeholder: "product_123" },
      { key: "quantity", label: "Cantidad", param: "line_items[].quantity", placeholder: "1" },
    ],
  },
  {
    id: "get_checkout",
    capability: "checkout",
    label: OPERATION_LABEL.get_checkout,
    description: "Consulta el estado de un checkout existente.",
    inputs: [
      { key: "id", label: "ID del checkout", param: "id", placeholder: "cs_1" },
    ],
  },
  {
    id: "update_checkout",
    capability: "checkout",
    label: OPERATION_LABEL.update_checkout,
    description: "Actualiza los datos del comprador o los productos.",
    inputs: [
      { key: "id", label: "ID del checkout", param: "id", placeholder: "cs_2" },
      { key: "email", label: "Email del comprador", param: "buyer.email", placeholder: "tu@correo.com" },
    ],
  },
  {
    id: "complete_checkout",
    capability: "checkout",
    label: OPERATION_LABEL.complete_checkout,
    description: "Coloca la orden; Genko reserva la wallet y el SDK acredita la autorizacion.",
    inputs: [
      { key: "id", label: "ID del checkout", param: "id", placeholder: "cs_2" },
    ],
  },
  {
    id: "cancel_checkout",
    capability: "checkout",
    label: OPERATION_LABEL.cancel_checkout,
    description: "Cancela un checkout que no se completo.",
    inputs: [
      { key: "id", label: "ID del checkout", param: "id", placeholder: "cs_2" },
    ],
  },
  {
    id: "get_order",
    capability: "order",
    label: OPERATION_LABEL.get_order,
    description: "Consulta una orden ya creada por el comercio.",
    inputs: [
      { key: "id", label: "ID de la orden", param: "id", placeholder: "ord_1" },
    ],
  },
];

const CAPABILITY_TONE: Record<
  UCPCapabilityGroup,
  "brand" | "accent" | "warn" | "neutral"
> = {
  catalog: "brand",
  checkout: "accent",
  order: "warn",
  wallet: "neutral",
};

interface LogRow {
  id: string;
  operation: UCPOperation;
  status: UsageStatus;
  latency_ms: number;
  is_purchase: boolean;
  error_code?: string;
  occurred_at: string;
}

export default function Agente() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data: activeBusinesses = [], isLoading } = useActiveBusinesses();
  const { data: apiKeys = [] } = useApiKeys();

  const mcpKeys = useMemo(
    () => apiKeys.filter((k) => k.key_type === "mcp" && k.status === "active"),
    [apiKeys],
  );

  const [tab, setTab] = useState<AgentTab>("conexion");
  const [businessId, setBusinessId] = useState<string>("");
  const [apiKeyId, setApiKeyId] = useState<string>("");
  const [apiKeyPlain, setApiKeyPlain] = useState<string>("");
  const [clientName, setClientName] = useState<string>("Claude Desktop");
  const [selectedTool, setSelectedTool] =
    useState<UCPOperation>("get_user_profile");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [log, setLog] = useState<LogRow[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [lastResponse, setLastResponse] = useState<unknown>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeBusinesses.length && !businessId) {
      setBusinessId(activeBusinesses[0].id);
    }
  }, [activeBusinesses, businessId]);

  useEffect(() => {
    if (mcpKeys.length && !apiKeyId) {
      setApiKeyId(mcpKeys[0].id);
      const stored = getStoredMcpKey(mcpKeys[0].key_prefix);
      if (stored) setApiKeyPlain(stored);
    }
  }, [mcpKeys, apiKeyId]);

  const business = activeBusinesses.find((b) => b.id === businessId);
  const { data: domains = [] } = useMerchantDomains(businessId);
  const tool = TOOLS.find((t) => t.id === selectedTool) ?? TOOLS[0];
  const selectedKey = mcpKeys.find((k) => k.id === apiKeyId);
  const logPageCount = Math.max(1, Math.ceil(log.length / LOG_PAGE_SIZE));
  const currentLogPage = Math.min(logPage, logPageCount);
  const paginatedLog = log.slice(
    (currentLogPage - 1) * LOG_PAGE_SIZE,
    currentLogPage * LOG_PAGE_SIZE,
  );

  useEffect(() => {
    if (selectedKey) {
      const stored = getStoredMcpKey(selectedKey.key_prefix);
      if (stored) setApiKeyPlain(stored);
    }
  }, [selectedKey]);

  function updateInput(key: string, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function resolveMerchantUrl(b: Business): string {
    const verified = domains.find((d) => d.verified);
    return merchantUrlFromBusiness(b.well_known_url, verified?.domain);
  }

  async function execute() {
    const requiresMerchant = tool.requiresMerchant !== false;
    if (!apiKeyPlain) {
      setError("Pega tu API key MCP.");
      setTab("conexion");
      return;
    }
    if (requiresMerchant && !business) {
      setError("Selecciona un comercio para esta tool.");
      setTab("conexion");
      return;
    }
    setRunning(true);
    setError(null);
    setLastResponse(null);

    storeMcpKey(selectedKey?.key_prefix ?? "manual", apiKeyPlain);

    try {
      const result = await callMcpTool(
        apiKeyPlain,
        tool.id,
        inputs,
        business ? resolveMerchantUrl(business) : undefined,
      );

      const isPurchase = tool.id === "complete_checkout" && result.ok;
      const status: UsageStatus = result.ok ? "ok" : "error";

      const row: LogRow = {
        id: crypto.randomUUID(),
        operation: tool.id,
        status,
        latency_ms: result.latency_ms,
        is_purchase: isPurchase,
        error_code: result.error,
        occurred_at: new Date().toISOString(),
      };
      setLog((prev) => [row, ...prev].slice(0, 20));
      setLogPage(1);
      setLastResponse(result.response);
      setTab("respuesta");

      if (profile?.id) {
        qc.invalidateQueries({
          queryKey: queryKeys.usageEvents(profile.id),
        });
        qc.invalidateQueries({ queryKey: queryKeys.wallet(profile.id) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ejecutar tool");
      setTab("respuesta");
    } finally {
      setRunning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando comercios...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Playground UCP - Agente MCP</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Ejecuta tools del gateway MCP via <code>POST /mcp</code>.
          </p>
        </div>
        <Tabs<AgentTab>
          ariaLabel="Secciones del agente"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "conexion", label: "Conexion" },
            { id: "operacion", label: "Operacion" },
            { id: "respuesta", label: "Respuesta" },
            { id: "log", label: "Log", meta: log.length },
          ]}
        />
      </div>

      {error ? (
        <p className="shrink-0 text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}

      {tab === "conexion" ? (
        <TabPanel key="conexion" className="flex-1">
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Comercio">
                <select
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-fg)]"
                >
                  {activeBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} - {b.category}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="API key MCP">
                <select
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-fg)]"
                >
                  {mcpKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label} - {k.key_prefix}...
                    </option>
                  ))}
                </select>
                <Input
                  type="password"
                  value={apiKeyPlain}
                  onChange={(e) => setApiKeyPlain(e.target.value)}
                  placeholder="gk_mcp_... (pega la key completa)"
                />
              </Field>
            </div>

            <Field label="Nombre del agente">
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Claude Desktop, Cursor, Codex CLI..."
              />
            </Field>

            {business ? (
              <Card>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[var(--color-muted)]">Capacidades:</span>
                  {business.ucp_capabilities.map((c) => (
                    <Badge key={c} tone="brand">
                      {c.replace("dev.ucp.shopping.", "")}
                    </Badge>
                  ))}
                  <span className="ml-4 text-[var(--color-muted)]">
                    URL del comercio:
                  </span>
                  <code className="break-all text-[var(--color-fg)]">
                    {resolveMerchantUrl(business)}
                  </code>
                </div>
              </Card>
            ) : null}
          </div>
        </TabPanel>
      ) : tab === "operacion" ? (
        <TabPanel key="operacion" className="flex-1">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="min-w-0">
              <SectionTitle>Elige una operacion</SectionTitle>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                {TOOLS.map((t) => {
                  const on = t.id === selectedTool;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTool(t.id);
                        setInputs({});
                        setLastResponse(null);
                      }}
                      className={cx(
                        "rounded-lg border p-3 text-left transition-all duration-300 ease-out",
                        on
                          ? "border-[var(--color-fg)] bg-[var(--color-surface-2)] shadow-[var(--shadow-card)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)]",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[var(--color-fg)]">
                          {t.label}
                        </span>
                        <Badge tone={CAPABILITY_TONE[t.capability]}>
                          {CAPABILITY_LABEL[t.capability]}
                        </Badge>
                      </div>
                      <code className="mt-0.5 block text-[10px] text-[var(--color-subtle)]">
                        {t.id}
                      </code>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-0">
              <SectionTitle hint={tool.id}>Parametros - {tool.label}</SectionTitle>
              <Card>
                <div className="space-y-3">
                  {tool.inputs.length === 0 ? (
                    <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-muted)]">
                      Esta tool no requiere parametros.
                    </p>
                  ) : null}
                  {tool.inputs.map((inp) => (
                    <label key={inp.key} className="block space-y-1.5">
                      <span className="text-xs font-medium text-[var(--color-muted)]">
                        {inp.label}
                        {inp.optional ? (
                          <span className="ml-1 font-normal text-[var(--color-subtle)]">
                            (opcional)
                          </span>
                        ) : null}
                      </span>
                      {inp.param ? (
                        <span className="block text-[10px] text-[var(--color-subtle)]">
                          parametro: <code>{inp.param}</code>
                        </span>
                      ) : null}
                      <Input
                        value={inputs[inp.key] ?? ""}
                        onChange={(e) => updateInput(inp.key, e.target.value)}
                        placeholder={inp.placeholder}
                      />
                    </label>
                  ))}
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      onClick={execute}
                      disabled={
                        running ||
                        !apiKeyPlain ||
                        (tool.requiresMerchant !== false && !business)
                      }
                      className="transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      {running ? "Ejecutando..." : "Ejecutar"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>
      ) : tab === "respuesta" ? (
        <TabPanel key="respuesta" className="flex-1">
          <SectionTitle hint="respuesta del gateway MCP">Respuesta</SectionTitle>
          <Card padded={false} className="overflow-hidden">
            <pre className="max-h-[calc(100vh-250px)] min-h-[320px] overflow-auto bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-relaxed text-[var(--color-fg)]">
              {lastResponse
                ? JSON.stringify(lastResponse, null, 2)
                : "// Ejecuta una tool para ver el JSON de respuesta."}
            </pre>
          </Card>
        </TabPanel>
      ) : (
        <TabPanel key="log" className="flex-1">
          <SectionTitle hint="ejecuciones en esta sesion">Log local</SectionTitle>
          <div className="md:hidden">
            <MobileRecordList
              records={paginatedLog.map((row) => ({
                id: row.id,
                eyebrow: formatDateTime(row.occurred_at),
                title: (
                  <span>
                    {OPERATION_LABEL[row.operation]}
                    {row.is_purchase ? (
                      <span className="ml-2 align-middle">
                        <Badge tone="accent">compra</Badge>
                      </span>
                    ) : null}
                  </span>
                ),
                meta: (
                  <Badge
                    tone={
                      row.status === "ok"
                        ? "accent"
                        : row.status === "pending"
                          ? "warn"
                          : "danger"
                    }
                  >
                    {row.status}
                  </Badge>
                ),
                fields: [
                  { label: "Latencia", value: formatLatency(row.latency_ms) },
                  { label: "Operacion", value: row.operation },
                ],
                footer: row.error_code ? (
                  <span className="text-xs text-[var(--color-danger)]">
                    {row.error_code}
                  </span>
                ) : null,
              }))}
              empty="Aun no has ejecutado nada."
            />
            <Pagination
              page={currentLogPage}
              pageSize={LOG_PAGE_SIZE}
              total={log.length}
              onPageChange={setLogPage}
              className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
            />
          </div>
          <Card padded={false} className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-subtle)]">
                    <th className="px-4 py-2 font-medium">Hora</th>
                    <th className="px-4 py-2 font-medium">Operacion</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 text-right font-medium">Latencia</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLog.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-2)]/60"
                    >
                      <td className="px-4 py-2 text-[var(--color-muted)]">
                        {formatDateTime(row.occurred_at)}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-[var(--color-fg)]">
                          {OPERATION_LABEL[row.operation]}
                        </span>
                        {row.is_purchase ? (
                          <Badge tone="accent">compra</Badge>
                        ) : null}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          tone={
                            row.status === "ok"
                              ? "accent"
                              : row.status === "pending"
                                ? "warn"
                                : "danger"
                          }
                        >
                          {row.status}
                        </Badge>
                        {row.error_code ? (
                          <span className="ml-2 text-[10px] text-[var(--color-danger)]">
                            {row.error_code}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-right text-[var(--color-muted)]">
                        {formatLatency(row.latency_ms)}
                      </td>
                    </tr>
                  ))}
                  {log.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-xs text-[var(--color-subtle)]"
                      >
                        Aun no has ejecutado nada.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentLogPage}
              pageSize={LOG_PAGE_SIZE}
              total={log.length}
              onPageChange={setLogPage}
            />
          </Card>
        </TabPanel>
      )}
    </div>
  );
}
