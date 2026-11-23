/**
 * Vérification de config/ressources.json (thèmes et sous-rubriques de l'onglet Ressources).
 * Ce module n'importe rien : il est aussi utilisé par scripts/verifier-config.mjs.
 * Les clés correspondent aux colonnes « theme » et « sous_rubrique » de la table ressources.
 */

export const ICONES_THEMES = ["nutrition", "natation", "velo", "course", "preparation"] as const;
export type IconeTheme = (typeof ICONES_THEMES)[number];

export type SousRubrique = { cle: string; nom: string };
export type Theme = { cle: string; nom: string; icone: IconeTheme; sous_rubriques: SousRubrique[] };
export type ConfigRessources = { themes: Theme[] };

const CLE = /^[a-z_]{1,40}$/;
/** Adresses déjà prises sous /ressources (/ressources/favoris, /ressources/contenu/…). */
const CLES_RESERVEES = ["favoris", "contenu"];

export function validerConfigRessources(c: unknown): ConfigRessources {
  const erreur = (m: string) => new Error(`config/ressources.json : ${m}`);
  if (!c || typeof c !== "object") throw erreur("le fichier est vide ou illisible.");
  const themes = (c as { themes?: unknown }).themes;
  if (!Array.isArray(themes) || !themes.length) throw erreur("il manque la liste « themes ».");

  const clesThemes = new Set<string>();
  themes.forEach((t: Record<string, unknown>, i) => {
    const ou = `thème n° ${i + 1}`;
    if (typeof t?.cle !== "string" || !CLE.test(t.cle) || t.cle.length > 30) {
      throw erreur(`${ou} : « cle » doit être en minuscules, sans accent ni espace (ex. « nutrition »).`);
    }
    if (clesThemes.has(t.cle)) throw erreur(`la clé de thème « ${t.cle} » est utilisée deux fois.`);
    if (CLES_RESERVEES.includes(t.cle)) throw erreur(`la clé de thème « ${t.cle} » est réservée par l'app : choisissez-en une autre.`);
    clesThemes.add(t.cle);
    if (typeof t.nom !== "string" || !t.nom.trim() || t.nom.length > 40) throw erreur(`${ou} (${t.cle}) : « nom » doit être un texte de 40 caractères au plus.`);
    if (!(ICONES_THEMES as readonly unknown[]).includes(t.icone)) {
      throw erreur(`${ou} (${t.cle}) : « icone » doit valoir ${ICONES_THEMES.join(", ")}.`);
    }
    const sous = t.sous_rubriques;
    if (!Array.isArray(sous) || !sous.length) throw erreur(`${ou} (${t.cle}) : il faut au moins une sous-rubrique.`);
    const clesSous = new Set<string>();
    sous.forEach((s: Record<string, unknown>, j) => {
      const ouSous = `${ou} (${t.cle}), sous-rubrique n° ${j + 1}`;
      if (typeof s?.cle !== "string" || !CLE.test(s.cle)) throw erreur(`${ouSous} : « cle » doit être en minuscules, sans accent ni espace.`);
      if (clesSous.has(s.cle)) throw erreur(`${ouSous} : la clé « ${s.cle} » est utilisée deux fois dans ce thème.`);
      clesSous.add(s.cle);
      if (typeof s.nom !== "string" || !s.nom.trim() || s.nom.length > 60) throw erreur(`${ouSous} : « nom » doit être un texte de 60 caractères au plus.`);
    });
  });
  return c as ConfigRessources;
}
