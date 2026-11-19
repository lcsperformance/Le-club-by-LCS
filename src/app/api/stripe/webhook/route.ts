/**
 * Webhook Stripe : Stripe appelle cette adresse à chaque événement d'abonnement.
 * La signature prouve que le message vient bien de Stripe ; sinon, refus (400).
 * En cas d'erreur de traitement, réponse 500 : Stripe renverra l'événement plus tard.
 */
import { NextResponse } from "next/server";
import { configAbonnement } from "@/lib/abonnement/config";
import { dependancesReelles } from "@/lib/abonnement/dependances";
import { stripe } from "@/lib/abonnement/stripe";
import { traiterEvenement, type EvenementStripe } from "@/lib/abonnement/webhook";

export async function POST(requete: Request) {
  const corps = await requete.text();
  const signature = requete.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ erreur: "Signature manquante" }, { status: 400 });

  let evenement: EvenementStripe;
  try {
    evenement = stripe().webhooks.constructEvent(corps, signature, configAbonnement.secretWebhook()) as unknown as EvenementStripe;
  } catch {
    return NextResponse.json({ erreur: "Signature invalide" }, { status: 400 });
  }

  try {
    const resultat = await traiterEvenement(evenement, dependancesReelles());
    console.info("Webhook Stripe", evenement.type, evenement.id, resultat.action);
    return NextResponse.json({ recu: true, action: resultat.action });
  } catch (e) {
    console.error("Webhook Stripe en échec", evenement.type, evenement.id, e instanceof Error ? e.message : e);
    return NextResponse.json({ erreur: "Traitement impossible" }, { status: 500 });
  }
}
