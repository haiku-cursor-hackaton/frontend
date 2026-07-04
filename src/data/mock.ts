/**
 * Datos mock del frontend de genko.
 *
 * Alineados con el schema de la plataforma en `docs/db-schema.md`:
 * profiles, businesses, merchant_domains, api_keys, wallets,
 * checkout_sessions, orders, payments, usage_events.
 *
 * Todos los importes están en unidades menores. Cuando conectemos el
 * backend, esto se reemplaza por hooks contra `VITE_UCP_API_URL` /
 * Supabase manteniendo los mismos tipos.
 */

import type {
  ApiKey,
  Business,
  CheckoutSession,
  MerchantDomain,
  MerchantStats,
  OrderRecord,
  Payment,
  Product,
  Profile,
  UsageEvent,
  Wallet,
} from "@/types/ucp";

export const WELCOME_BONUS_MINOR = 1500; // $15.00

// ---------------------------------------------------------------------------
// Identidad
// ---------------------------------------------------------------------------

const CLIENT_PROFILE_ID = "profile_client_1";
const BUSINESS_OWNER_ID = "profile_business_1";

export const profiles: Profile[] = [
  {
    id: CLIENT_PROFILE_ID,
    account_type: "client",
    full_name: "Roderick López",
    email: "roderick@demo.genko.dev",
    country: "MX",
    created_at: "2026-07-01T09:00:00Z",
  },
  {
    id: BUSINESS_OWNER_ID,
    account_type: "business",
    full_name: "Ana Ríos",
    email: "ana@boutique-a.example",
    country: "MX",
    created_at: "2026-06-20T15:20:00Z",
  },
  {
    id: "profile_admin_1",
    account_type: "admin",
    full_name: "Admin",
    email: "admin@genko.dev",
    created_at: "2026-06-01T00:00:00Z",
  },
];

/** Perfil "activo" simulado en la UI mientras no haya auth real por rol. */
export const currentProfile = profiles[0];

// ---------------------------------------------------------------------------
// Comercios (UCP-compliant)
// ---------------------------------------------------------------------------

export const businesses: Business[] = [
  {
    id: "biz_boutique_a",
    owner_id: BUSINESS_OWNER_ID,
    name: "Boutique A",
    category: "Moda",
    status: "active",
    well_known_url: "https://boutique-a.example/.well-known/ucp",
    ucp_base_url: "https://boutique-a.example/ucp/v1",
    ucp_capabilities: [
      "dev.ucp.shopping.catalog.search",
      "dev.ucp.shopping.catalog.lookup",
      "dev.ucp.shopping.checkout",
      "dev.ucp.shopping.order",
    ],
    created_at: "2026-06-20T15:20:00Z",
  },
  {
    id: "biz_tiendax",
    owner_id: "profile_business_2",
    name: "TiendaX",
    category: "Electrónica",
    status: "active",
    well_known_url: "https://tiendax.example/.well-known/ucp",
    ucp_base_url: "https://tiendax.example/ucp/v1",
    ucp_capabilities: [
      "dev.ucp.shopping.catalog.search",
      "dev.ucp.shopping.catalog.lookup",
      "dev.ucp.shopping.checkout",
    ],
    created_at: "2026-06-25T10:00:00Z",
  },
  {
    id: "biz_gadgethub",
    owner_id: "profile_business_3",
    name: "GadgetHub",
    category: "Accesorios",
    status: "active",
    well_known_url: "https://gadgethub.example/.well-known/ucp",
    ucp_base_url: "https://gadgethub.example/ucp/v1",
    ucp_capabilities: [
      "dev.ucp.shopping.catalog.search",
      "dev.ucp.shopping.catalog.lookup",
      "dev.ucp.shopping.checkout",
      "dev.ucp.shopping.order",
    ],
    created_at: "2026-06-28T18:30:00Z",
  },
  {
    id: "biz_megashop",
    owner_id: "profile_business_4",
    name: "MegaShop",
    category: "Deportes",
    status: "pending",
    well_known_url: "https://megashop.example/.well-known/ucp",
    ucp_base_url: "https://megashop.example/ucp/v1",
    ucp_capabilities: [
      "dev.ucp.shopping.catalog.search",
      "dev.ucp.shopping.checkout",
    ],
    created_at: "2026-07-03T11:10:00Z",
  },
];

