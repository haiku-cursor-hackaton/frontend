import type { UCPOperation } from "@/types/ucp";

const API_BASE = (import.meta.env.VITE_UCP_API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

interface McpCallResult {
  ok: boolean;
  response: unknown;
  error?: string;
  latency_ms: number;
}

function buildToolArgs(
  tool: UCPOperation,
  inputs: Record<string, string>,
  merchantUrl?: string,
): Record<string, unknown> {
  switch (tool) {
    case "get_user_profile":
      return {};
    case "search_catalog": {
      const args: Record<string, unknown> = { merchant_url: merchantUrl };
      if (inputs.query) args.query = inputs.query;
      if (inputs.price_max) {
        args.filters = { price: { max: Number(inputs.price_max) } };
      }
      return args;
    }
    case "lookup_catalog":
      return {
        merchant_url: merchantUrl,
        ids: (inputs.ids ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    case "get_product":
      return { merchant_url: merchantUrl, id: inputs.id };
    case "create_checkout":
      return {
        merchant_url: merchantUrl,
        line_items: [
          {
            item: { id: inputs.product_id },
            quantity: Math.max(1, Number(inputs.quantity) || 1),
          },
        ],
      };
    case "update_checkout":
      return {
        id: inputs.id,
        buyer: inputs.email ? { email: inputs.email } : undefined,
      };
    case "get_checkout":
    case "complete_checkout":
    case "cancel_checkout":
      return { id: inputs.id };
    case "get_order":
      return { merchant_url: merchantUrl, id: inputs.id };
    default:
      return merchantUrl ? { merchant_url: merchantUrl, ...inputs } : { ...inputs };
  }
}

export async function callMcpTool(
  apiKey: string,
  tool: UCPOperation,
  inputs: Record<string, string>,
  merchantUrl?: string,
): Promise<McpCallResult> {
  const started = performance.now();
  const body = {
    jsonrpc: "2.0",
    id: crypto.randomUUID(),
    method: "tools/call",
    params: {
      name: tool,
      arguments: buildToolArgs(tool, inputs, merchantUrl),
    },
  };

  const res = await fetch(`${API_BASE}/mcp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const latency_ms = Math.round(performance.now() - started);
  const json = await res.json();

  if (json.error) {
    return {
      ok: false,
      response: json,
      error: json.error.message ?? "Error MCP",
      latency_ms,
    };
  }

  const content = json.result?.content;
  let parsed: unknown = json.result?.structuredContent;
  if (parsed === undefined && Array.isArray(content) && content[0]?.type === "text") {
    try {
      parsed = JSON.parse(content[0].text);
    } catch {
      parsed = content[0].text;
    }
  }
  if (parsed === undefined) parsed = json.result;

  return { ok: true, response: parsed, latency_ms };
}

export function merchantUrlFromBusiness(
  wellKnownUrl: string,
  domain?: string,
): string {
  if (domain) return `https://${domain}`;
  try {
    const u = new URL(wellKnownUrl);
    return u.origin;
  } catch {
    return wellKnownUrl;
  }
}
