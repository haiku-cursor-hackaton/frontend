/**
 * Tipos del frontend de genko.
 *
 * Combina dos niveles:
 *
 * 1. Objetos del protocolo UCP (Product, LineItem, Total, Checkout, Order, ...)
 *    provenientes del **comercio** — versión 2026-04-08.
 * 2. Entidades de la BD de la **plataforma** (Supabase) que utiliza el backend
 *    FastAPI (`backend/app/`): profiles, businesses, merchant_domains,
 *    api_keys, wallets, checkout_sessions, orders, payments, usage_events.
 *
 * Todos los importes están en UNIDADES MENORES: `2500` == `$25.00`.
 * Todas las fechas son RFC 3339.
 */

export type CurrencyCode = "USD" | "EUR" | "MXN" | "GTQ";

// ---------------------------------------------------------------------------
// UCP (comercio) — se recibe de una tienda vía UCP REST o del gateway MCP.
// ---------------------------------------------------------------------------

export type TotalType =
  | "subtotal"
  | "discount"
  | "shipping"
  | "tax"
  | "total";

export interface Total {
  type: TotalType;
  amount: number;
}

export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: CurrencyCode;
  available?: boolean;
  business_id?: string;
  imageColor?: string;
}

export interface LineItem {
  id: string;
  item: Pick<Product, "id" | "title" | "price">;
  quantity: number;
}

export type CheckoutStatus =
  | "incomplete"
  | "ready_for_complete"
  | "requires_escalation"
  | "complete_in_progress"
  | "completed"
  | "canceled";

export interface OrderRef {
  id: string;
  label: string;
  permalink_url: string;
}

export interface UCPCheckout {
  id: string;
  status: CheckoutStatus;
  line_items: LineItem[];
  buyer?: { email?: string; phone_number?: string };
  currency: CurrencyCode;
  totals: Total[];
  order?: OrderRef;
  expires_at?: string;
}

export type FulfillmentEventType =
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered";

/** Capabilities anunciadas por el comercio en `/.well-known/ucp`. */
export type UCPCapability =
  | "dev.ucp.shopping.catalog.search"
  | "dev.ucp.shopping.catalog.lookup"
  | "dev.ucp.shopping.checkout"
  | "dev.ucp.shopping.order"
  // Legacy: perfiles cacheados por builds anteriores del backend/SDK.
  | "dev.ucp.shopping.catalog"
  | "dev.ucp.shopping.catalog.product";

// ---------------------------------------------------------------------------
// Plataforma (Supabase) — lo que guarda genko.
// ---------------------------------------------------------------------------

export type AccountType = "client" | "business" | "admin";

export interface Profile {
  id: string;
  account_type: AccountType;
  full_name: string;
  email: string;
  phone?: string;
  country?: string;
  created_at: string;
}

export type BusinessStatus = "pending" | "active" | "suspended";

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  description?: string;
  status: BusinessStatus;
  well_known_url: string;
  ucp_base_url: string;
  ucp_capabilities: UCPCapability[];
  created_at: string;
}

export interface MerchantDomain {
  id: string;
  business_id: string;
  domain: string;
  verified: boolean;
}

/**
 * Scopes de API keys. Difieren según `key_type`:
 *   - `mcp`  → catalog:read, checkout:write, purchase:execute, order:read, wallet:read
 *   - `sdk`  → payment:verify, payment:accredit, payment:release
 */
export type McpApiKeyScope =
  | "catalog:read"
  | "checkout:write"
  | "purchase:execute"
  | "order:read"
  | "wallet:read";

export type SdkApiKeyScope =
  | "payment:verify"
  | "payment:accredit"
  | "payment:release";

export type ApiKeyScope = McpApiKeyScope | SdkApiKeyScope;

export type ApiKeyType = "mcp" | "sdk";
export type ApiKeyStatus = "active" | "revoked";

export interface ApiKey {
  id: string;
  key_type: ApiKeyType;
  profile_id?: string;
  business_id?: string;
  label: string;
  /**
   * Prefijo visible que el backend emite:
   *   - `gk_mcp_<10 chars>`  para keys tipo `mcp`
   *   - `gk_sdk_<10 chars>`  para keys tipo `sdk`
   *
   * El plaintext completo se muestra solo una vez al emitirla.
   */
  key_prefix: string;
  scopes: ApiKeyScope[];
  status: ApiKeyStatus;
  created_at: string;
  revoked_at?: string;
  last_used_at?: string;
}

export interface Wallet {
  id: string;
  profile_id: string;
  available_minor: number;
  reserved_minor: number;
  currency: CurrencyCode;
}

