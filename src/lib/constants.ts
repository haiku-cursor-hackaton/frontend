import type { UCPCapabilityGroup, UCPOperation } from "@/types/ucp";

/** Bono de bienvenida en unidades menores ($15.00). */
export const WELCOME_BONUS_MINOR = 1500;

/** sessionStorage key for MCP API key plaintext (shown once on issue). */
export const MCP_KEY_STORAGE = "genko.mcpKeys";

/** sessionStorage key for SDK API key plaintext (shown once on issue). */
export const SDK_KEY_STORAGE = "genko.sdkKeys";

/** sessionStorage key for SDK install prompt from bootstrap. */
export const SDK_INSTALL_PROMPT_STORAGE = "genko.sdkInstallPrompt";

/** Etiquetas legibles para las operaciones publicas del gateway MCP. */
export const OPERATION_LABEL: Record<UCPOperation, string> = {
  get_user_profile: "Perfil y wallet",
  search_catalog: "Búsqueda de catálogo",
  lookup_catalog: "Lookup de catálogo",
  get_product: "Consulta de producto",
  create_checkout: "Crear checkout",
  get_checkout: "Consulta de checkout",
  update_checkout: "Actualizar checkout",
  complete_checkout: "Completar compra",
  cancel_checkout: "Cancelar checkout",
  get_order: "Consulta de orden",
};

export const CAPABILITY_LABEL: Record<UCPCapabilityGroup, string> = {
  catalog: "Catálogo",
  checkout: "Checkout",
  order: "Orden",
  wallet: "Wallet",
};
