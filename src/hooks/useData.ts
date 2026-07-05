import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import {
  connectClient,
  connectMerchant,
  linkMerchantUrl,
  registerMerchant,
  unlinkMerchantUrl,
} from "@/lib/api";
import type {
  ConnectMerchantResponse,
  LinkMerchantResponse,
  RegisterMerchantResponse,
  UnlinkMerchantResponse,
} from "@/lib/api";
import { MCP_KEY_STORAGE, SDK_INSTALL_PROMPT_STORAGE, SDK_KEY_STORAGE } from "@/lib/constants";
import { buildSdkInstallPrompt } from "@/lib/sdk-config";
import {
  mapApiKey,
  mapBusiness,
  mapCheckoutSession,
  mapMerchantDomain,
  mapOrder,
  mapPayment,
  mapProfile,
  mapUsageEvent,
  mapWallet,
} from "@/lib/mappers";
import { getSupabase } from "@/lib/supabase";
import type { ApiKey, MerchantStats, OrderRecord, UsageEvent, Wallet } from "@/types/ucp";

export const queryKeys = {
  profile: (id: string) => ["profile", id] as const,
  wallet: (id: string) => ["wallet", id] as const,
  businessWallet: (businessId: string) => ["businessWallet", businessId] as const,
  businessOrders: (businessId: string) => ["businessOrders", businessId] as const,
  clientOrders: (profileId: string) => ["clientOrders", profileId] as const,
  payments: (walletId: string) => ["payments", walletId] as const,
  usageEvents: (scope: string) => ["usageEvents", scope] as const,
  businesses: () => ["businesses"] as const,
  myBusinesses: (ownerId: string) => ["myBusinesses", ownerId] as const,
  apiKeys: (scope: string) => ["apiKeys", scope] as const,
  domains: (businessId: string) => ["domains", businessId] as const,
  checkoutSessions: (profileId: string) => ["checkoutSessions", profileId] as const,
};

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile(user?.id ?? ""),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapProfile(data, user!.email);
    },
  });
}

export function useWallet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.wallet(user?.id ?? ""),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("wallets")
        .select("*")
        .eq("profile_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapWallet(data) : null;
    },
  });
}

export function useBusinessWallet(businessId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.businessWallet(businessId ?? ""),
    enabled: Boolean(businessId),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("wallets")
        .select("*")
        .eq("business_id", businessId!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapWallet(data) : null;
    },
  });
}

export function useBusinessOrders(businessId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.businessOrders(businessId ?? ""),
    enabled: Boolean(businessId),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("orders")
        .select("*")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map(mapOrder);
    },
  });
}

export function useClientOrders(profileId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clientOrders(profileId ?? ""),
    enabled: Boolean(profileId),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("orders")
        .select("*")
        .eq("profile_id", profileId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map(mapOrder);
    },
  });
}

export function usePayments(walletId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.payments(walletId ?? ""),
    enabled: Boolean(walletId),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("payments")
        .select("*")
        .eq("wallet_id", walletId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapPayment);
    },
  });
}

export function useUsageEvents(scope?: {
  profileId?: string;
  businessIds?: string[];
  enabled?: boolean;
}) {
  const { user } = useAuth();
  const profileId = scope?.profileId ?? user?.id;
  const businessIds = scope?.businessIds ?? [];
  const scopeKey = businessIds.length
    ? `business:${businessIds.join(",")}`
    : `profile:${profileId ?? ""}`;
  const enabled =
    scope?.enabled ?? (businessIds.length > 0 || Boolean(profileId));
  return useQuery({
    queryKey: queryKeys.usageEvents(scopeKey),
    enabled,
    queryFn: async () => {
      const sb = getSupabase();
      let query = sb
        .from("usage_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (businessIds.length > 0) {
        query = query.in("business_id", businessIds);
      } else {
        query = query.eq("profile_id", profileId!);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapUsageEvent);
    },
  });
}

export function useActiveBusinesses() {
  return useQuery({
    queryKey: queryKeys.businesses(),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("businesses")
        .select("*")
        .eq("status", "active");
      if (error) throw error;
      return (data ?? []).map(mapBusiness);
    },
  });
}

export function useMyBusinesses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.myBusinesses(user?.id ?? ""),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("businesses")
        .select("*")
        .eq("owner_id", user!.id);
      if (error) throw error;
      return (data ?? []).map(mapBusiness);
    },
  });
}

export function useMerchantDomains(businessId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.domains(businessId ?? ""),
    enabled: Boolean(businessId),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("merchant_domains")
        .select("*")
        .eq("business_id", businessId!);
      if (error) throw error;
      return (data ?? []).map(mapMerchantDomain);
    },
  });
}