export interface CheckoutSession {
  id: string;
  business_id: string;
  profile_id: string;
  external_checkout_id: string;
  status: CheckoutStatus;
  total_minor: number;
  currency: CurrencyCode;
  /** Snapshot mínimo del último payload UCP relevante. */
  snapshot?: UCPCheckout;
  expires_at?: string;
  created_at: string;
}

export type OrderStatus =
  | "created"
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "canceled";

export interface OrderRecord {
  id: string;
  checkout_session_id: string;
  business_id: string;
  profile_id: string;
  external_order_id: string;
  status: OrderStatus;
  total_minor: number;
  currency: CurrencyCode;
  permalink_url: string;
  fulfillment?: {
    expectations?: { type: string; estimated_delivery?: string }[];
    events: { type: FulfillmentEventType; occurred_at: string }[];
  };
  snapshot?: {
    line_items: LineItem[];
    totals: Total[];
  };
  created_at: string;
}

export type PaymentStatus =
  | "reserved"
  | "submitted"
  | "captured"
  | "released"
  | "failed"
  | "reconciliation_required";

export interface Payment {
  id: string;
  checkout_session_id: string;
  order_id?: string;
  wallet_id: string;
  amount_minor: number;
  currency: CurrencyCode;
  status: PaymentStatus;
  handler_id: string;
  created_at: string;
}

/** Transporte por el que llegó una operación UCP al gateway. */
export type Transport = "mcp" | "rest" | "a2a" | "embedded";

/** Grupo UCP al que pertenece una operación. */
export type UCPCapabilityGroup = "catalog" | "checkout" | "order" | "wallet";

/**
 * Tools UCP soportadas (9 operaciones) — usadas como `operation` en
 * `usage_events` y como catálogo del playground del agente.
 */
export type UCPOperation =
  | "get_user_profile"
  | "search_catalog"
  | "lookup_catalog"
  | "get_product"
  | "create_checkout"
  | "get_checkout"
  | "update_checkout"
  | "complete_checkout"
  | "cancel_checkout"
  | "get_order";

export type UsageStatus = "ok" | "error" | "pending";

export interface UsageEvent {
  id: string;
  business_id: string;
  profile_id: string;
  api_key_id: string;
  checkout_session_id?: string;
  order_id?: string;
  request_id: string;
  transport: Transport;
  operation: UCPOperation;
  capability: UCPCapabilityGroup;
  product_ref?: string;
  /** Harness observado, si el agente lo envía (Claude Desktop, Cursor, …). */
  client_name?: string;
  status: UsageStatus;
  latency_ms: number;
  error_code?: string;
  is_purchase: boolean;
  revenue_minor?: number;
  occurred_at: string;
}

/** Vista agregada usada por el panel de comercio. Se calcula desde usage_events. */
export interface MerchantStats {
  queries_7d: number;
  purchases_generated: number;
  conversion_rate: number;
  revenue_7d_minor: number;
  currency: CurrencyCode;
  byDay: { day: string; queries: number; purchases: number }[];
}

// ---------------------------------------------------------------------------
// Payment authorizations (endpoint SDK del comercio → plataforma)
// ---------------------------------------------------------------------------

/**
 * Estado devuelto por `GET /v1/payment-authorizations/{id}` — proyección de
 * `payments.status` a los estados que consume el SDK del comercio.
 */
export type AuthorizationStatus =
  | "created"
  | "reserved"
  | "submitted"
  | "authorized"
  | "completed"
  | "released"
  | "failed";

// ---------------------------------------------------------------------------
// Personas (solo modo demo del frontend)
// ---------------------------------------------------------------------------

/**
 * Una "persona" es un usuario pre-armado que se puede usar en modo demo para
 * probar la app desde distintos roles sin backend. Está pensada solo para el
 * frontend; en Supabase real, cada `Profile` viene de auth.
 *
 * La persona referencia por id a las entidades del schema — `wallet_id` y
 * `business_id` son punteros a filas del mock; el resto se resuelve por
 * `profile_id`.
 */
export interface Persona {
  id: string;
  profile_id: string;
  display_name: string;
  short_name: string;
  role_label: string;
  account_type: AccountType;
  avatar_color: string;
  summary: string;
  password: string;
  /** Wallet propia del cliente (undefined para admins). */
  wallet_id?: string;
  /** Comercio que administra (solo cuando `account_type === "business"`). */
  business_id?: string;
  /** Tag rápido para la UI: "Nuevo", "Power user", "Sin saldo", etc. */
  badge?: string;
}