/** El comercio propio del usuario `business` de la demo. */
export const currentBusinessId = "biz_boutique_a";

export const merchantDomains: MerchantDomain[] = [
  {
    id: "dom_1",
    business_id: "biz_boutique_a",
    domain: "boutique-a.example",
    verified: true,
  },
  {
    id: "dom_2",
    business_id: "biz_boutique_a",
    domain: "shop.boutique-a.example",
    verified: false,
  },
  {
    id: "dom_3",
    business_id: "biz_tiendax",
    domain: "tiendax.example",
    verified: true,
  },
  {
    id: "dom_4",
    business_id: "biz_gadgethub",
    domain: "gadgethub.example",
    verified: true,
  },
];

// ---------------------------------------------------------------------------
// Productos (fuente = comercios; nosotros no guardamos catálogo)
// ---------------------------------------------------------------------------

export const products: Product[] = [
  {
    id: "product_123",
    title: "Running Shoe",
    description: "Zapato de entrenamiento ligero",
    price: 7500,
    currency: "USD",
    available: true,
    business_id: "biz_gadgethub",
    imageColor: "#7c9cff",
  },
  {
    id: "product_456",
    title: "Cargador USB-C 65W",
    description: "Carga rápida GaN, 2 puertos",
    price: 1200,
    currency: "USD",
    available: true,
    business_id: "biz_tiendax",
    imageColor: "#22c55e",
  },
  {
    id: "product_789",
    title: "Sneakers Pro",
    description: "Edición limitada, suela reactiva",
    price: 12900,
    currency: "USD",
    available: false,
    business_id: "biz_megashop",
    imageColor: "#f59e0b",
  },
  {
    id: "product_321",
    title: "Botella térmica 1L",
    description: "Acero inoxidable, 24h frío",
    price: 890,
    currency: "USD",
    available: true,
    business_id: "biz_boutique_a",
    imageColor: "#ef4444",
  },
  {
    id: "product_654",
    title: "Chaqueta técnica",
    description: "Impermeable, membrana 3 capas",
    price: 8900,
    currency: "USD",
    available: true,
    business_id: "biz_boutique_a",
    imageColor: "#0ea5e9",
  },
];

// ---------------------------------------------------------------------------
// Wallet (saldo simulado en unidades menores)
// ---------------------------------------------------------------------------

export const wallets: Wallet[] = [
  {
    id: "wallet_1",
    profile_id: CLIENT_PROFILE_ID,
    available_minor: 8410,
    reserved_minor: 7500,
    currency: "USD",
  },
];

export const currentWallet = wallets[0];

// ---------------------------------------------------------------------------
// API keys (mcp para el cliente, sdk para el comercio)
// ---------------------------------------------------------------------------

export const apiKeys: ApiKey[] = [
  {
    id: "key_mcp_1",
    key_type: "mcp",
    profile_id: CLIENT_PROFILE_ID,
    label: "MCP · Claude Desktop",
    key_prefix: "mcp_live_9f2c",
    scopes: [
      "catalog:read",
      "checkout:write",
      "purchase:execute",
      "order:read",
      "wallet:read",
    ],
    status: "active",
    created_at: "2026-07-01T09:00:00Z",
  },
  {
    id: "key_mcp_2",
    key_type: "mcp",
    profile_id: CLIENT_PROFILE_ID,
    label: "MCP · Cursor (solo consulta)",
    key_prefix: "mcp_live_3a11",
    scopes: ["catalog:read", "order:read"],
    status: "active",
    created_at: "2026-07-02T18:20:00Z",
  },
  {
    id: "key_mcp_3",
    key_type: "mcp",
    profile_id: CLIENT_PROFILE_ID,
    label: "MCP · sandbox",
    key_prefix: "mcp_test_71bd",
    scopes: ["catalog:read"],
    status: "revoked",
    created_at: "2026-06-15T12:00:00Z",
    revoked_at: "2026-06-30T22:00:00Z",
  },
  {
    id: "key_sdk_1",
    key_type: "sdk",
    business_id: "biz_boutique_a",
    label: "SDK · producción",
    key_prefix: "sdk_live_5c1b",
    scopes: ["catalog:read", "checkout:write", "order:read"],
    status: "active",
    created_at: "2026-06-20T15:25:00Z",
  },
];

