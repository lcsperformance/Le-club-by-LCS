/**
 * Historique des tests de départ d'un membre, sport par sport.
 * Chaque série de tests reste avec sa date ; refaire ses tests le même jour remplace
 * la ligne du jour (contrainte « tests_un_par_jour » de la base).
 */
import type { CleMesure } from "./tests-depart";

export const SPORTS_HISTORIQUE = ["course", "velo", "natation", "cardio"] as const;
export type SportHistorique = (typeof SPORTS_HISTORIQUE)[number];

/** Colonne de la table `tests` suivie pour chaque sport. */
export const COLONNE_PAR_SPORT: Record<SportHistorique, CleMesure> = {
  course: "allure_seuil_course", // secondes par km
  velo: "ftp", // watts
  natation: "vitesse_critique_natation", // secondes par 100 m
  cardio: "fc_seuil", // battements par minute
};

export type PointHistorique = { date: string; valeur: number };

type LigneTest = { date_test: string } & Partial<Record<CleMesure, number | null>>;

/**
 * Met en forme l'historique d'un sport : une valeur par date,
 * de la plus ancienne à la plus récente, sans les dates où la valeur manque.
 */
export function extraireHistorique(lignes: readonly LigneTest[], sport: SportHistorique): PointHistorique[] {
  const colonne = COLONNE_PAR_SPORT[sport];
  return lignes
    .filter((l) => typeof l[colonne] === "number")
    .map((l) => ({ date: l.date_test, valeur: l[colonne] as number }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
