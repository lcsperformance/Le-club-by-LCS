/**
 * Ma semaine : les 7 jours (lundi → dimanche) de la semaine en cours, à Paris,
 * et le titre « 16 – 22 novembre ». Jours au format AAAA-MM-JJ, sans heure ni fuseau.
 */
import { ajouterJours } from "./saison";

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
