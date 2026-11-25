/**
 * Points de rupture de la version ordinateur : seule référence du projet.
 *
 * En dessous de ORDINATEUR, téléphone (320-390 px) et iPad (768 et 1024 px) gardent
 * l'affichage d'origine. Le CSS ne pouvant pas lire une variable dans une règle @media,
 * les fichiers de mise en page écrivent « @media (min-width: 1100px) » ; le test
 * tests/points-de-rupture.test.ts vérifie qu'ils reprennent exactement ces valeurs,
 * et que seuls les fichiers de mise en page partagés en contiennent (jamais un écran).
 * Les largeurs, elles, sont des variables CSS (globals.css) : --largeur-telephone,
 * --largeur-contenu, --largeur-rail, --marge-rail.
 */

/** Ordinateur : rail latéral, contenu élargi, deux colonnes. */
export const ORDINATEUR = 1100;

/** Grand écran : plus d'espace, grilles plus larges. */
export const GRAND_ECRAN = 1440;

export const POINTS_DE_RUPTURE = [ORDINATEUR, GRAND_ECRAN] as const;
