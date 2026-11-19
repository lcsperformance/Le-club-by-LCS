import "server-only";
import { createClient } from "@supabase/supabase-js";
import { configAbonnement } from "@/lib/abonnement/config";
import { getSupabaseEnv } from "./env";

/**
 * Connexion Supabase avec la clé SECRÈTE : contourne la sécurité par ligne.
 * Réservée au serveur, pour les traitements sans membre connecté (webhook Stripe).
 * Ne jamais l'utiliser pour répondre à une demande d'un membre.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  return createClient(url, configAbonnement.cleSupabaseSecrete(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
