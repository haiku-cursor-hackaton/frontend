export const OFFICIAL_MCP_GATEWAY_URL =
  "https://genko-platform-production.up.railway.app/mcp";
export const MCP_API_KEY_ENV_VAR = "GENKO_MCP_API_KEY";
const MCP_SERVER_NAME = "genko";

export type McpAgent = "cursor" | "claude-desktop" | "claude-code" | "codex";

export const MCP_AGENTS: { id: McpAgent; label: string }[] = [
  { id: "cursor", label: "Cursor" },
  { id: "claude-desktop", label: "Claude Desktop" },
  { id: "claude-code", label: "Claude Code" },
  { id: "codex", label: "Codex" },
];

export function getMcpGatewayUrl(): string {
  const explicit = import.meta.env.VITE_MCP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  return OFFICIAL_MCP_GATEWAY_URL;
}

const MASKED_KEY_FALLBACK = "••••••••••••••••";

function maskApiKey(apiKey: string): string {
  const length = apiKey ? apiKey.length : MASKED_KEY_FALLBACK.length;
  return "•".repeat(length);
}

/** Cursor / Claude Code: ~/.cursor/mcp.json, ~/.claude/settings.json */
function buildHttpTypeConfig(mcpUrl: string) {
  return {
    mcpServers: {
      [MCP_SERVER_NAME]: {
        type: "http",
        url: mcpUrl,
      },
    },
  };
}

/** Claude Desktop: claude_desktop_config.json — solo url, sin `type` */
function buildClaudeDesktopConfig(mcpUrl: string) {
  return {
    mcpServers: {
      [MCP_SERVER_NAME]: {
        url: mcpUrl,
      },
    },
  };
}

function maskedKeyWithoutPlaintext(keyPrefix?: string): string {
  if (keyPrefix) return `${keyPrefix}${"•".repeat(28)}`;
  return maskApiKey("");
}

function buildEnvVars(apiKey: string, keyPrefix?: string, reveal = false) {
  let value: string;
  if (apiKey) {
    value = reveal ? apiKey : maskApiKey(apiKey);
  } else {
    value = maskedKeyWithoutPlaintext(keyPrefix);
  }
  return {
    [MCP_API_KEY_ENV_VAR]: value,
  };
}

function buildCodexToml(mcpUrl: string): string {
  return [
    `[mcp_servers.${MCP_SERVER_NAME}]`,
    `url = "${mcpUrl}"`,
    `bearer_token_env_var = "${MCP_API_KEY_ENV_VAR}"`,
  ].join("\n");
}

function buildCodexEnvInstructions(
  apiKey: string,
  keyPrefix?: string,
  reveal = false,
): string {
  let key: string;
  if (apiKey) {
    key = reveal ? apiKey : maskApiKey(apiKey);
  } else {
    key = maskedKeyWithoutPlaintext(keyPrefix);
  }
  return [
    "# Codex (HTTP): NO uses [mcp_servers.genko.env] en config.toml.",
    "# bearer_token_env_var lee la API key del entorno del sistema operativo.",
    "",
    "# Windows — variable de usuario (recomendado):",
    "# Panel de control → Variables de entorno → Nueva (usuario)",
    `# Nombre: ${MCP_API_KEY_ENV_VAR}`,
    `# Valor: ${key}`,
    "",
    "# PowerShell — solo esta sesión (ejecutar antes de abrir Codex):",
    `$env:${MCP_API_KEY_ENV_VAR} = "${key}"`,
    "",
    "# macOS / Linux:",
    `# export ${MCP_API_KEY_ENV_VAR}="${key}"`,
    "",
    "# Cierra y vuelve a abrir Codex después de definir la variable.",
  ].join("\n");
}

export function buildAgentConfigBlocks(
  agent: McpAgent,
  apiKey: string,
  mcpUrl: string = getMcpGatewayUrl(),
  keyPrefix?: string,
  reveal = false,
): McpConfigBlock[] {
  switch (agent) {
    case "cursor":
    case "claude-code":
      return [
        {
          title: "mcpServers",
          value: JSON.stringify(buildHttpTypeConfig(mcpUrl), null, 2),
        },
        {
          title: "Entorno",
          value: JSON.stringify(buildEnvVars(apiKey, keyPrefix, reveal), null, 2),
        },
      ];
    case "claude-desktop":
      return [
        {
          title: "mcpServers",
          value: JSON.stringify(buildClaudeDesktopConfig(mcpUrl), null, 2),
        },
        {
          title: "Entorno",
          value: JSON.stringify(buildEnvVars(apiKey, keyPrefix, reveal), null, 2),
        },
      ];
    case "codex":
      return [
        { title: "config.toml", value: buildCodexToml(mcpUrl) },
        {
          title: "Entorno (sistema operativo)",
          value: buildCodexEnvInstructions(apiKey, keyPrefix, reveal),
        },
      ];
    default:
      return [];
  }
}

export type McpConfigBlock = { title: string; value: string };

export function buildAgentConfigDocument(
  agent: McpAgent,
  apiKey: string,
  revealSecrets: boolean,
  mcpUrl: string = getMcpGatewayUrl(),
  keyPrefix?: string,
): string {
  const blocks = buildAgentConfigBlocks(
    agent,
    apiKey,
    mcpUrl,
    keyPrefix,
    revealSecrets,
  );
  if (blocks.length === 0) return "";
  if (blocks.length === 1) return blocks[0].value;
  return blocks
    .map((block) => `# ${block.title}\n${block.value}`)
    .join("\n\n");
}

// Compat helpers used elsewhere
export function buildMcpServerConfigEnvVar(mcpUrl: string = getMcpGatewayUrl()) {
  return buildHttpTypeConfig(mcpUrl);
}

export function buildMcpEnvVars(apiKey: string) {
  return buildEnvVars(apiKey);
}
