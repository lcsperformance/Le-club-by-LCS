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
  /** Depuis 2025, la période est portée par chaque élément de l'abonnement. */
  items: {
    data: {
      current_period_end: number;
      current_period_start?: number;
      price?: { recurring?: { interval?: string } | null } | null;
    }[];
  };
  current_period_end?: number;
  current_period_start?: number;
  /** Dernière facture (lue avec `expand: ["latest_invoice"]`) : payée ou non. */
  latest_invoice?: string | { status?: string | null } | null;
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

/** Début de la période en cours : fin de la dernière période réellement payée quand la facture est impayée. */
export function debutDePeriode(abonnement: AbonnementStripe): number | null {
  const debuts = abonnement.items?.data?.map((i) => i.current_period_start).filter((x): x is number => !!x) ?? [];
  if (debuts.length) return Math.min(...debuts);
  return abonnement.current_period_start ?? null;
}

/** La dernière facture est-elle restée impayée ? (null : inconnu, facture non lue) */
function derniereFactureImpayee(abonnement: AbonnementStripe): boolean | null {
  const f = abonnement.latest_invoice;
  if (!f || typeof f === "string" || !f.status) return null;
  return f.status !== "paid";
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
      // Paiement en échec : Stripe relance, mais il a déjà fait commencer la nouvelle période, qui n'est
      // pas payée. L'accès s'arrête donc au DÉBUT de la période en cours = fin de la dernière période payée.
      return {
        statut: "impaye",
        fin: iso(debutDePeriode(abonnement) ?? finPeriode),
        annulationPrevue: abonnement.cancel_at_period_end,
      };
    case "canceled":
    case "incomplete_expired": {
      // Terminé : l'accès s'arrête à la fin de la période payée (ou à la date de fin si elle est antérieure).
      // Arrêté après des impayés (dernière facture non payée) : la période en cours n'a jamais été payée.
      const finPayee = derniereFactureImpayee(abonnement) ? debutDePeriode(abonnement) : finPeriode;
      return {
        statut: "resilie",
        fin: iso(Math.min(...[finPayee, abonnement.ended_at].filter((x): x is number => !!x))) ?? null,
        annulationPrevue: false,
      };
    }
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
