import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
  cx,
} from "@/components/ui";
import {
  businesses,
  businessById,
  currentProfile,
  productsForBusiness,
  productById,
  checkoutSessions,
  orders,
  apiKeys,
} from "@/data/mock";
import { formatDateTime, formatLatency } from "@/lib/money";
import type {
  Business,
  UCPCapabilityGroup,
  UCPOperation,
  UsageEvent,
  UsageStatus,
} from "@/types/ucp";

// ---------------------------------------------------------------------------
// Definición de las 9 tools UCP
// ---------------------------------------------------------------------------

type ToolInput = {
  key: string;
  label: string;
  placeholder?: string;
  optional?: boolean;
};

interface Tool {
  id: UCPOperation;
  capability: UCPCapabilityGroup;
  title: string;
  description: string;
  inputs: ToolInput[];
  needsCapability?: string; // capability UCP anunciada por el comercio
}

const TOOLS: Tool[] = [
  {
    id: "search_catalog",
    capability: "catalog",
    title: "search_catalog",
    description: "Busca productos en el catálogo del comercio.",
    inputs: [
      { key: "query", label: "query", placeholder: "cargador usb" },
      { key: "price_max", label: "price.max (minor)", placeholder: "10000", optional: true },
    ],
    needsCapability: "dev.ucp.shopping.catalog.search",
  },
  {
    id: "lookup_catalog",
    capability: "catalog",
    title: "lookup_catalog",
    description: "Resuelve productos por su id (SKU) exacto.",
    inputs: [
      { key: "ids", label: "ids (coma-separado)", placeholder: "product_123, product_456" },
    ],
    needsCapability: "dev.ucp.shopping.catalog.lookup",
  },
  {
    id: "get_product",
    capability: "catalog",
    title: "get_product",
    description: "Devuelve el detalle de un producto.",
    inputs: [{ key: "id", label: "id", placeholder: "product_123" }],
    needsCapability: "dev.ucp.shopping.catalog.lookup",
  },
  {
    id: "create_checkout",
    capability: "checkout",
    title: "create_checkout",
    description: "Crea un checkout con line_items en el comercio.",
    inputs: [
      { key: "product_id", label: "item.id", placeholder: "product_123" },
      { key: "quantity", label: "quantity", placeholder: "1" },
    ],
    needsCapability: "dev.ucp.shopping.checkout",
  },
  {
    id: "get_checkout",
    capability: "checkout",
    title: "get_checkout",
    description: "Consulta el estado de un checkout existente.",
    inputs: [{ key: "id", label: "checkout_id", placeholder: "cs_1" }],
    needsCapability: "dev.ucp.shopping.checkout",
  },
  {
    id: "update_checkout",
    capability: "checkout",
    title: "update_checkout",
    description: "Actualiza buyer / line_items del checkout.",
    inputs: [
      { key: "id", label: "checkout_id", placeholder: "cs_2" },
      { key: "email", label: "buyer.email", placeholder: "roderick@demo.genko.dev" },
    ],
    needsCapability: "dev.ucp.shopping.checkout",
  },
  {
    id: "complete_checkout",
    capability: "checkout",
    title: "complete_checkout",
    description: "Coloca la orden. Reserva y captura en la wallet simulada.",
    inputs: [{ key: "id", label: "checkout_id", placeholder: "cs_2" }],
    needsCapability: "dev.ucp.shopping.checkout",
  },
  {
    id: "cancel_checkout",
    capability: "checkout",
    title: "cancel_checkout",
    description: "Cancela un checkout que no se completó.",
    inputs: [{ key: "id", label: "checkout_id", placeholder: "cs_2" }],
    needsCapability: "dev.ucp.shopping.checkout",
  },
  {
    id: "get_order",
    capability: "order",
    title: "get_order",
    description: "Consulta una orden ya creada por el comercio.",
    inputs: [{ key: "id", label: "order_id", placeholder: "ord_1" }],
    needsCapability: "dev.ucp.shopping.order",
  },
];

// ---------------------------------------------------------------------------
// Ejecución simulada — construye un payload UCP realista
// ---------------------------------------------------------------------------

