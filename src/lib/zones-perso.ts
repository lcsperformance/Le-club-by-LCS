/**
 * Personnalisation des zones par le membre (comme dans maquette/Main-neon.dc.html) :
 * on déplace le début d'une zone d'1 % à la fois, sans dépasser les zones voisines.
 */
import type { Bornes } from "./config-zones";

/** Le début de Z1 ne descend pas sous ce pourcentage. */
export const PLANCHER = 30;

export type Zone = 1 | 2 | 3 | 4 | 5;

/**
 * Limites du début d'une zone (= bornes[zone - 1]) : au moins 1 % au-dessus du début
 * de la zone précédente, au moins 1 % sous le début de la zone suivante (ou la fin de Z5).
 */
export function limitesDebut(bornes: Bornes, zone: Zone): { min: number; max: number } {
  const i = zone - 1;
  return {
    min: i === 0 ? PLANCHER : bornes[i - 1] + 1,
    max: bornes[i + 1] - 1,
  };
}

/** Avance (sens 1) ou recule (sens -1) le début d'une zone d'1 %, dans ses limites. */
export function decalerDebut(bornes: Bornes, zone: Zone, sens: -1 | 1): Bornes {
  const { min, max } = limitesDebut(bornes, zone);
  const i = zone - 1;
  const valeur = bornes[i] + sens;
  if (valeur < min || valeur > max) return bornes;
  const copie = [...bornes] as Bornes;
  copie[i] = valeur;
  return copie;
}

export function memesBornes(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * Vérifie des bornes envoyées par le membre (côté serveur) : 6 entiers qui montent,
 * début de Z1 ≥ 30 %, et fin de Z5 identique à celle du Club (elle n'est pas personnalisable).
 */
export function validerBornesPerso(valeur: unknown, club: Bornes): Bornes | null {
  if (!Array.isArray(valeur) || valeur.length !== 6) return null;
  if (!valeur.every((x) => Number.isInteger(x))) return null;
  const b = valeur as Bornes;
  if (b[0] < PLANCHER || b[5] !== club[5]) return null;
  for (let i = 1; i < 6; i++) if (b[i] <= b[i - 1]) return null;
  return b;
}

/**
 * Bornes personnalisées à afficher, d'après ce qui est enregistré.
 * Si le Club a changé la fin de Z5 depuis (config/zones.json), on la reprend ;
 * si ça rend les bornes incohérentes, on revient aux valeurs du Club.
 */
export function bornesPersoApplicables(enregistrees: unknown, club: Bornes): Bornes | null {
  if (!Array.isArray(enregistrees) || enregistrees.length !== 6) return null;
  const ajustees = [...enregistrees.slice(0, 5), club[5]];
  return validerBornesPerso(ajustees, club);
}
