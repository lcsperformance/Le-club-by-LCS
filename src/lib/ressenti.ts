/**
 * Ressenti de séance : « Marquer comme faite », puis RPE (1 à 10) et commentaire facultatif.
 * Données personnelles (table `ressentis`) : lues seulement par le membre et l'encadrement (coachs, admins),
 * jamais par les autres membres. Pas de case « douleur » : on ne collecte pas de données de santé.
 */
import { ajouterJours, estDateIso } from "./saison";

export type Ressenti = { rpe: number | null; commentaire: string | null };

export const LONGUEUR_MAX_COMMENTAIRE = 500;
/** On peut noter une séance du jour ou des 14 jours passés, jamais une séance à venir. */
export const JOURS_RATTRAPAGE = 14;

/** Jour de la séance demandé dans l'adresse (?jour=AAAA-MM-JJ), sinon aujourd'hui. */
export function jourDeLaSeance(valeur: unknown, aujourdhui: string): string {
  return estDateIso(valeur) ? valeur : aujourdhui;
}

/** Peut-on marquer la séance de ce jour comme faite (ou donner son ressenti) ? */
export function erreurJour(jour: unknown, aujourdhui: string): string | null {
  if (!estDateIso(jour)) return "Cette séance est introuvable.";
  if (jour > aujourdhui) return "Tu pourras marquer cette séance le jour J.";
  if (jour < ajouterJours(aujourdhui, -JOURS_RATTRAPAGE)) return `On ne peut plus noter une séance de plus de ${JOURS_RATTRAPAGE} jours.`;
  return null;
}

/** Lit le ressenti saisi : RPE obligatoire (1 à 10), commentaire facultatif. */
export function lireRessentiSaisi(saisie: unknown): { ressenti: Ressenti & { rpe: number } } | { erreur: string } {
  const s = saisie && typeof saisie === "object" ? (saisie as Record<string, unknown>) : {};
  const rpe = s.rpe;
  if (typeof rpe !== "number" || !Number.isInteger(rpe) || rpe < 1 || rpe > 10) return { erreur: "Choisis ton RPE, de 1 à 10." };
  const texte = typeof s.commentaire === "string" ? s.commentaire.trim() : "";
  if (texte.length > LONGUEUR_MAX_COMMENTAIRE) return { erreur: `Ton commentaire dépasse ${LONGUEUR_MAX_COMMENTAIRE} caractères.` };
  return { ressenti: { rpe, commentaire: texte || null } };
}
