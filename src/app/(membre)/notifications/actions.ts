"use server";

import { utilisateurConnecte } from "@/lib/auth";
import { lireAppareil } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export type ResultatNotifications = { erreur?: string };

const SESSION = "Ta session a expiré. Reconnecte-toi.";
const IMPOSSIBLE = "Impossible pour le moment. Réessaie dans un instant.";

/** Enregistre cet appareil pour recevoir les notifications (après l'accord du membre). */
export async function enregistrerAppareil(abonnement: unknown): Promise<ResultatNotifications> {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: SESSION };
  const appareil = lireAppareil(abonnement);
  if (!appareil) return { erreur: "Cet appareil ne peut pas recevoir de notifications." };
  const supabase = await createClient();
  // Déjà enregistré pour ce membre (clés renouvelées) : on remplace. La sécurité par ligne ne retire que les siens.
  await supabase.from("appareils_notifications").delete().eq("endpoint", appareil.endpoint);
  const { error } = await supabase.from("appareils_notifications").insert({ membre_id: u.id, ...appareil });
  if (error && error.code !== "23505") {
    console.error("Enregistrement de l'appareil impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return {};
}

/** Retire cet appareil (« Désactiver sur cet appareil »). */
export async function retirerAppareil(endpoint: unknown): Promise<ResultatNotifications> {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: SESSION };
  if (typeof endpoint !== "string" || endpoint.length > 1000) return {};
  const supabase = await createClient();
  const { error } = await supabase.from("appareils_notifications").delete().eq("membre_id", u.id).eq("endpoint", endpoint);
  if (error) {
    console.error("Retrait de l'appareil impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return {};
}

/** Cet appareil est-il enregistré pour le membre connecté ? */
export async function appareilEnregistre(endpoint: unknown): Promise<boolean> {
  const u = await utilisateurConnecte();
  if (!u || typeof endpoint !== "string") return false;
  const supabase = await createClient();
  const { data } = await supabase.from("appareils_notifications").select("id").eq("membre_id", u.id).eq("endpoint", endpoint).maybeSingle();
  return !!data;
}

/** Réglage du Profil : annonces ou rappels FAQ, oui ou non. */
export async function enregistrerReglage(champ: unknown, valeur: unknown): Promise<ResultatNotifications> {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: SESSION };
  if ((champ !== "notif_annonces" && champ !== "notif_faq") || typeof valeur !== "boolean") return { erreur: "Ce réglage n'existe pas." };
  const supabase = await createClient();
  const { error } = await supabase.from("membres").update({ [champ]: valeur }).eq("id", u.id);
  if (error) {
    console.error("Enregistrement du réglage impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return {};
}
