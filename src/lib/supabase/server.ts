import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/** Connexion Supabase côté serveur : à recréer pour chaque requête. */
export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component : les cookies ne peuvent pas être
          // écrits ici, le proxy se charge de rafraîchir la session.
        }
      },
    },
  });
}
