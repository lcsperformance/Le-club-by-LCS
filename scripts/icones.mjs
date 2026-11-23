/**
 * Fabrique les icônes de l'app installable et les écrans de démarrage iPhone à partir du logo.
 *
 *   npm run icones
 *
 * Source : marque/logo-provisoire.jpg (photo provisoire). Pour le vrai logo : remplacer ce fichier
 * (ou changer SOURCE et CADRAGE ci-dessous), relancer la commande, puis faire un commit.
 *
 * Produit :
 * - public/icones/icone-192.png, icone-512.png (fiche de l'app, Android) ;
 * - src/app/icon.png (onglet du navigateur) et src/app/apple-icon.png (écran d'accueil iPhone) ;
 * - public/demarrage/*.png : écrans de démarrage iPhone (fond du Club, logo au centre),
 *   un par taille d'écran listée dans src/lib/installation.ts (ECRANS_DEMARRAGE).
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SOURCE = "marque/logo-provisoire.jpg";
// Carré découpé dans la photo, centré sur « Le Club by LCS » (marge suffisante pour les icônes arrondies).
const CADRAGE = { left: 104, top: 35, width: 640, height: 640 };
const FOND = "#090A0F";

// Même liste que ECRANS_DEMARRAGE (src/lib/installation.ts) : largeur et hauteur en points, densité.
const ECRANS = [
  [440, 956, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3], [390, 844, 3],
  [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2], [414, 736, 3], [320, 568, 2],
];

const carre = () => sharp(SOURCE).extract(CADRAGE);

mkdirSync("public/icones", { recursive: true });
mkdirSync("public/demarrage", { recursive: true });

for (const taille of [192, 512]) {
  await carre().resize(taille, taille).png().toFile(`public/icones/icone-${taille}.png`);
}
await carre().resize(64, 64).png().toFile("src/app/icon.png");
await carre().resize(180, 180).png().toFile("src/app/apple-icon.png");

for (const [l, h, d] of ECRANS) {
  const largeur = l * d;
  const hauteur = h * d;
  const cote = Math.round(largeur * 0.42);
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
