import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured =
  Boolean(url && anonKey) &&
  !url!.includes("YOUR_PROJECT") &&
  !anonKey!.includes("YOUR_ANON_KEY");

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, anonKey!)
  : null;

export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) throw new Error("Supabase no está configurado");
  return supabase;
}
