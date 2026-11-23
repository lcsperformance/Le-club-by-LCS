/**
 * Espace admin, liste des membres : recherche, ancienneté et état de l'accès.
 * Sans dépendance (ni base ni écran) : testable.
 */
import { aAcces, type StatutAbonnement } from "@/lib/abonnement/etat";
import type { Formule } from "@/lib/abonnement/formules";
import { dateDuJourParis, formatDateCourteFr } from "@/lib/dates";
import type { Niveau } from "@/lib/profils";

/** Une ligne de la liste (lue en base par la page, avec les droits de l'admin). */
export type MembreAdmin = {
  id: string;
  email: string;
  prenom: string | null;
  /** Nom de famille ; absent ou null s'il n'est pas connu. */
  nom?: string | null;
  niveau: Niveau | null;
  statut_abonnement: StatutAbonnement;
  abonnement_fin: string | null;
  annulation_prevue: boolean;
  formule: Formule | null;
  date_inscription: string;
  acces_offert_jusqua: string | null;
  acces_coupe: boolean;
};

export type LigneJournal = { membre_id: string; action: string; detail: string | null; fait_le: string };

/** Minuscules, sans accents : « Élodie » et « elodie » se retrouvent. */
export const normaliser = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();

/** Membres dont le prénom ou l'e-mail contient chaque mot recherché. */
export function filtrerMembres<T extends Pick<MembreAdmin, "prenom" | "email" | "nom">>(membres: T[], recherche: string): T[] {
  const mots = normaliser(recherche).split(/\s+/).filter(Boolean);
  if (!mots.length) return membres;
  return membres.filter((m) => {
    const texte = normaliser(`${m.prenom ?? ""} ${m.nom ?? ""} ${m.email}`);
    return mots.every((mot) => texte.includes(mot));
  });
}

/** « Membre depuis aujourd'hui », « depuis 12 jours », « depuis 3 mois », « depuis 1 an et 2 mois ». */
export function anciennete(dateInscription: string, maintenant: Date = new Date()): string {
  const [a1, m1, j1] = dateDuJourParis(new Date(dateInscription)).split("-").map(Number);
  const [a2, m2, j2] = dateDuJourParis(maintenant).split("-").map(Number);
  let mois = (a2 - a1) * 12 + (m2 - m1) - (j2 < j1 ? 1 : 0);
  if (mois < 1) {
    const jours = Math.round((Date.UTC(a2, m2 - 1, j2) - Date.UTC(a1, m1 - 1, j1)) / 86_400_000);
    if (jours <= 0) return "Membre depuis aujourd'hui";
    return `Membre depuis ${jours} jour${jours > 1 ? "s" : ""}`;
  }
  const ans = Math.floor(mois / 12);
  mois %= 12;
  const texteMois = `${mois} mois`;
  if (!ans) return `Membre depuis ${texteMois}`;
  const texteAns = `${ans} an${ans > 1 ? "s" : ""}`;
  return `Membre depuis ${texteAns}${mois ? ` et ${texteMois}` : ""}`;
}

export type Ton = "ouvert" | "ferme" | "alerte";

/** Statut d'abonnement, en clair. */
export function libelleStatut(m: Pick<MembreAdmin, "statut_abonnement" | "annulation_prevue">): {
  texte: string;
  ton: Ton;
} {
  switch (m.statut_abonnement) {
    case "actif":
      return m.annulation_prevue ? { texte: "Résiliation prévue", ton: "alerte" } : { texte: "Abonné", ton: "ouvert" };
    case "impaye":
      return { texte: "Paiement en échec", ton: "alerte" };
    case "resilie":
      return { texte: "Résilié", ton: "ferme" };
    default:
      return { texte: "Jamais abonné", ton: "ferme" };
  }
}

/** État de l'accès à l'app, avec la date qui compte. */
export function etatAcces(m: MembreAdmin, maintenant: Date = new Date()): { texte: string; ton: Ton } {
  if (m.acces_coupe) return { texte: "Accès coupé par l'admin", ton: "alerte" };
  const ouvert = aAcces({ role: "membre", ...m }, maintenant);
  if (!ouvert) return { texte: "Pas d'accès", ton: "ferme" };
  const finAbonnement = m.abonnement_fin ? new Date(m.abonnement_fin) : null;
  const finOfferte = m.acces_offert_jusqua ? new Date(m.acces_offert_jusqua) : null;
  if (finOfferte && finOfferte > maintenant && (!finAbonnement || finOfferte >= finAbonnement)) {
    return { texte: `Accès offert jusqu'au ${formatDateCourteFr(finOfferte)}`, ton: "ouvert" };
  }
  return { texte: `Accès jusqu'au ${formatDateCourteFr(finAbonnement!)}`, ton: "ouvert" };
}

const ACTIONS: Record<string, string> = {
  acces_offert: "Accès offert",
  acces_offert_retire: "Accès offert retiré",
  acces_coupe: "Accès coupé",
  acces_retabli: "Accès rétabli",
  email_acces_renvoye: "E-mail d'accès renvoyé",
  commentaire_supprime: "Commentaire supprimé",
};

/** Ligne du journal en clair : « Accès offert jusqu'au 01/02/2027 ». */
export function libelleJournal(l: Pick<LigneJournal, "action" | "detail">): string {
  const base = ACTIONS[l.action] ?? l.action;
  if (l.action === "acces_offert" && l.detail) return `${base} jusqu'au ${l.detail}`;
  if (l.detail) return `${base} (${l.detail})`;
  return base;
}

/** Date AAAA-MM-JJ → fin de cette journée à Paris (l'accès offert court jusqu'au soir inclus). */
export function finDeJourneeParis(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  // 23:59:59 à Paris : on essaie les deux décalages possibles (hiver +1, été +2).
  for (const decalage of ["+01:00", "+02:00"]) {
    const d = new Date(`${date}T23:59:59${decalage}`);
    if (dateDuJourParis(d) === date && Number.isFinite(d.getTime())) {
      const verif = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", timeZone: "Europe/Paris" }).format(d);
      if (verif.startsWith("23")) return d;
    }
  }
  return null;
}
