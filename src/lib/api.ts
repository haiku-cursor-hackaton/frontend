import { getSupabase } from "@/lib/supabase";

const API_BASE = (import.meta.env.VITE_UCP_API_URL ?? "").replace(/\/$/, "");

async function readApiError(res: Response): Promise<string> {
  const raw = await res.text();
  if (!raw) return `Error ${res.status}`;
  try {
    const parsed = JSON.parse(raw) as { detail?: unknown };
    if (typeof parsed.detail === "string") return parsed.detail;
    return raw;
  } catch {
    return raw;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sesión no válida");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export interface ConnectClientResponse {
  profile_id: string;
  email: string;
  phone?: string;
  mcp_url: string;
  mcp_api_key: string;
  mcp_api_key_prefix: string;
}

/** Bootstrap profile + wallet trigger + primera API key MCP. */
export async function connectClient(body?: {
  full_name?: string;
  country?: string;
}): Promise<ConnectClientResponse> {
  const res = await fetch(`${API_BASE}/v1/connect/client`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json();
}

export interface RegisterMerchantResponse {
  business_id: string;
  root_url: string;
  well_known_url: string;
  ucp_base_url: string;
  domain: string;
  capabilities: Record<string, unknown>;
  sdk_api_key: string;
  sdk_api_key_prefix: string;
}

export async function registerMerchant(body: {
  name: string;
  category?: string;
  root_url: string;
  ucp_inbound_api_key?: string;
}): Promise<RegisterMerchantResponse> {
  const res = await fetch(`${API_BASE}/v1/merchants/register`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json();
}

export function isApiConfigured(): boolean {
  return Boolean(API_BASE);
}