// ---------------------------------------------------------------------------
// Checkout sessions (referencia local a un checkout UCP externo)
// ---------------------------------------------------------------------------

export const checkoutSessions: CheckoutSession[] = [
  {
    id: "cs_1",
    business_id: "biz_tiendax",
    profile_id: CLIENT_PROFILE_ID,
    external_checkout_id: "checkout_123",
    status: "completed",
    total_minor: 1356,
    currency: "USD",
    expires_at: "2026-07-04T22:00:00Z",
    created_at: "2026-07-04T09:58:00Z",
    snapshot: {
      id: "checkout_123",
      status: "completed",
      currency: "USD",
      line_items: [
        {
          id: "line_1",
          item: {
            id: "product_456",
            title: "Cargador USB-C 65W",
            price: 1200,
          },
          quantity: 1,
        },
      ],
      buyer: { email: "roderick@demo.genko.dev" },
      totals: [
        { type: "subtotal", amount: 1200 },
        { type: "tax", amount: 156 },
        { type: "total", amount: 1356 },
      ],
      order: {
        id: "order_789",
        label: "Order #1007",
        permalink_url: "https://tiendax.example/orders/order_789",
      },
    },
  },
  {
    id: "cs_2",
    business_id: "biz_gadgethub",
    profile_id: CLIENT_PROFILE_ID,
    external_checkout_id: "checkout_555",
    status: "ready_for_complete",
    total_minor: 9040,
    currency: "USD",
    expires_at: "2026-07-04T22:00:00Z",
    created_at: "2026-07-03T12:10:00Z",
    snapshot: {
      id: "checkout_555",
      status: "ready_for_complete",
      currency: "USD",
      line_items: [
        {
          id: "line_1",
          item: {
            id: "product_123",
            title: "Running Shoe",
            price: 7500,
          },
          quantity: 1,
        },
      ],
      totals: [
        { type: "subtotal", amount: 7500 },
        { type: "shipping", amount: 500 },
        { type: "tax", amount: 1040 },
        { type: "total", amount: 9040 },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Órdenes locales (referencia a la orden real en el comercio)
// ---------------------------------------------------------------------------

export const orders: OrderRecord[] = [
  {
    id: "ord_1",
    checkout_session_id: "cs_1",
    business_id: "biz_tiendax",
    profile_id: CLIENT_PROFILE_ID,
    external_order_id: "order_789",
    status: "processing",
    total_minor: 1356,
    currency: "USD",
    permalink_url: "https://tiendax.example/orders/order_789",
    fulfillment: {
      expectations: [{ type: "delivery", estimated_delivery: "2026-07-08" }],
      events: [
        { type: "confirmed", occurred_at: "2026-07-04T10:20:00Z" },
        { type: "processing", occurred_at: "2026-07-04T11:05:00Z" },
      ],
    },
    snapshot: {
      line_items: [
        {
          id: "line_1",
          item: {
            id: "product_456",
            title: "Cargador USB-C 65W",
            price: 1200,
          },
          quantity: 1,
        },
      ],
      totals: [
        { type: "subtotal", amount: 1200 },
        { type: "tax", amount: 156 },
        { type: "total", amount: 1356 },
      ],
    },
    created_at: "2026-07-04T10:20:00Z",
  },
  {
    id: "ord_2",
    checkout_session_id: "cs_prior_2",
    business_id: "biz_boutique_a",
    profile_id: CLIENT_PROFILE_ID,
    external_order_id: "order_664",
    status: "delivered",
    total_minor: 890,
    currency: "USD",
    permalink_url: "https://boutique-a.example/orders/order_664",
    fulfillment: {
      events: [
        { type: "confirmed", occurred_at: "2026-07-03T18:44:00Z" },
        { type: "processing", occurred_at: "2026-07-03T19:20:00Z" },
        { type: "shipped", occurred_at: "2026-07-03T22:00:00Z" },
        { type: "delivered", occurred_at: "2026-07-04T13:00:00Z" },
      ],
    },
    snapshot: {
      line_items: [
        {
          id: "line_1",
          item: {
            id: "product_321",
            title: "Botella térmica 1L",
            price: 890,
          },
          quantity: 1,
        },
      ],
      totals: [{ type: "total", amount: 890 }],
    },
    created_at: "2026-07-03T18:44:00Z",
  },
];

// ---------------------------------------------------------------------------
// Payments (reserva/captura/liberación en la wallet simulada)
// ---------------------------------------------------------------------------

export const payments: Payment[] = [
  {
    id: "pay_bonus_welcome",
    checkout_session_id: "cs_bonus",
    wallet_id: "wallet_1",
    amount_minor: WELCOME_BONUS_MINOR,
    currency: "USD",
    status: "captured",
    handler_id: "dev.platform.welcome_bonus",
    created_at: "2026-07-01T09:00:00Z",
  },
  {
    id: "pay_2",
    checkout_session_id: "cs_prior_2",
    order_id: "ord_2",
    wallet_id: "wallet_1",
    amount_minor: 890,
    currency: "USD",
    status: "captured",
    handler_id: "dev.platform.simulated_balance",
    created_at: "2026-07-03T18:44:00Z",
  },
  {
    id: "pay_3",
    checkout_session_id: "cs_1",
    order_id: "ord_1",
    wallet_id: "wallet_1",
    amount_minor: 1356,
    currency: "USD",
    status: "captured",
    handler_id: "dev.platform.simulated_balance",
    created_at: "2026-07-04T10:20:00Z",
  },
  {
    id: "pay_4",
    checkout_session_id: "cs_2",
    wallet_id: "wallet_1",
    amount_minor: 7500,
    currency: "USD",
    status: "reserved",
    handler_id: "dev.platform.simulated_balance",
    created_at: "2026-07-04T14:12:00Z",
  },
];

// ---------------------------------------------------------------------------
// Usage events (métricas del gateway; una fila por tool MCP invocada)
// ---------------------------------------------------------------------------

export const usageEvents: UsageEvent[] = [
  {
    id: "ue_1",
    business_id: "biz_tiendax",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    checkout_session_id: "cs_1",
    order_id: "ord_1",
    request_id: "req_9f2a01",
    transport: "mcp",
    operation: "complete_checkout",
    capability: "checkout",
    product_ref: "product_456",
    client_name: "Claude Desktop",
    status: "ok",
    latency_ms: 412,
    is_purchase: true,
    revenue_minor: 1356,
    occurred_at: "2026-07-04T10:20:00Z",
  },
  {
    id: "ue_2",
    business_id: "biz_megashop",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    request_id: "req_9f2a02",
    transport: "mcp",
    operation: "search_catalog",
    capability: "catalog",
    client_name: "Claude Desktop",
    status: "ok",
    latency_ms: 189,
    is_purchase: false,
    occurred_at: "2026-07-04T09:02:00Z",
  },
  {
    id: "ue_3",
    business_id: "biz_boutique_a",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    checkout_session_id: "cs_prior_2",
    order_id: "ord_2",
    request_id: "req_9f2a03",
    transport: "rest",
    operation: "complete_checkout",
    capability: "checkout",
    product_ref: "product_321",
    client_name: "Claude Desktop",
    status: "ok",
    latency_ms: 508,
    is_purchase: true,
    revenue_minor: 890,
    occurred_at: "2026-07-03T18:44:00Z",
  },
  {
    id: "ue_4",
    business_id: "biz_gadgethub",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    checkout_session_id: "cs_2",
    request_id: "req_9f2a04",
    transport: "mcp",
    operation: "create_checkout",
    capability: "checkout",
    product_ref: "product_123",
    client_name: "Codex CLI",
    status: "pending",
    latency_ms: 372,
    is_purchase: false,
    occurred_at: "2026-07-03T12:10:00Z",
  },
  {
    id: "ue_5",
    business_id: "biz_megashop",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_2",
    request_id: "req_9f2a05",
    transport: "mcp",
    operation: "get_product",
    capability: "catalog",
    product_ref: "product_789",
    client_name: "Cursor",
    status: "ok",
    latency_ms: 132,
    is_purchase: false,
    occurred_at: "2026-07-02T08:31:00Z",
  },
  {
    id: "ue_6",
    business_id: "biz_boutique_a",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    request_id: "req_9f2a06",
    transport: "mcp",
    operation: "lookup_catalog",
    capability: "catalog",
    client_name: "Claude Desktop",
    status: "ok",
    latency_ms: 148,
    is_purchase: false,
    occurred_at: "2026-07-02T09:11:00Z",
  },
  {
    id: "ue_7",
    business_id: "biz_gadgethub",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    request_id: "req_9f2a07",
    transport: "mcp",
    operation: "get_order",
    capability: "order",
    order_id: "ord_1",
    client_name: "Gemini CLI",
    status: "ok",
    latency_ms: 96,
    is_purchase: false,
    occurred_at: "2026-07-04T13:05:00Z",
  },
  {
    id: "ue_8",
    business_id: "biz_megashop",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_2",
    request_id: "req_9f2a08",
    transport: "mcp",
    operation: "get_product",
    capability: "catalog",
    product_ref: "product_789",
    client_name: "Cursor",
    status: "error",
    latency_ms: 42,
    error_code: "out_of_stock",
    is_purchase: false,
    occurred_at: "2026-07-01T20:12:00Z",
  },
  {
    id: "ue_9",
    business_id: "biz_boutique_a",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    checkout_session_id: "cs_boutique_lost",
    request_id: "req_9f2a09",
    transport: "mcp",
    operation: "cancel_checkout",
    capability: "checkout",
    client_name: "Claude Desktop",
    status: "ok",
    latency_ms: 78,
    is_purchase: false,
    occurred_at: "2026-06-30T22:44:00Z",
  },
  {
    id: "ue_10",
    business_id: "biz_boutique_a",
    profile_id: CLIENT_PROFILE_ID,
    api_key_id: "key_mcp_1",
    request_id: "req_9f2a10",
    transport: "mcp",
    operation: "search_catalog",
    capability: "catalog",
    client_name: "Claude Desktop",
    status: "ok",
    latency_ms: 210,
    is_purchase: false,
    occurred_at: "2026-06-30T21:50:00Z",
  },
];

// ---------------------------------------------------------------------------
// Stats agregadas por comercio (derivadas de usage_events en un backend real)
// ---------------------------------------------------------------------------

export const merchantStats: MerchantStats = {
  queries_7d: 128,
  purchases_generated: 9,
  conversion_rate: 0.07,
  revenue_7d_minor: 12480,
  currency: "USD",
  byDay: [
    { day: "Lun", queries: 24, purchases: 2 },
    { day: "Mar", queries: 30, purchases: 4 },
    { day: "Mié", queries: 18, purchases: 1 },
    { day: "Jue", queries: 40, purchases: 5 },
    { day: "Vie", queries: 35, purchases: 3 },
    { day: "Sáb", queries: 22, purchases: 2 },
    { day: "Dom", queries: 28, purchases: 3 },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function businessById(id: string): Business | undefined {
  return businesses.find((b) => b.id === id);
}

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function productsForBusiness(businessId: string): Product[] {
  return products.filter((p) => p.business_id === businessId);
}
