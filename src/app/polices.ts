/**
 * Polices de l'application : LE seul endroit à modifier pour en changer.
 *
 * Chaque police est exposée en variable CSS (--police-titre, --police-texte),
 * utilisée ensuite partout via globals.css. Pour passer plus tard à Tussilago et
 * Helvetica Neue LT Pro, remplacer ces déclarations par next/font/local
 * (fichiers dans public/fonts) en gardant les mêmes noms de variables.
 */
import { Archivo, Inter } from "next/font/google";

/**
 * Titres : Archivo en version large (axe « wdth », jusqu'à 125 %).
 * La graisse 800 et les capitales sont appliquées en CSS (--titre-graisse, --titre-casse) :
 * next/font n'accepte l'axe de largeur qu'avec la version variable de la police.
 */
export const policeTitre = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--police-titre",
  display: "swap",
});

/** Texte courant : Inter. */
export const policeTexte = Inter({
  subsets: ["latin"],
  variable: "--police-texte",
  display: "swap",
});

/** Classes à poser sur <html> pour déclarer les variables CSS. */
export const classesPolices = `${policeTitre.variable} ${policeTexte.variable}`;