interface RunResult {
  ok: boolean;
  status: UsageStatus;
  latency_ms: number;
  response: unknown;
  error_code?: string;
  is_purchase: boolean;
  revenue_minor?: number;
  product_ref?: string;
}

function randomLatency(): number {
  return Math.round(80 + Math.random() * 500);
}

function runTool(
  tool: Tool,
  business: Business,
  input: Record<string, string>,
): RunResult {
  const latency = randomLatency();
  const capabilityOk =
    !tool.needsCapability ||
    business.ucp_capabilities.some((c) => c === tool.needsCapability);

  if (!capabilityOk) {
    return {
      ok: false,
      status: "error",
      latency_ms: latency,
      error_code: "capability_unavailable",
      is_purchase: false,
      response: {
        status: "error",
        messages: [
          {
            code: "capability_unavailable",
            capability: tool.needsCapability,
            text: `${business.name} no anuncia ${tool.needsCapability}.`,
          },
        ],
      },
    };
  }

  const bizProducts = productsForBusiness(business.id);

  switch (tool.id) {
    case "search_catalog": {
      const q = (input.query ?? "").toLowerCase();
      const priceMax = Number(input.price_max);
      let hits = bizProducts;
      if (q) hits = hits.filter((p) => p.title.toLowerCase().includes(q));
      if (!Number.isNaN(priceMax) && priceMax > 0)
        hits = hits.filter((p) => p.price <= priceMax);
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        response: {
          ucp: { version: "2026-04-08" },
          products: hits.map((p) => ({
            id: p.id,
            title: p.title,
            variants: [
              {
                id: p.id,
                price: { amount: p.price, currency: p.currency },
                available: p.available,
              },
            ],
          })),
          pagination: { limit: 20, cursor: null },
        },
      };
    }
    case "lookup_catalog": {
      const ids = (input.ids ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const hits = ids.map((id) => productById(id)).filter(Boolean);
      const unknown = ids.filter((id) => !productById(id));
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        product_ref: ids[0],
        response: {
          products: hits,
          messages: unknown.map((id) => ({
            code: "not_found",
            severity: "info",
            id,
          })),
        },
      };
    }
    case "get_product": {
      const p = productById(input.id ?? "");
      if (!p)
        return {
          ok: false,
          status: "error",
          latency_ms: latency,
          error_code: "not_found",
          is_purchase: false,
          product_ref: input.id,
          response: {
            status: "error",
            messages: [{ code: "not_found", id: input.id }],
          },
        };
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        product_ref: p.id,
        response: {
          product: {
            id: p.id,
            title: p.title,
            description: p.description,
            price: { amount: p.price, currency: p.currency },
            available: p.available,
          },
        },
      };
    }
    case "create_checkout": {
      const p = productById(input.product_id ?? "");
      const qty = Math.max(1, Number(input.quantity ?? 1) || 1);
      if (!p)
        return {
          ok: false,
          status: "error",
          latency_ms: latency,
          error_code: "item_unavailable",
          is_purchase: false,
          product_ref: input.product_id,
          response: {
            status: "error",
            messages: [{ code: "item_unavailable", id: input.product_id }],
          },
        };
      const subtotal = p.price * qty;
      const tax = Math.round(subtotal * 0.13);
      const newId = `cs_new_${Math.random().toString(36).slice(2, 6)}`;
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        product_ref: p.id,
        response: {
          checkout_session: {
            id: newId,
            status: "incomplete",
            currency: p.currency,
            line_items: [
              {
                id: "line_1",
                item: { id: p.id, title: p.title, price: p.price },
                quantity: qty,
              },
            ],
            totals: [
              { type: "subtotal", amount: subtotal },
              { type: "tax", amount: tax },
              { type: "total", amount: subtotal + tax },
            ],
            messages: [
              {
                code: "field_required",
                field: "buyer.email",
                severity: "info",
              },
            ],
          },
        },
      };
    }
    case "get_checkout": {
      const cs = checkoutSessions.find((s) => s.id === input.id);
      if (!cs)
        return {
          ok: false,
          status: "error",
          latency_ms: latency,
          error_code: "not_found",
          is_purchase: false,
          response: {
            status: "error",
            messages: [{ code: "not_found", id: input.id }],
          },
        };
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        response: { checkout_session: cs.snapshot ?? cs },
      };
    }
    case "update_checkout": {
      const cs = checkoutSessions.find((s) => s.id === input.id);
      if (!cs)
        return {
          ok: false,
          status: "error",
          latency_ms: latency,
          error_code: "not_found",
          is_purchase: false,
          response: {
            status: "error",
            messages: [{ code: "not_found", id: input.id }],
          },
        };
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        response: {
          checkout_session: {
            ...(cs.snapshot ?? cs),
            buyer: { email: input.email || undefined },
            status: input.email ? "ready_for_complete" : "incomplete",
          },
        },
      };
    }
    case "complete_checkout": {
      const cs = checkoutSessions.find((s) => s.id === input.id);
      if (!cs)
        return {
          ok: false,
          status: "error",
          latency_ms: latency,
          error_code: "not_found",
          is_purchase: false,
          response: {
            status: "error",
            messages: [{ code: "not_found", id: input.id }],
          },
        };
      return {
        ok: true,
        status: "ok",
        latency_ms: latency + 200,
        is_purchase: true,
        revenue_minor: cs.total_minor,
        response: {
          checkout_session: {
            ...(cs.snapshot ?? cs),
            status: "completed",
            order: {
              id: `order_new_${Math.random().toString(36).slice(2, 5)}`,
              label: "Order #new",
              permalink_url: `${business.ucp_base_url.replace("/ucp/v1", "")}/orders/new`,
            },
          },
          payment: {
            handler_id: "dev.platform.simulated_balance",
            status: "captured",
            amount_minor: cs.total_minor,
          },
        },
      };
    }
    case "cancel_checkout": {
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        response: {
          checkout_session: { id: input.id, status: "canceled" },
        },
      };
    }
    case "get_order": {
      const o = orders.find((x) => x.id === input.id);
      if (!o)
        return {
          ok: false,
          status: "error",
          latency_ms: latency,
          error_code: "not_found",
          is_purchase: false,
          response: {
            status: "error",
            messages: [{ code: "not_found", id: input.id }],
          },
        };
      return {
        ok: true,
        status: "ok",
        latency_ms: latency,
        is_purchase: false,
        response: {
          order: {
            id: o.external_order_id,
            label: `Order · ${o.status}`,
            permalink_url: o.permalink_url,
            status: o.status,
            totals: o.snapshot?.totals ?? [],
          },
        },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

const CAPABILITY_TONE: Record<UCPCapabilityGroup, "brand" | "accent" | "warn"> = {
  catalog: "brand",
  checkout: "accent",
  order: "warn",
};

interface LogRow extends UsageEvent {
  response: unknown;
}

export default function Agente() {
  const activeBusinesses = businesses.filter((b) => b.status === "active");
  const [businessId, setBusinessId] = useState<string>(activeBusinesses[0]?.id);
  const [apiKeyId, setApiKeyId] = useState<string>(
    apiKeys.find((k) => k.key_type === "mcp" && k.status === "active")?.id ?? "",
  );
  const [clientName, setClientName] = useState<string>("Claude Desktop");
  const [selectedTool, setSelectedTool] = useState<UCPOperation>("search_catalog");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [log, setLog] = useState<LogRow[]>([]);
  const [lastResponse, setLastResponse] = useState<unknown>(null);
  const [running, setRunning] = useState(false);

  const business = businessById(businessId);
  const tool = TOOLS.find((t) => t.id === selectedTool) ?? TOOLS[0];

  const activeKeyScopes = useMemo(() => {
    const k = apiKeys.find((x) => x.id === apiKeyId);
    return k?.scopes ?? [];
  }, [apiKeyId]);

  function updateInput(key: string, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function execute() {
    if (!business) return;
    setRunning(true);
    setLastResponse(null);
    // Simulamos la latencia con un mini-delay para que se sienta real.
    await new Promise((r) => setTimeout(r, 250));
    const result = runTool(tool, business, inputs);
    const event: LogRow = {
      id: `ue_new_${Math.random().toString(36).slice(2, 6)}`,
      business_id: business.id,
      profile_id: currentProfile.id,
      api_key_id: apiKeyId || "key_mcp_1",
      request_id: `req_${Math.random().toString(36).slice(2, 8)}`,
      transport: "mcp",
      operation: tool.id,
      capability: tool.capability,
      product_ref: result.product_ref,
      client_name: clientName || undefined,
      status: result.status,
      latency_ms: result.latency_ms,
      error_code: result.error_code,
      is_purchase: result.is_purchase,
      revenue_minor: result.revenue_minor,
      occurred_at: new Date().toISOString(),
      response: result.response,
    };
    setLog((prev) => [event, ...prev].slice(0, 20));
    setLastResponse(result.response);
    setRunning(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Playground UCP · Agente MCP</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Simula las 9 tools UCP contra un comercio. Cada ejecución genera un{" "}
          <code>usage_event</code> y devuelve un payload como el que verías en{" "}
          <code>POST /ucp/mcp</code>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Field label="Comercio (business)">
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-fg)]"
          >
            {activeBusinesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="API key MCP">
          <select
            value={apiKeyId}
            onChange={(e) => setApiKeyId(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-fg)]"
          >
            {apiKeys
              .filter((k) => k.key_type === "mcp")
              .map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label} · {k.key_prefix}… ({k.status})
                </option>
              ))}
          </select>
        </Field>
        <Field label="client_name">
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Claude Desktop, Cursor, Codex CLI…"
          />
        </Field>
      </div>

      {business ? (
        <Card>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[var(--color-muted)]">Capabilities:</span>
            {business.ucp_capabilities.map((c) => (
              <Badge key={c} tone="brand">
                {c.replace("dev.ucp.shopping.", "")}
              </Badge>
            ))}
            <span className="ml-4 text-[var(--color-muted)]">Scopes:</span>
            {activeKeyScopes.length === 0 ? (
              <span className="text-[var(--color-subtle)]">— sin scopes —</span>
            ) : (
              activeKeyScopes.map((s) => (
                <Badge key={s} tone="neutral">
                  {s}
                </Badge>
              ))
            )}
          </div>
        </Card>
      ) : null}

      <div>
        <SectionTitle>Elige una tool UCP</SectionTitle>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TOOLS.map((t) => {
            const on = t.id === selectedTool;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTool(t.id);
                  setInputs({});
                  setLastResponse(null);
                }}
                className={cx(
                  "rounded-[14px] border p-3 text-left transition-colors",
                  on
                    ? "border-[var(--color-fg)] bg-[var(--color-surface-2)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <code className="text-sm font-medium text-[var(--color-fg)]">
                    {t.title}
                  </code>
                  <Badge tone={CAPABILITY_TONE[t.capability]}>{t.capability}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle hint={tool.needsCapability}>
            Inputs · <code>{tool.title}</code>
          </SectionTitle>
          <Card>
            <div className="space-y-3">
              {tool.inputs.map((inp) => (
                <Field key={inp.key} label={inp.label}>
                  <Input
                    value={inputs[inp.key] ?? ""}
                    onChange={(e) => updateInput(inp.key, e.target.value)}
                    placeholder={inp.placeholder}
                  />
                </Field>
              ))}
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={execute}
                  disabled={running || !business}
                >
                  {running ? "Ejecutando…" : "Ejecutar"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <SectionTitle hint="respuesta del servidor UCP (simulada)">
            Response
          </SectionTitle>
          <Card padded={false} className="overflow-hidden">
            <pre className="max-h-[420px] overflow-auto bg-[var(--color-surface-2)] px-4 py-3 text-xs leading-relaxed text-[var(--color-fg)]">
{lastResponse
                ? JSON.stringify(lastResponse, null, 2)
                : "// Ejecuta una tool para ver el JSON de respuesta."}
            </pre>
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle hint="usage_events registrados en esta sesión">
          Log local
        </SectionTitle>
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-subtle)]">
                <th className="px-4 py-2 font-medium">Hora</th>
                <th className="px-4 py-2 font-medium">Tool</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 text-right font-medium">Latencia</th>
              </tr>
            </thead>
            <tbody>
              {log.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {formatDateTime(row.occurred_at)}
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-[var(--color-fg)]">{row.operation}</code>
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
                    Aún no has ejecutado nada.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
