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

function apiKeyPlaceholder(apiKey: string): string {
  return apiKey || MASKED_KEY_FALLBACK;
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

function buildEnvVars(apiKey: string) {
  return {
    [MCP_API_KEY_ENV_VAR]: apiKeyPlaceholder(apiKey),
  };
}

function buildCodexToml(mcpUrl: string): string {
  return [
    `[mcp_servers.${MCP_SERVER_NAME}]`,
    `url = "${mcpUrl}"`,
  ].join("\n");
}

export function buildAgentConfigBlocks(
  agent: McpAgent,
  apiKey: string,
  mcpUrl: string = getMcpGatewayUrl(),
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
          value: JSON.stringify(buildEnvVars(apiKey), null, 2),
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
          value: JSON.stringify(buildEnvVars(apiKey), null, 2),
        },
      ];
    case "codex":
      return [
        { title: "config.toml", value: buildCodexToml(mcpUrl) },
        {
          title: "Entorno",
          value: JSON.stringify(buildEnvVars(apiKey), null, 2),
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
): string {
  const keyForBuild = revealSecrets ? apiKey : maskApiKey(apiKey);
  const blocks = buildAgentConfigBlocks(agent, keyForBuild, mcpUrl);
  if (blocks.length === 0) return "";
  if (blocks.length === 1) return blocks[0].value;
  return blocks.map((block) => block.value).join("\n\n");
}

// Compat helpers used elsewhere
export function buildMcpServerConfigEnvVar(mcpUrl: string = getMcpGatewayUrl()) {
  return buildHttpTypeConfig(mcpUrl);
}

export function buildMcpEnvVars(apiKey: string) {
  return buildEnvVars(apiKey);
}