export function useApiKeys(scope?: {
  profileId?: string;
  businessIds?: string[];
  enabled?: boolean;
}) {
  const { user } = useAuth();
  const profileId = scope?.profileId ?? user?.id;
  const businessIds = scope?.businessIds ?? [];
  const scopeKey = businessIds.length
    ? `business:${businessIds.join(",")}`
    : `profile:${profileId ?? ""}`;
  const enabled =
    scope?.enabled ?? (businessIds.length > 0 || Boolean(profileId));
  return useQuery({
    queryKey: queryKeys.apiKeys(scopeKey),
    enabled,
    queryFn: async () => {
      const sb = getSupabase();
      let query = sb
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (businessIds.length > 0) {
        query = query.in("business_id", businessIds);
      } else {
        query = query.eq("profile_id", profileId!);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapApiKey);
    },
  });
}

export function useCheckoutSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.checkoutSessions(user?.id ?? ""),
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("checkout_sessions")
        .select("*")
        .eq("profile_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapCheckoutSession);
    },
  });
}

export function useBusinessMap() {
  const { data: active = [] } = useActiveBusinesses();
  const { data: mine = [] } = useMyBusinesses();
  const all = [...active];
  for (const b of mine) {
    if (!all.some((x) => x.id === b.id)) all.push(b);
  }
  const byId = new Map(all.map((b) => [b.id, b]));
  return { businesses: all, businessById: (id: string) => byId.get(id) };
}

const PAID_ORDER_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
]);

function withinLast7Days(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() <= 7 * 24 * 60 * 60 * 1000;
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { weekday: "short" });
}

export function computeMerchantStats(
  events: UsageEvent[],
  businessId: string,
  options?: { orders?: OrderRecord[]; wallet?: Wallet | null },
): MerchantStats {
  const now = Date.now();
  const mine = events.filter((e) => e.business_id === businessId);
  const recentEvents = mine.filter((e) => withinLast7Days(e.occurred_at));
  const businessOrders = (options?.orders ?? []).filter(
    (order) => order.business_id === businessId,
  );
  const paidOrders = businessOrders.filter((order) =>
    PAID_ORDER_STATUSES.has(order.status),
  );
  const recentOrders = paidOrders.filter((order) =>
    withinLast7Days(order.created_at),
  );

  const queries = recentEvents.filter(
    (event) => event.operation !== "complete_checkout" && !event.is_purchase,
  ).length;
  const purchases = recentOrders.length;
  const revenue = recentOrders.reduce(
    (sum, order) => sum + order.total_minor,
    0,
  );
  const revenueAllTime = paidOrders.reduce(
    (sum, order) => sum + order.total_minor,
    0,
  );
  const checkoutsStarted = recentEvents.filter(
    (event) => event.operation === "create_checkout",
  ).length;
  const conversion_rate =
    checkoutsStarted > 0
      ? purchases / checkoutsStarted
      : queries > 0
        ? purchases / queries
        : 0;
  const avg_order_minor_7d =
    purchases > 0 ? Math.round(revenue / purchases) : 0;

  const byDayMap = new Map<string, { queries: number; purchases: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    byDayMap.set(dayKey(d.toISOString()), { queries: 0, purchases: 0 });
  }
  for (const event of recentEvents) {
    if (event.operation === "complete_checkout" || event.is_purchase) continue;
    const entry = byDayMap.get(dayKey(event.occurred_at));
    if (entry) entry.queries++;
  }
  for (const order of recentOrders) {
    const entry = byDayMap.get(dayKey(order.created_at));
    if (entry) entry.purchases++;
  }

  return {
    queries_7d: queries,
    checkouts_started_7d: checkoutsStarted,
    purchases_generated: purchases,
    sales_all_time: paidOrders.length,
    conversion_rate,
    revenue_7d_minor: revenue,
    revenue_all_time_minor: revenueAllTime,
    avg_order_minor_7d,
    credited_balance_minor: options?.wallet?.available_minor ?? 0,
    currency: options?.wallet?.currency ?? recentOrders[0]?.currency ?? "USD",
    byDay: [...byDayMap.entries()].map(([day, value]) => ({ day, ...value })),
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (fields: { full_name?: string; country?: string }) => {
      const sb = getSupabase();
      const { error } = await sb
        .from("profiles")
        .update(fields)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
    },
  });
}

export function useUpdateBusiness() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      businessId,
      ...fields
    }: {
      businessId: string;
      category?: string;
      description?: string;
    }) => {
      const sb = getSupabase();
      const { error } = await sb
        .from("businesses")
        .update(fields)
        .eq("id", businessId)
        .eq("owner_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myBusinesses(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.businesses() });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string) => {
      const sb = getSupabase();
      const { error } = await sb
        .from("api_keys")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
}

export function useIssueApiKey() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => connectClient(),
    onSuccess: (result) => {
      const stored = JSON.parse(
        sessionStorage.getItem(MCP_KEY_STORAGE) ?? "{}",
      ) as Record<string, string>;
      stored[result.mcp_api_key_prefix] = result.mcp_api_key;
      sessionStorage.setItem(MCP_KEY_STORAGE, JSON.stringify(stored));
      qc.invalidateQueries({ queryKey: ["apiKeys"] });
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.wallet(user!.id) });
    },
  });
}

