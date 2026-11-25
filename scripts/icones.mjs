/**
 * Fabrique les icônes de l'app installable et les écrans de démarrage iPhone à partir du logo.
 *
 *   npm run icones
 *
 * Source : marque/logo-club-icone.png (logo D, tiré de marque/logo-club-icone.svg). Pour changer de logo : remplacer ce fichier
 * (ou changer SOURCE et CADRAGE ci-dessous), relancer la commande, puis faire un commit.
 *
 * Produit :
 * - public/icones/icone-192.png, icone-512.png (fiche de l'app, Android) ;
 * - src/app/icon.png (onglet du navigateur) et src/app/apple-icon.png (écran d'accueil iPhone) ;
 * - public/demarrage/*.png : écrans de démarrage iPhone (fond du Club, logo au centre),
 *   un par taille d'écran listée dans src/lib/installation.ts (ECRANS_DEMARRAGE) ;
 *   et iPad (ECRANS_IPAD), en portrait et en paysage.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SOURCE = "marque/logo-club-icone.png";
// Logo du Club (symbole C sur fond Abysse), carré complet.
const CADRAGE = { left: 0, top: 0, width: 1024, height: 1024 };
const FOND = "#090A0F";

// Même liste que ECRANS_DEMARRAGE (src/lib/installation.ts) : largeur et hauteur en points, densité.
const ECRANS = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
  [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2], [414, 736, 3], [320, 568, 2],
];

// Même liste que ECRANS_IPAD (src/lib/installation.ts) : portrait, en points, densité.
const ECRANS_IPAD = [
  [1032, 1376, 2], [1024, 1366, 2], [834, 1210, 2], [834, 1194, 2], [834, 1112, 2],
  [820, 1180, 2], [810, 1080, 2], [768, 1024, 2], [744, 1133, 2],
];

const carre = () => sharp(SOURCE).extract(CADRAGE);

mkdirSync("public/icones", { recursive: true });
mkdirSync("public/demarrage", { recursive: true });

for (const taille of [192, 512]) {
  await carre().resize(taille, taille).png().toFile(`public/icones/icone-${taille}.png`);
}
await carre().resize(64, 64).png().toFile("src/app/icon.png");
await carre().resize(180, 180).png().toFile("src/app/apple-icon.png");

const TAILLES = [
  ...ECRANS.map(([l, h, d]) => [l * d, h * d]),
  ...ECRANS_IPAD.flatMap(([l, h, d]) => [[l * d, h * d], [h * d, l * d]]),
];

for (const [largeur, hauteur] of TAILLES) {
  // Logo à 42 % du petit côté (iPhone), 28 % sur iPad pour ne pas l'agrandir à l'excès.
  const petit = Math.min(largeur, hauteur);
  const cote = Math.round(petit * (petit >= 1400 ? 0.28 : 0.42));
  const rayon = Math.round(cote * 0.22);
  const masque = Buffer.from(`<svg width="${cote}" height="${cote}"><rect width="${cote}" height="${cote}" rx="${rayon}" ry="${rayon}"/></svg>`);
  const logo = await carre()
    .resize(cote, cote)
    .composite([{ input: masque, blend: "dest-in" }])
    .png()
    .toBuffer();
  await sharp({ create: { width: largeur, height: hauteur, channels: 3, background: FOND } })
    .composite([{ input: logo, left: Math.round((largeur - cote) / 2), top: Math.round((hauteur - cote) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(`public/demarrage/demarrage-${largeur}x${hauteur}.png`);
}

console.log("Icônes et écrans de démarrage à jour.");
