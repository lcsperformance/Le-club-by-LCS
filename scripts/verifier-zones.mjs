/**
 * Vérifie config/zones.json avant chaque compilation (npm run build, donc aussi sur Vercel).
 * Objectif : un message clair, en français, si le fichier a été mal modifié.
 */
import { readFileSync } from "node:fs";
import { validerConfig } from "../src/lib/config-zones.ts";

const CHEMIN = new URL("../config/zones.json", import.meta.url);
const texte = readFileSync(CHEMIN, "utf8");

function echec(message) {
  console.error(`\n✖ Problème dans config/zones.json\n\n${message}\n`);
  process.exit(1);
}

/** Ligne et colonne d'une position dans le texte (comptées à partir de 1). */
function position(index) {
  const avant = texte.slice(0, index);
  const ligne = avant.split("\n").length;
  const colonne = index - avant.lastIndexOf("\n");
  return { ligne, colonne };
}

let config;
try {
  config = JSON.parse(texte);
} catch (e) {
  const m = /position (\d+)/.exec(String(e.message));
  const ou = m ? position(Number(m[1])) : null;
  const extrait = ou ? `\n\n  ${texte.split("\n")[ou.ligne - 1].trim()}` : "";
  echec(
    `Le fichier n'est pas bien écrit${ou ? ` (ligne ${ou.ligne}, vers le caractère ${ou.colonne})` : ""}.${extrait}\n\n` +
      "Causes fréquentes : une virgule en trop après le dernier élément d'une liste, une virgule oubliée\n" +
      "entre deux nombres ou deux lignes, un crochet [ ] ou un guillemet \" manquant.",
  );
}

try {
  validerConfig(config);
} catch (e) {
  echec(String(e.message).replace(/^config\/zones\.json : /, ""));
}

console.log("✓ config/zones.json est correct.");