export function useBootstrapAccount() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body?: { full_name?: string; country?: string }) =>
      connectClient(body),
    onSuccess: (result) => {
      const stored = JSON.parse(
        sessionStorage.getItem(MCP_KEY_STORAGE) ?? "{}",
      ) as Record<string, string>;
      stored[result.mcp_api_key_prefix] = result.mcp_api_key;
      sessionStorage.setItem(MCP_KEY_STORAGE, JSON.stringify(stored));
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.wallet(user!.id) });
      qc.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
}

export function useRegisterMerchant() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      category?: string;
      root_url: string;
      ucp_inbound_api_key?: string;
    }): Promise<RegisterMerchantResponse> => registerMerchant(body),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.myBusinesses(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.businesses() });
      qc.invalidateQueries({ queryKey: ["apiKeys"] });
      qc.invalidateQueries({ queryKey: queryKeys.domains(result.business_id) });
    },
  });
}

export function useBootstrapMerchant() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body?: {
      full_name?: string;
      business_name?: string;
      category?: string;
      description?: string;
    }): Promise<ConnectMerchantResponse> => connectMerchant(body),
    onSuccess: (result) => {
      if (result.sdk_api_key && result.sdk_api_key_prefix) {
        storeSdkKey(result.sdk_api_key_prefix, result.sdk_api_key);
      }
      if (result.sdk_install_prompt) {
        sessionStorage.setItem(
          SDK_INSTALL_PROMPT_STORAGE,
          result.sdk_install_prompt,
        );
      } else if (result.sdk_api_key) {
        sessionStorage.setItem(
          SDK_INSTALL_PROMPT_STORAGE,
          buildSdkInstallPrompt(result.sdk_api_key),
        );
      }
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.myBusinesses(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.businesses() });
      qc.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
}

export function useLinkMerchant(businessId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body: {
      root_url: string;
      ucp_inbound_api_key?: string;
    }): Promise<LinkMerchantResponse> => {
      if (!businessId) throw new Error("Falta business_id para vincular URL");
      return linkMerchantUrl(businessId, body);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.myBusinesses(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.businesses() });
      qc.invalidateQueries({ queryKey: queryKeys.domains(result.business_id) });
    },
  });
}

export function useUnlinkMerchant(businessId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (): Promise<UnlinkMerchantResponse> => {
      if (!businessId) throw new Error("Falta business_id para desvincular URL");
      return unlinkMerchantUrl(businessId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.myBusinesses(user!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.businesses() });
      if (businessId) {
        qc.invalidateQueries({ queryKey: queryKeys.domains(businessId) });
      }
    },
  });
}

export function getStoredMcpKey(prefix: string): string | undefined {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(MCP_KEY_STORAGE) ?? "{}",
    ) as Record<string, string>;
    return stored[prefix];
  } catch {
    return undefined;
  }
}

/** Resolves plaintext for the active MCP key (prefix match, or single cached key). */
export function resolveStoredMcpKey(keyPrefix: string | null | undefined): string | undefined {
  if (!keyPrefix) return undefined;
  const direct = getStoredMcpKey(keyPrefix);
  if (direct) return direct;
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(MCP_KEY_STORAGE) ?? "{}",
    ) as Record<string, string>;
    const values = Object.values(stored).filter(Boolean);
    if (values.length === 1) return values[0];
  } catch {
    /* ignore */
  }
  return undefined;
}

export function storeMcpKey(prefix: string, key: string) {
  const stored = JSON.parse(
    sessionStorage.getItem(MCP_KEY_STORAGE) ?? "{}",
  ) as Record<string, string>;
  stored[prefix] = key;
  sessionStorage.setItem(MCP_KEY_STORAGE, JSON.stringify(stored));
}

export function getStoredSdkKey(prefix: string): string | undefined {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(SDK_KEY_STORAGE) ?? "{}",
    ) as Record<string, string>;
    return stored[prefix];
  } catch {
    return undefined;
  }
}

export function storeSdkKey(prefix: string, key: string) {
  const stored = JSON.parse(
    sessionStorage.getItem(SDK_KEY_STORAGE) ?? "{}",
  ) as Record<string, string>;
  stored[prefix] = key;
  sessionStorage.setItem(SDK_KEY_STORAGE, JSON.stringify(stored));
}

export function getStoredSdkInstallPrompt(): string | undefined {
  try {
    const stored = sessionStorage.getItem(SDK_INSTALL_PROMPT_STORAGE);
    return stored || undefined;
  } catch {
    return undefined;
  }
}

export function useMcpKeys(apiKeys: ApiKey[] | undefined) {
  const mcpKeys = (apiKeys ?? []).filter((k) => k.key_type === "mcp");
  return mcpKeys;
}
