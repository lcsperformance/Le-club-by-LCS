import "server-only";
import Stripe from "stripe";
import { configAbonnement } from "./config";

let client: Stripe | null = null;

/** Client Stripe côté serveur (clé secrète : mode test tant que la clé est une clé de test). */
export function stripe(): Stripe {
  client ??= new Stripe(configAbonnement.cleStripe());
  return client;
}
