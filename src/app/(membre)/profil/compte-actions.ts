"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/abonnement/stripe";
import { utilisateurConnecte } from "@/lib/auth";
import { abonnementEnCours, confirmationValide, MOT_DE_CONFIRMATION } from "@/lib/mes-donnees";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResultatSuppression = { erreur?: string };

/**
 * « Supprimer mon compte » : résilie tout de suite l'abonnement Stripe (sans remboursement de la période
 * en cours), puis efface le compte et toutes ses données. Les factures restent chez Stripe (obligation légale).
 */
export async function supprimerMonCompte(confirmation: unknown): Promise<ResultatSuppression> {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: "Ta session a expiré. Reconnecte-toi." };
  if (u.role !== "membre") return { erreur: "Un compte de l'équipe du Club se retire depuis l'administration (Équipe)." };
  if (!confirmationValide(confirmation)) return { erreur: `Tape « ${MOT_DE_CONFIRMATION} » pour confirmer.` };

  const supabase = await createClient();
  const { data: fiche } = await supabase.from("membres").select("stripe_subscription_id").eq("id", u.id).maybeSingle();
  const abonnementId = (fiche?.stripe_subscription_id as string | null) ?? null;

  // 1. Plus aucun prélèvement : si Stripe ne répond pas, on ne supprime rien.
  let resilie = false;
  if (abonnementId) {
    try {
      const abonnement = await stripe().subscriptions.retrieve(abonnementId);
      if (abonnementEnCours(abonnement.status)) {
        await stripe().subscriptions.cancel(abonnementId);
        resilie = true;
      }
    } catch (e) {
      console.error("Suppression du compte : résiliation Stripe impossible", e);
      return { erreur: "Impossible de résilier ton abonnement pour le moment : ton compte n'a pas été supprimé. Réessaie dans un instant." };
    }
  }

  // 2. Effacement du compte : toutes les données du membre suivent (« on delete cascade »).
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(u.id);
  if (error) {
    console.error("Suppression du compte impossible", error.message);
    return {
      erreur: resilie
        ? "Ton abonnement est résilié, mais la suppression du compte a échoué. Réessaie, ou écris à Leclub@lcsperformance.fr."
        : "Impossible de supprimer ton compte pour le moment. Réessaie dans un instant.",
    };
  }
  await admin.from("comptes_supprimes").insert({ abonnement_resilie: resilie });

  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  redirect("/connexion?message=compte-supprime");
}
