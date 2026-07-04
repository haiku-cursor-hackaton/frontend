import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * `true` cuando hay credenciales reales de Supabase. Si no, la app corre en
 * modo demo (login simulado) para poder trabajar sin backend configurado.
 */
export const isSupabaseConfigured =
  Boolean(url && anonKey) &&
  !url!.includes("YOUR_PROJECT") &&
  !anonKey!.includes("YOUR_ANON_KEY");

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;
