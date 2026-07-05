import type {
  ApiKey,
  ApiKeyScope,
  Business,
  BusinessStatus,
  CheckoutSession,
  CurrencyCode,
  MerchantDomain,
  OrderRecord,
  Payment,
  Profile,
  UCPCapability,
  UCPCapabilityGroup,
  UCPOperation,
  UsageEvent,
  UsageStatus,
  Wallet,
} from "@/types/ucp";
import type { Tables } from "@/types/database";

function asCurrency(v: string): CurrencyCode {
  return (v as CurrencyCode) || "USD";
}

function asScopes(v: unknown): ApiKeyScope[] {
  if (Array.isArray(v)) return v as ApiKeyScope[];
  return [];
}

function asCapabilities(v: unknown): UCPCapability[] {
  if (Array.isArray(v)) return v as UCPCapability[];
  if (v && typeof v === "object") return Object.keys(v) as UCPCapability[];
  return [];
}

function capabilityForOperation(
  operation: UCPOperation,
  fallback: string | null,
): UCPCapabilityGroup {
  if (fallback) return fallback as UCPCapabilityGroup;
  if (operation === "get_user_profile") return "wallet";
  if (operation === "get_order") return "order";
  if (
    operation === "create_checkout" ||
    operation === "get_checkout" ||
    operation === "update_checkout" ||
    operation === "complete_checkout" ||
    operation === "cancel_checkout"
  ) {
    return "checkout";
  }
  return "catalog";
}

function mapUsageStatus(db: string): UsageStatus {
  if (db === "success") return "ok";
  if (db === "error") return "error";
  return "pending";
}

export function mapProfile(
  row: Tables<"profiles">,
  email: string,
): Profile {
  return {
    id: row.id,
    account_type: row.account_type as Profile["account_type"],
    full_name: row.full_name ?? "",
    email,
    country: row.country ?? undefined,
    created_at: row.created_at,
  };
}

export function mapWallet(row: Tables<"wallets">): Wallet {
  return {
    id: row.id,
    profile_id: row.profile_id,
    available_minor: Number(row.available_minor),
    reserved_minor: Number(row.reserved_minor),
    currency: asCurrency(row.currency),
  };
}

export function mapBusiness(row: Tables<"businesses">): Business {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    category: row.category ?? "",
    status: row.status as BusinessStatus,
    well_known_url: row.well_known_url,
    ucp_base_url: row.ucp_base_url ?? "",
    ucp_capabilities: asCapabilities(row.ucp_capabilities),
    created_at: row.created_at,
  };
}

export function mapMerchantDomain(row: Tables<"merchant_domains">): MerchantDomain {
  return {
    id: row.id,
    business_id: row.business_id,
    domain: row.domain,
    verified: row.verified,
  };
}

export function mapApiKey(row: Tables<"api_keys">): ApiKey {
  return {
    id: row.id,
    key_type: row.key_type as ApiKey["key_type"],
    profile_id: row.profile_id ?? undefined,
    business_id: row.business_id ?? undefined,
    label: row.label ?? "",
    key_prefix: row.key_prefix ?? "",
    scopes: asScopes(row.scopes),
    status: row.status as ApiKey["status"],
    created_at: row.created_at,
    revoked_at: row.revoked_at ?? undefined,
    last_used_at: row.last_used_at ?? undefined,
  };
}

export function mapPayment(row: Tables<"payments">): Payment {
  return {
    id: row.id,
    checkout_session_id: row.checkout_session_id ?? "",
    order_id: row.order_id ?? undefined,
    wallet_id: row.wallet_id,
    amount_minor: Number(row.amount_minor),
    currency: asCurrency(row.currency),
    status: row.status as Payment["status"],
    handler_id: row.handler_id ?? "",
    created_at: row.created_at,
  };
}

export function mapUsageEvent(row: Tables<"usage_events">): UsageEvent {
  const operation = row.operation as UCPOperation;
  return {
    id: String(row.id),
    business_id: row.business_id ?? "",
    profile_id: row.profile_id ?? "",
    api_key_id: row.api_key_id ?? "",
    checkout_session_id: row.checkout_session_id ?? undefined,
    order_id: row.order_id ?? undefined,
    request_id: row.request_id ?? "",
    transport: row.transport as UsageEvent["transport"],
    operation,
    capability: capabilityForOperation(operation, row.capability),
    product_ref: row.product_ref ?? undefined,
    client_name: row.client_name ?? undefined,
    status: mapUsageStatus(row.status),
    latency_ms: row.latency_ms ?? 0,
    error_code: row.error_code ?? undefined,
    is_purchase: row.is_purchase,
    revenue_minor: row.revenue_minor ? Number(row.revenue_minor) : undefined,
    occurred_at: row.created_at,
  };
}

export function mapCheckoutSession(row: Tables<"checkout_sessions">): CheckoutSession {
  return {
    id: row.id,
    business_id: row.business_id,
    profile_id: row.profile_id,
    external_checkout_id: row.external_checkout_id ?? "",
    status: row.status as CheckoutSession["status"],
    total_minor: Number(row.total_minor),
    currency: asCurrency(row.currency),
    snapshot: row.snapshot as unknown as CheckoutSession["snapshot"],
    expires_at: row.expires_at ?? undefined,
    created_at: row.created_at,
  };
}

export function mapOrder(row: Tables<"orders">): OrderRecord {
  return {
    id: row.id,
    checkout_session_id: row.checkout_session_id ?? "",
    business_id: row.business_id,
    profile_id: row.profile_id,
    external_order_id: row.external_order_id ?? "",
    status: row.status as OrderRecord["status"],
    total_minor: Number(row.total_minor),
    currency: asCurrency(row.currency),
    permalink_url: row.permalink_url ?? "",
    snapshot: row.snapshot as unknown as OrderRecord["snapshot"],
    created_at: row.created_at,
  };
}
