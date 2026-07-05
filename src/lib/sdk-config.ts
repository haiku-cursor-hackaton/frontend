const API_BASE = (import.meta.env.VITE_UCP_API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

const MASKED_KEY_FALLBACK = "••••••••••••••••";

export const PYTHON_SDK_REPO =
  "https://github.com/haiku-cursor-hackaton/python-sdk.git";

export const AGENT_INTEGRATION_DOC_URL =
  "https://raw.githubusercontent.com/haiku-cursor-hackaton/python-sdk/main/docs/AGENT_INTEGRATION.md";

export function maskSecret(value: string): string {
  const length = value ? value.length : MASKED_KEY_FALLBACK.length;
  return "•".repeat(length);
}

export function buildSdkInstallPrompt(sdkApiKey: string): string {
  return `Genko SDK — coding agent prompt

Paste into a coding agent (Claude Code, Codex, or Cursor):

Ensure Python 3.10+ and FastAPI are in this project.

Install Genko Skills:
git clone --depth 1 ${PYTHON_SDK_REPO} .genko-sdk && mkdir -p .cursor/skills && cp -r .genko-sdk/.cursor/skills/wire-genko-sdk .cursor/skills/

Then read ${AGENT_INTEGRATION_DOC_URL} and wire UCP into this store.

# Credenciales Genko (.env del comercio)
UCP_PLATFORM_URL=${API_BASE}
UCP_PLATFORM_API_KEY=${sdkApiKey}
`;
}

export function displaySdkInstallPrompt(
  prompt: string,
  sdkApiKey: string | undefined,
  reveal: boolean,
): string {
  if (reveal || !sdkApiKey) return prompt;
  return prompt.replaceAll(sdkApiKey, maskSecret(sdkApiKey));
}
