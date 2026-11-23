/**
 * Ma semaine : les 7 jours (lundi → dimanche) de la semaine en cours, à Paris,
 * et le titre « 16 – 22 novembre ». Jours au format AAAA-MM-JJ, sans heure ni fuseau.
 */
import { dateDuJourParis } from "./dates";
import { ajouterJours, estDateIso } from "./saison";

const COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

const enDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const mois = (iso: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(enDate(iso));

export type Jour = { iso: string; court: string; numero: number };

/** Les 7 jours de la semaine (du lundi au dimanche) qui contient ce jour. */
export function joursDeLaSemaine(aujourdhui: string): Jour[] {
  const lundi = ajouterJours(aujourdhui, -((enDate(aujourdhui).getUTCDay() + 6) % 7));
  return COURTS.map((court, i) => {
    const iso = ajouterJours(lundi, i);
    return { iso, court, numero: +iso.slice(8, 10) };
  });
}

/** « 16 – 22 novembre », ou « 30 novembre – 6 décembre » à cheval sur deux mois. */
export function titreSemaine(jours: Jour[]): string {
  const premier = jours[0].iso;
  const dernier = jours[jours.length - 1].iso;
  const debut = mois(premier) === mois(dernier) ? `${+premier.slice(8, 10)}` : `${+premier.slice(8, 10)} ${mois(premier)}`;
  return `${debut} – ${+dernier.slice(8, 10)} ${mois(dernier)}`;
}

/** « Lundi 16 novembre ». */
export function libelleJour(iso: string): string {
  const t = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(enDate(iso));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ---------------------------------------------------------------------------
// Navigation entre les semaines (flèches de Ma semaine, adresse /semaine?du=AAAA-MM-JJ).
// ---------------------------------------------------------------------------

/** Lundi de la semaine qui contient ce jour. */
export const lundiDe = (iso: string) => joursDeLaSemaine(iso)[0].iso;

/** L'équipe du Club (coach, admin), sans abonnement, voit 4 semaines à l'avance. */
export const SEMAINES_EQUIPE = 4;

export type BornesSemaines = { premier: string; dernier: string };

/**
 * Première et dernière semaine visibles (leurs lundis) :
 * - en arrière, jusqu'à la semaine d'inscription du membre ;
 * - en avant, jusqu'à la semaine qui contient le dernier jour payé (ou offert) de l'abonnement,
 *   jamais avant la semaine en cours.
 * dernierJourPaye : jour (AAAA-MM-JJ, Paris) de fin de l'accès ; null pour l'équipe du Club.
 */
export function bornesSemaines(aujourdhui: string, inscription: string | null, dernierJourPaye: string | null): BornesSemaines {
  const courante = lundiDe(aujourdhui);
  const premier = inscription && inscription < aujourdhui ? lundiDe(inscription) : courante;
  const fin = dernierJourPaye ?? ajouterJours(courante, SEMAINES_EQUIPE * 7);
  const dernier = fin > courante ? lundiDe(fin) : courante;
  return { premier, dernier };
}

/** Semaine demandée dans l'adresse (?du=), ramenée à son lundi ; la semaine en cours si absente ou hors limites. */
export function semaineDemandee(valeur: unknown, aujourdhui: string, bornes: BornesSemaines): string {
  const courante = lundiDe(aujourdhui);
  if (!estDateIso(valeur)) return courante;
  const lundi = lundiDe(valeur);
  return lundi < bornes.premier || lundi > bornes.dernier ? courante : lundi;
}

/** Lundis des semaines précédente et suivante, ou null en bout de course. */
export function semainesVoisines(lundi: string, bornes: BornesSemaines): { precedente: string | null; suivante: string | null } {
  const precedente = ajouterJours(lundi, -7);
  const suivante = ajouterJours(lundi, 7);
  return {
    precedente: precedente >= bornes.premier ? precedente : null,
    suivante: suivante <= bornes.dernier ? suivante : null,
  };
}

/**
 * Dernier jour (AAAA-MM-JJ, Paris) couvert par l'abonnement payé ou l'accès offert ;
 * null pour l'équipe du Club. Un membre sans date connue reste sur la semaine en cours.
 */
export function dernierJourPaye(
  u: { role: string; abonnement: { fin: string | null; offertJusqua: string | null } },
  aujourdhui: string,
): string | null {
  if (u.role !== "membre") return null;
  const jours = [u.abonnement.fin, u.abonnement.offertJusqua].filter((d): d is string => !!d).map((d) => dateDuJourParis(new Date(d)));
  return jours.length ? jours.sort().at(-1)! : aujourdhui;
}
