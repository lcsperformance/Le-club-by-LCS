import "server-only";
import { createClient } from "@supabase/supabase-js";
import { configAbonnement } from "@/lib/abonnement/config";
import { getSupabaseEnv } from "./env";

/**
 * Connexion Supabase avec la clé SECRÈTE : contourne la sécurité par ligne.
 * Réservée au serveur : traitements sans membre connecté (webhook Stripe, notifications, tâche du soir),
 * suppression d'un compte, et lecture du programme (src/lib/programme-serveur.ts, qui ne renvoie que
 * la semaine ou la séance autorisée). Ne jamais renvoyer à un membre ce qu'elle lit sans ce filtre.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  return createClient(url, configAbonnement.cleSupabaseSecrete(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
