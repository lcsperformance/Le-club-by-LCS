/** Prénom du membre : mise en forme à partir du nom saisi chez Stripe, et vérification de la saisie. */

export const LONGUEUR_MAX_PRENOM = 40;

/** « jean-PIERRE » → « Jean-Pierre », « éLODIE » → « Élodie », « d'artagnan » → « D'Artagnan ». */
function capitaliser(mot: string): string {
  return mot
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, lettre: string) => sep + lettre.toLocaleUpperCase("fr-FR"));
}

/**
 * Prénom tiré du nom complet du titulaire (« caroline DUPONT » → « Caroline ») : le premier mot.
 * Renvoie null si rien d'utilisable.
 */
export function prenomDepuisNom(nom: string | null | undefined): string | null {
  const premier = (nom ?? "").trim().split(/\s+/)[0] ?? "";
  if (!/\p{L}/u.test(premier)) return null;
  return capitaliser(premier).slice(0, LONGUEUR_MAX_PRENOM);
}

/** Vérifie le prénom saisi par le membre. Vide = pas de prénom (null). */
export function lirePrenomSaisi(valeur: string): { prenom: string | null } | { erreur: string } {
  const p = valeur.trim().replace(/\s+/g, " ");
  if (!p) return { prenom: null };
  if (p.length > LONGUEUR_MAX_PRENOM) return { erreur: `${LONGUEUR_MAX_PRENOM} caractères maximum.` };
  if (!/^[\p{L}][\p{L} '’-]*$/u.test(p)) return { erreur: "Seulement des lettres, espaces, tirets et apostrophes." };
  return { prenom: p };
}
