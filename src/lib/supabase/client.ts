import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Connexion Supabase côté navigateur (composants client). */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}
