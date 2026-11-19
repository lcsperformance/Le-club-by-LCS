/**
 * Les deux formules du Club (mêmes prix que chez Stripe, produit « Le Club »).
 * Aucune dépendance : utilisable dans les écrans et testable.
 */

export type Formule = "mensuelle" | "annuelle";

export const FORMULES: Record<Formule, { prix: number; periode: "mois" | "an"; engagement: string }> = {
  mensuelle: { prix: 49, periode: "mois", engagement: "Sans engagement. Tu peux arrêter quand tu veux." },
  annuelle: {
    prix: 499,
    periode: "an",
    engagement: "Payé une fois pour l'année. Tu peux arrêter le renouvellement quand tu veux.",
  },
};

/** « 49 € », « 41,58 € » (espace normale, comme le reste de l'app). */
const euros = (montant: number) =>
  `${Number.isInteger(montant) ? montant : montant.toFixed(2).replace(".", ",")} €`;

/** « 49 €/mois », « 499 €/an ». */
export const prixFormule = (f: Formule) => `${euros(FORMULES[f].prix)}/${FORMULES[f].periode}`;

/** Prix mensuel équivalent de l'annuel : « 41,58 € par mois ». */
export const equivalentMensuel = () => `${euros(Math.round((FORMULES.annuelle.prix / 12) * 100) / 100)} par mois`;

/** Économie de l'annuel par rapport à douze mois : « 89 € ». */
export const economieAnnuelle = () => euros(FORMULES.mensuelle.prix * 12 - FORMULES.annuelle.prix);

/** Formule d'un abonnement Stripe, d'après l'intervalle de son prix (mois ou an). */
export function formuleDepuisAbonnement(abonnement: {
  items: { data: { price?: { recurring?: { interval?: string } | null } | null }[] };
}): Formule | null {
  const intervalle = abonnement.items?.data?.[0]?.price?.recurring?.interval;
  if (intervalle === "month") return "mensuelle";
  if (intervalle === "year") return "annuelle";
  return null;
}
