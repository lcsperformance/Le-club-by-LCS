/**
 * État de l'abonnement d'un membre, déduit de l'abonnement Stripe, et règle d'accès.
 * Aucune dépendance : testable sans Stripe ni base.
 */

export type StatutAbonnement = "inactif" | "actif" | "impaye" | "resilie";

/** Ce dont on a besoin d'un abonnement Stripe (champs de l'API Stripe). */
export type AbonnementStripe = {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  ended_at: number | null;
  /** Depuis 2025, la fin de période est portée par chaque élément de l'abonnement. */
  items: { data: { current_period_end: number; price?: { recurring?: { interval?: string } | null } | null }[] };
  current_period_end?: number;
};

export type EtatAbonnement = {
  statut: StatutAbonnement;
  /** Fin de la période payée (ISO) : accès ouvert jusqu'à cette date. */
  fin: string | null;
  annulationPrevue: boolean;
};

const iso = (secondes: number | null | undefined) => (secondes ? new Date(secondes * 1000).toISOString() : null);

/** Fin de la période en cours (la plus tardive des éléments de l'abonnement). */
export function finDePeriode(abonnement: AbonnementStripe): number | null {
  const fins = abonnement.items?.data?.map((i) => i.current_period_end).filter((x): x is number => !!x) ?? [];
  if (fins.length) return Math.max(...fins);
  return abonnement.current_period_end ?? null;
}

/** Traduit le statut Stripe en statut du Club. */
export function etatDepuisAbonnement(abonnement: AbonnementStripe): EtatAbonnement {
  const finPeriode = finDePeriode(abonnement);
  switch (abonnement.status) {
    case "active":
    case "trialing":
      return { statut: "actif", fin: iso(finPeriode), annulationPrevue: abonnement.cancel_at_period_end };
    case "past_due":
    case "unpaid":
      // Paiement en échec : Stripe relance ; l'accès reste ouvert jusqu'à la fin de la période déjà payée.
      return { statut: "impaye", fin: iso(finPeriode), annulationPrevue: abonnement.cancel_at_period_end };
    case "canceled":
    case "incomplete_expired":
      // Terminé : l'accès s'arrête à la fin de la période payée (ou à la date de fin si elle est antérieure).
      return {
        statut: "resilie",
        fin: iso(Math.min(...[finPeriode, abonnement.ended_at].filter((x): x is number => !!x))) ?? null,
        annulationPrevue: false,
      };
    default:
      // incomplete, paused… : pas (encore) payé.
      return { statut: "inactif", fin: null, annulationPrevue: false };
  }
}

/** Un statut qui justifie de créer un compte : premier paiement réussi. */
export const estPaye = (etat: EtatAbonnement) => etat.statut === "actif";

/**
 * Accès à l'espace membre : ouvert tant que la période payée n'est pas terminée,
 * quel que soit le statut (résiliation prévue, paiement en échec…).
 * Le coach et l'admin ont toujours accès.
 */
export function aAcces(
  personne: { role: string; abonnement_fin: string | null },
  maintenant: Date = new Date(),
): boolean {
  if (personne.role !== "membre") return true;
  return !!personne.abonnement_fin && new Date(personne.abonnement_fin) > maintenant;
}
