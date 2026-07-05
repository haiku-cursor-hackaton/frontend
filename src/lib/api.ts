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

function networkErrorMessage(): string {
  const base = API_BASE || "(no configurada)";
  return `No se pudo conectar con el backend (${base}). Comprueba que uvicorn esté corriendo y que VITE_UCP_API_URL apunte al puerto correcto (8000).`;
}

async function apiFetch(
  path: string,
  init: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error(networkErrorMessage());
  }
  return res;
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
  const res = await apiFetch("/v1/connect/client", {
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
  const res = await apiFetch("/v1/merchants/register", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json();
}

export interface ConnectMerchantResponse {
  profile_id: string;
  business_id: string;
  status: "pending" | "active" | "suspended" | "archived";
  already_bootstrapped: boolean;
  /** Plaintext only on first bootstrap. */
  sdk_api_key: string | null;
  sdk_api_key_prefix: string | null;
}

export async function connectMerchant(body?: {
  full_name?: string;
  business_name?: string;
  category?: string;
}): Promise<ConnectMerchantResponse> {
  const res = await apiFetch("/v1/connect/merchant", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json();
}

export interface LinkMerchantResponse {
  business_id: string;
  root_url: string;
  well_known_url: string;
  ucp_base_url: string;
  domain: string;
  capabilities: Record<string, unknown>;
  status: "active";
}

export async function linkMerchantUrl(
  businessId: string,
  body: { root_url: string; ucp_inbound_api_key?: string },
): Promise<LinkMerchantResponse> {
  const res = await apiFetch(
    `/v1/merchants/${encodeURIComponent(businessId)}/link`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error(await readApiError(res));
  }
  return res.json();
}

export function isApiConfigured(): boolean {
  return Boolean(API_BASE);
}
