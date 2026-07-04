import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  SectionTitle,
} from "@/components/ui";
import { apiKeys as mockApiKeys, currentProfile } from "@/data/mock";
import { formatDate } from "@/lib/money";
import type { ApiKey } from "@/types/ucp";

const SCOPE_HINT: Record<ApiKey["scopes"][number], string> = {
  "catalog:read": "leer catálogo de comercios",
  "checkout:write": "crear/actualizar checkouts",
  "purchase:execute": "completar la compra",
  "order:read": "consultar órdenes",
  "wallet:read": "leer saldo simulado",
};

export default function Perfil() {
  const mineOnly = useMemo(
    () =>
      mockApiKeys.filter(
        (k) => k.key_type === "mcp" && k.profile_id === currentProfile.id,
      ),
    [],
  );

  const [keys, setKeys] = useState<ApiKey[]>(mineOnly);

  function revoke(id: string) {
    setKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? { ...k, status: "revoked", revoked_at: new Date().toISOString() }
          : k,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Perfil y credenciales</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle hint="profiles">Datos de la cuenta</SectionTitle>
          <Card>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre completo">
                  <Input defaultValue={currentProfile.full_name} />
                </Field>
                <Field label="Email">
                  <Input readOnly defaultValue={currentProfile.email} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="País">
                  <Input defaultValue={currentProfile.country ?? ""} />
                </Field>
                <Field label="Tipo de cuenta">
                  <Input readOnly defaultValue={currentProfile.account_type} />
                </Field>
              </div>
              <Field label="Dirección de facturación">
                <Input placeholder="Calle, ciudad, país" />
              </Field>
              <div className="flex justify-end">
                <Button variant="primary">Guardar</Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <SectionTitle hint="Bearer que usa tu agente en /ucp/mcp">
            Nueva API key MCP
          </SectionTitle>
          <Card>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Field label="Etiqueta">
                <Input placeholder="ej. MCP · Claude Desktop" />
              </Field>
              <div>
                <span className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">
                  Scopes
                </span>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {(
                    [
                      "catalog:read",
                      "checkout:write",
                      "purchase:execute",
                      "order:read",
                      "wallet:read",
                    ] as ApiKey["scopes"][number][]
                  ).map((s) => (
                    <label
                      key={s}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-sm hover:border-[var(--color-border-strong)]"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={s !== "wallet:read"}
                        className="h-3.5 w-3.5 accent-[var(--color-brand-strong)]"
                      />
                      <code className="text-[var(--color-fg)]">{s}</code>
                      <span className="ml-auto text-[10px] text-[var(--color-subtle)]">
                        {SCOPE_HINT[s]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost">Reset</Button>
                <Button variant="primary">Emitir key</Button>
              </div>
              <p className="text-xs text-[var(--color-subtle)]">
                La key completa se muestra <strong>una sola vez</strong> al
                emitirla. Guardamos solo su hash y su prefijo.
              </p>
            </form>
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle hint="api_keys · profile_id = tú">
          Tus API keys MCP
        </SectionTitle>
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
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
              {keys.map((k) => (
                <tr
                  key={k.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <td className="px-5 py-3">{k.label}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)]">
                    {k.key_prefix}…
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
                        —
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
                    Aún no tienes API keys MCP.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
        <p className="mt-2 text-xs text-[var(--color-subtle)]">
          El gateway hashea la key completa y guarda solo{" "}
          <code>key_prefix</code> + <code>key_hash</code>. La UI nunca ve la key
          entera después de emitirla.
        </p>
      </div>
    </div>
  );
}
