/**
 * Vérifie les fichiers de configuration modifiables sans toucher au code, avant chaque
 * compilation (npm run build, donc aussi sur Vercel) : config/zones.json et config/profils.json.
 * Objectif : un message clair, en français, si un fichier a été mal modifié.
 */
import { readFileSync } from "node:fs";
import { validerConfigProfils } from "../src/lib/config-profils.ts";
import { validerConfig } from "../src/lib/config-zones.ts";

const FICHIERS = [
  { nom: "config/zones.json", valider: validerConfig },
  { nom: "config/profils.json", valider: validerConfigProfils },
];

let echecs = 0;

for (const { nom, valider } of FICHIERS) {
  const texte = readFileSync(new URL(`../${nom}`, import.meta.url), "utf8");
  const echec = (message) => {
    console.error(`\n✖ Problème dans ${nom}\n\n${message}\n`);
    echecs++;
  };

  /** Ligne et colonne d'une position dans le texte (comptées à partir de 1). */
  const position = (index) => {
    const avant = texte.slice(0, index);
    return { ligne: avant.split("\n").length, colonne: index - avant.lastIndexOf("\n") };
  };

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
        "entre deux nombres ou deux lignes, un crochet [ ], une accolade { } ou un guillemet \" manquant.",
    );
    continue;
  }

  try {
    valider(config);
    console.log(`✓ ${nom} est correct.`);
  } catch (e) {
    echec(String(e.message).replace(/^config\/[a-z]+\.json : /, ""));
  }
}

if (echecs) process.exit(1);
