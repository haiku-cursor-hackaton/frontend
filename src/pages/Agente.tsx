import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Button,
  Card,
  CodePre,
  Field,
  Page,
  Select,
  cx,
} from "@/components/ui";
import { resolveStoredMcpKey, useApiKeys } from "@/hooks/useData";
import {
  MCP_AGENTS,
  type McpAgent,
  buildAgentConfigDocument,
  getMcpGatewayUrl,
} from "@/lib/mcp-config";

export default function Agente() {
  const { data: apiKeys = [], isLoading } = useApiKeys();
  const mcpKey = useMemo(() => {
    const active = apiKeys.filter((k) => k.key_type === "mcp" && k.status === "active");
    if (active.length === 0) return null;
    return active.reduce((latest, key) =>
      new Date(key.created_at) >= new Date(latest.created_at) ? key : latest,
    );
  }, [apiKeys]);

  const [agent, setAgent] = useState<McpAgent>("cursor");
  const [revealSecrets, setRevealSecrets] = useState(false);
  const [apiKeyPlain, setApiKeyPlain] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const mcpUrl = getMcpGatewayUrl();
  const hasPlainKey = Boolean(apiKeyPlain);

  useEffect(() => {
    if (!mcpKey) {
      setApiKeyPlain("");
      return;
    }
    setApiKeyPlain(resolveStoredMcpKey(mcpKey.key_prefix) ?? "");
  }, [mcpKey?.id, mcpKey?.key_prefix]);

  const configDocument = useMemo(
    () =>
      buildAgentConfigDocument(
        agent,
        apiKeyPlain,
        revealSecrets,
        mcpUrl,
        mcpKey?.key_prefix,
      ),
    [agent, apiKeyPlain, revealSecrets, mcpUrl, mcpKey?.key_prefix],
  );

  const copyDocument = useMemo(
    () =>
      buildAgentConfigDocument(
        agent,
        apiKeyPlain,
        true,
        mcpUrl,
        mcpKey?.key_prefix,
      ),
    [agent, apiKeyPlain, mcpUrl, mcpKey?.key_prefix],
  );

  async function copyConfig() {
    if (!hasPlainKey) return;
    try {
      await navigator.clipboard.writeText(copyDocument);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando...
      </div>
    );
  }

  return (
    <Page>
      <h1 className="shrink-0 text-lg font-semibold">Configuracion MCP</h1>

      <Card className="space-y-4 sm:space-y-5">
        <Field label="Agente">
          <Select
            value={agent}
            onChange={(e) => setAgent(e.target.value as McpAgent)}
          >
            {MCP_AGENTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={revealSecrets ? "Ocultar keys" : "Mostrar keys"}
              title={revealSecrets ? "Ocultar keys" : "Mostrar keys"}
              onClick={() => setRevealSecrets((v) => !v)}
              className={cx(
                "grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-fg)_15%,transparent)]",
                revealSecrets && "bg-[var(--color-surface-2)] text-[var(--color-fg)]",
              )}
            >
              {revealSecrets ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
            <Button
              variant="ghost"
              onClick={copyConfig}
              className="min-h-10 flex-1 sm:flex-none"
              disabled={!hasPlainKey}
            >
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <CodePre>{configDocument}</CodePre>
        </div>
      </Card>
    </Page>
  );
}
