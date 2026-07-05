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
