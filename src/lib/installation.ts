/**
 * Application installable sur le téléphone (PWA) : règles testables, sans navigateur.
 *
 * - Fiche de l'app : src/app/manifest.ts ; icônes et écrans de démarrage : `npm run icones`.
 * - Petit programme de l'app (public/sw.js) : ne garde que la page « Pas de connexion »
 *   (public/hors-ligne.html) et son icône. Le programme, les messages et les données de santé
 *   ne sont jamais gardés sur le téléphone.
 * - Carte « Installer l'app » sur l'accueil (CarteInstallation) : bouton « Installer » sur Android,
 *   les deux gestes de Safari sur iPhone ; masquée si l'app est déjà installée ou si le membre l'a fermée.
 */

export const NOM_APP = "Le Club by LCS";
export const NOM_COURT_APP = "Le Club";
export const COULEUR_FOND = "#090A0F";

/** Fichiers gardés sur le téléphone par le petit programme de l'app : rien d'autre. */
export const FICHIERS_HORS_LIGNE = ["/hors-ligne.html", "/icones/icone-192.png"] as const;

/** Clé du navigateur qui retient que le membre a fermé la carte « Installer l'app ». */
export const CLE_CARTE_FERMEE = "le-club:installation-fermee";

/**
 * Écrans de démarrage iPhone (largeur et hauteur en points, densité), du plus récent au plus ancien.
 * Même liste que scripts/icones.mjs, qui fabrique les images.
 */
export const ECRANS_DEMARRAGE: readonly (readonly [number, number, number])[] = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
  [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2], [414, 736, 3], [320, 568, 2],
];

/** Images de démarrage pour Safari, chacune réservée à sa taille d'écran (en portrait). */
export function imagesDemarrage(): { url: string; media: string }[] {
  return ECRANS_DEMARRAGE.map(([l, h, d]) => ({
    url: `/demarrage/demarrage-${l * d}x${h * d}.png`,
    media: `(device-width: ${l}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)`,
  }));
}

/** iPhone ou iPad (les iPad récents se présentent comme un Mac tactile). */
export function estAppareilApple(userAgent: string, pointsTactiles = 0): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && pointsTactiles > 1);
}

/** Ce qu'affiche la carte : bouton « Installer » (Android), gestes de Safari (iPhone), ou rien. */
export type CarteInstallation = "android" | "iphone" | null;

export function carteInstallation(etat: {
  /** L'app est ouverte depuis son icône (déjà installée). */
  installee: boolean;
  /** Le membre a fermé la carte. */
  fermee: boolean;
  apple: boolean;
  /** Le navigateur propose l'installation (Chrome sur Android). */
  invitation: boolean;
}): CarteInstallation {
  if (etat.installee || etat.fermee) return null;
  if (etat.apple) return "iphone";
  return etat.invitation ? "android" : null;
}
