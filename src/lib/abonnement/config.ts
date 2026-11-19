import "server-only";

/** Variable d'environnement obligatoire côté serveur, avec un message clair si elle manque. */
function exiger(nom: string): string {
  const v = process.env[nom];
  if (!v) throw new Error(`Variable d'environnement manquante : ${nom} (voir README, rubrique « Abonnement Stripe »).`);
  return v;
}

export const configAbonnement = {
  cleStripe: () => exiger("STRIPE_SECRET_KEY"),
  secretWebhook: () => exiger("STRIPE_WEBHOOK_SECRET"),
  cleSupabaseSecrete: () => exiger("SUPABASE_SECRET_KEY"),
  /** Lien de paiement Stripe (public) : abonnement à 49 € par mois. */
  lienPaiement: () => process.env.STRIPE_LIEN_PAIEMENT ?? null,
  /** Facultative : sans elle, l'e-mail de reprise d'un ancien membre n'est pas envoyé. */
  cleResend: () => process.env.RESEND_API_KEY ?? null,
  expediteur: "Le Club by LCS <Leclub@lcsperformance.fr>",
};
