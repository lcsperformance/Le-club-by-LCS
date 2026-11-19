"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/abonnement/stripe";
import { utilisateurConnecte } from "@/lib/auth";
import { urlDuSite } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Ouvre le portail client Stripe (résilier, changer de carte, factures) pour le membre connecté. */
export async function ouvrirPortail() {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  // Identifiant client lu sur la fiche du membre connecté (sécurité par ligne) : jamais reçu du navigateur.
  const supabase = await createClient();
  const { data } = await supabase.from("membres").select("stripe_customer_id").eq("id", utilisateur.id).maybeSingle();
  const client = data?.stripe_customer_id as string | null | undefined;
  if (!client) redirect("/abonnement");

  const session = await stripe().billingPortal.sessions.create({
    customer: client,
    return_url: `${urlDuSite()}/profil`,
    locale: "fr",
  });
  redirect(session.url);
}
