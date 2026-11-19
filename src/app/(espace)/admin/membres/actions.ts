"use server";

import { stripe } from "@/lib/abonnement/stripe";
import { finDeJourneeParis } from "@/lib/admin/membres";
import { utilisateurConnecte } from "@/lib/auth";
import { urlDuSite } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResultatAdmin = { erreur?: string; info?: string };

const REFUS = "Action réservée à un administrateur.";

/** Vérifie que la personne connectée est admin (la base le vérifie aussi, dans chaque fonction). */
async function estAdmin() {
  const u = await utilisateurConnecte();
  return u?.role === "admin";
}

/** Message d'erreur de la base, lisible par l'admin. */
function messageBase(error: { code?: string; message: string }): string {
  if (error.code === "42501") return REFUS;
  if (error.code === "P0002") return "Ce membre est introuvable.";
  if (error.code === "22023") return error.message;
  console.error("Action admin impossible", error.code, error.message);
  return "Action impossible pour le moment. Réessaie dans un instant.";
}

/** Ouvre l'accès jusqu'au soir de la date choisie (AAAA-MM-JJ), ou retire l'accès offert (null). */
export async function offrirAcces(membreId: string, date: string | null): Promise<ResultatAdmin> {
  if (!(await estAdmin())) return { erreur: REFUS };
  let jusqua: string | null = null;
  if (date !== null) {
    const fin = finDeJourneeParis(date);
    if (!fin) return { erreur: "Choisis une date valide." };
    if (fin <= new Date()) return { erreur: "Choisis une date à venir." };
    jusqua = fin.toISOString();
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_offrir_acces", { cible: membreId, jusqua });
  if (error) return { erreur: messageBase(error) };
  return { info: jusqua ? "Accès ouvert." : "Accès offert retiré." };
}

/**
 * Coupe (ou rétablit) l'accès. Couper programme aussi la résiliation de l'abonnement Stripe
 * à la fin de la période déjà payée : plus aucun prélèvement ensuite.
 */
export async function couperAcces(membreId: string, coupe: boolean): Promise<ResultatAdmin> {
  if (!(await estAdmin())) return { erreur: REFUS };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_couper_acces", { cible: membreId, coupe });
  if (error) return { erreur: messageBase(error) };
  if (!coupe) return { info: "Accès rétabli." };

  const { data } = await supabase.from("membres").select("stripe_subscription_id").eq("id", membreId).maybeSingle();
  const abonnementId = (data?.stripe_subscription_id as string | null) ?? null;
  if (!abonnementId) return { info: "Accès coupé." };
  try {
    const abonnement = await stripe().subscriptions.retrieve(abonnementId);
    const enCours = ["active", "trialing", "past_due", "unpaid"].includes(abonnement.status);
    if (!enCours) return { info: "Accès coupé. L'abonnement Stripe était déjà terminé." };
    if (!abonnement.cancel_at_period_end) {
      await stripe().subscriptions.update(abonnementId, { cancel_at_period_end: true });
    }
    return { info: "Accès coupé. L'abonnement Stripe s'arrêtera à la fin de la période payée (plus de prélèvement)." };
  } catch (e) {
    console.error("Résiliation Stripe impossible après coupure", e);
    return {
      erreur:
        "Accès coupé, mais la résiliation Stripe a échoué : réessaie dans un instant, ou résilie l'abonnement dans Stripe.",
    };
  }
}

/**
 * Renvoie l'e-mail d'accès : l'e-mail de bienvenue si la personne n'a jamais choisi son mot de passe,
 * sinon l'e-mail « choisis un nouveau mot de passe ».
 */
export async function renvoyerEmailAcces(membreId: string): Promise<ResultatAdmin> {
  if (!(await estAdmin())) return { erreur: REFUS };
  const supabase = await createClient();
  const { data: membre } = await supabase.from("membres").select("email, role").eq("id", membreId).maybeSingle();
  if (!membre || membre.role !== "membre") return { erreur: "Ce membre est introuvable." };
  const email = membre.email as string;
  const redirectTo = `${urlDuSite()}/auth/confirm`;

  const admin = createAdminClient();
  const { data: compte } = await admin.auth.admin.getUserById(membreId);
  const jamaisConnecte = !compte?.user?.last_sign_in_at;

  let type: "Invitation" | "Nouveau mot de passe" = "Nouveau mot de passe";
  let erreur: { status?: number; code?: string; message: string } | null = null;
  if (jamaisConnecte) {
    const r = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    erreur = r.error;
    if (!erreur) type = "Invitation";
  }
  if (!jamaisConnecte || erreur) {
    // Déjà connecté, ou invitation impossible (compte déjà confirmé) : lien pour choisir un mot de passe.
    erreur = (await admin.auth.resetPasswordForEmail(email, { redirectTo })).error;
  }
  if (erreur) {
    if (erreur.status === 429) return { erreur: "Trop d'e-mails envoyés en peu de temps. Réessaie dans une heure." };
    console.error("Renvoi de l'e-mail d'accès impossible", erreur.code, erreur.message);
    return { erreur: "L'e-mail n'a pas pu partir. Réessaie dans un instant." };
  }

  const { error } = await supabase.rpc("admin_noter_email_acces", { cible: membreId, detail: type });
  if (error) console.error("Journal : renvoi d'e-mail non noté", error.code, error.message);
  return {
    info:
      type === "Invitation"
        ? `E-mail de bienvenue renvoyé à ${email}.`
        : `E-mail « choisir un nouveau mot de passe » envoyé à ${email}.`,
  };
}
