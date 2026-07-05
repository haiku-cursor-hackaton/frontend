import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  MobileRecordList,
  Pagination,
  SectionTitle,
  TabPanel,
  Tabs,
} from "@/components/ui";
import {
  useApiKeys,
  useIssueApiKey,
  useProfile,
  useRevokeApiKey,
  useUpdateProfile,
} from "@/hooks/useData";
import { formatDate } from "@/lib/money";

type ProfileTab = "cuenta" | "credenciales";
const KEYS_PAGE_SIZE = 5;

export default function Perfil() {
  const { data: profile, isLoading } = useProfile();
  const { data: allKeys = [] } = useApiKeys();
  const updateProfile = useUpdateProfile();
  const issueKey = useIssueApiKey();
  const revokeKey = useRevokeApiKey();

  const [tab, setTab] = useState<ProfileTab>("cuenta");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [saved, setSaved] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [issuedMcpUrl, setIssuedMcpUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keysPage, setKeysPage] = useState(1);

  const keys = useMemo(
    () => allKeys.filter((k) => k.key_type === "mcp"),
    [allKeys],
  );
  const keysPageCount = Math.max(1, Math.ceil(keys.length / KEYS_PAGE_SIZE));
  const currentKeysPage = Math.min(keysPage, keysPageCount);
  const paginatedKeys = keys.slice(
    (currentKeysPage - 1) * KEYS_PAGE_SIZE,
    currentKeysPage * KEYS_PAGE_SIZE,
  );

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando perfil...
      </div>
    );
  }

  const displayName = fullName || profile?.full_name || "";
  const displayCountry = country || profile?.country || "";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await updateProfile.mutateAsync({
        full_name: displayName || undefined,
        country: displayCountry || undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function handleIssueKey(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIssuedKey(null);
    setIssuedMcpUrl(null);
    try {
      const result = await issueKey.mutateAsync();
      setIssuedKey(result.mcp_api_key);
      setIssuedMcpUrl(result.mcp_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al emitir key");
    }
  }

  async function revoke(id: string) {
    setError(null);
    try {
      await revokeKey.mutateAsync(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al revocar");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Perfil y credenciales</h1>
        <Tabs<ProfileTab>
          ariaLabel="Secciones de perfil"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "cuenta", label: "Cuenta" },
            { id: "credenciales", label: "Credenciales", meta: keys.length },
          ]}
        />
      </div>

      {error ? (
        <p className="shrink-0 text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}

      {tab === "cuenta" ? (
        <TabPanel key="cuenta" className="flex-1">
          <SectionTitle hint="profiles">Datos de la cuenta</SectionTitle>
          <Card>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nombre completo">
                  <Input
                    value={displayName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={profile?.full_name ?? ""}
                  />
                </Field>
                <Field label="Email">
                  <Input readOnly value={profile?.email ?? ""} />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Pais">
                  <Input
                    value={displayCountry}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={profile?.country ?? ""}
                  />
                </Field>
                <Field label="Tipo de cuenta">
                  <Input readOnly value={profile?.account_type ?? "client"} />
                </Field>
              </div>
              <div className="flex items-center justify-end gap-2">
                {saved ? (
                  <span className="text-xs text-[var(--color-accent)]">
                    Guardado
                  </span>
                ) : null}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Card>
        </TabPanel>
      ) : (
        <TabPanel key="credenciales" className="flex-1">
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div>
              <SectionTitle hint="Bearer para /mcp">
                Nueva API key MCP
              </SectionTitle>
              <Card>
                <form className="space-y-4" onSubmit={handleIssueKey}>
                  <p className="text-sm text-[var(--color-muted)]">
                    Emite una nueva key MCP para llamar al gateway de Genko. La
                    key completa se muestra una sola vez.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={issueKey.isPending}
                    >
                      {issueKey.isPending ? "Emitiendo..." : "Emitir key"}
                    </Button>
                  </div>
                  {issuedKey ? (
                    <div className="rounded-lg border border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] p-3">
                      <p className="mb-1 text-xs font-medium text-[var(--color-accent)]">
                        Copia esta key ahora; no se volvera a mostrar:
                      </p>
                      <code className="break-all text-xs">{issuedKey}</code>
                      {issuedMcpUrl ? (
                        <div className="mt-3 border-t border-[color-mix(in_srgb,var(--color-accent)_30%,transparent)] pt-3">
                          <p className="mb-1 text-xs font-medium text-[var(--color-muted)]">
                            MCP URL
                          </p>
                          <code className="break-all text-xs">{issuedMcpUrl}</code>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="text-xs text-[var(--color-subtle)]">
                    Guardamos solo el hash y el prefijo.
                  </p>
                </form>
              </Card>
            </div>

            <div className="min-w-0">
              <SectionTitle hint="api_keys - profile_id = tu">
                Tus API keys MCP
              </SectionTitle>
              <div className="md:hidden">
                <MobileRecordList
                  records={paginatedKeys.map((k) => ({
                    id: k.id,
                    title: k.label,
                    meta:
                      k.status === "active" ? (
                        <Badge tone="accent">Activa</Badge>
                      ) : (
                        <Badge tone="danger">Revocada</Badge>
                      ),
                    fields: [
                      { label: "Prefijo", value: `${k.key_prefix}...` },
                      { label: "Creada", value: formatDate(k.created_at) },
                      {
                        label: "Scopes",
                        value: (
                          <div className="flex flex-wrap gap-1">
                            {k.scopes.map((s) => (
                              <Badge key={s} tone="neutral">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        ),
                      },
                    ],
                    footer:
                      k.status === "active" ? (
                        <div className="flex justify-end">
                          <Button variant="ghost" onClick={() => revoke(k.id)}>
                            Revocar
                          </Button>
                        </div>
                      ) : null,
                  }))}
                  empty="Aun no tienes API keys MCP."
                />
                <Pagination
                  page={currentKeysPage}
                  pageSize={KEYS_PAGE_SIZE}
                  total={keys.length}
                  onPageChange={setKeysPage}
                  className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                />
              </div>
              <Card padded={false} className="hidden overflow-hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-subtle)]">
                        <th className="px-5 py-3 font-medium">Etiqueta</th>
                        <th className="px-5 py-3 font-medium">Prefijo</th>
                        <th className="px-5 py-3 font-medium">Scopes</th>
                        <th className="px-5 py-3 font-medium">Estado</th>
                        <th className="px-5 py-3 font-medium">Creada</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedKeys.map((k) => (
                        <tr
                          key={k.id}
                          className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-2)]/60"
                        >
                          <td className="px-5 py-3">{k.label}</td>
                          <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)]">
                            {k.key_prefix}...
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {k.scopes.map((s) => (
                                <Badge key={s} tone="neutral">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {k.status === "active" ? (
                              <Badge tone="accent">Activa</Badge>
                            ) : (
                              <Badge tone="danger">Revocada</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-[var(--color-muted)]">
                            {formatDate(k.created_at)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {k.status === "active" ? (
                              <Button variant="ghost" onClick={() => revoke(k.id)}>
                                Revocar
                              </Button>
                            ) : (
                              <span className="text-xs text-[var(--color-subtle)]">
                                -
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {keys.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-8 text-center text-sm text-[var(--color-subtle)]"
                          >
                            Aun no tienes API keys MCP.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={currentKeysPage}
                  pageSize={KEYS_PAGE_SIZE}
                  total={keys.length}
                  onPageChange={setKeysPage}
                />
              </Card>
            </div>
          </div>
        </TabPanel>
      )}
    </div>
  );
}
