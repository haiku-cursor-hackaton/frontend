import type { AccountType } from "@/types/ucp";

export function formatUserDisplayName(
  name: string | undefined | null,
  email?: string,
): string {
  const raw = name?.trim() || email?.split("@")[0] || "Usuario";
  const cleaned = raw.replace(/^\[DEMO\]\s*/i, "").trim();
  return cleaned || raw;
}

export function userAvatarInitial(displayName: string): string {
  const match = displayName.match(/[A-Za-zÀ-ÿ0-9]/);
  return (match?.[0] ?? "U").toUpperCase();
}

/** Owners of registered businesses always use the merchant experience. */
export function resolveAccountType(
  profile: { account_type?: AccountType } | null | undefined,
  myBusinesses: readonly { id: string }[],
  fallback: AccountType = "client",
): AccountType {
  if (myBusinesses.length > 0) return "business";
  return profile?.account_type ?? fallback;
}
