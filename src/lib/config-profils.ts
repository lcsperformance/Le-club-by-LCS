/**
 * Vérification de config/profils.json (textes des niveaux et des profils).
 * Ce module n'importe rien : il est aussi utilisé par scripts/verifier-config.mjs.
 * Les clés correspondent aux valeurs de la base (types « niveau » et « profil »).
 */

export const NIVEAUX = ["finisher", "challenger", "performer"] as const;
export const PROFILS = ["extensif", "intensif"] as const;
export type Niveau = (typeof NIVEAUX)[number];
export type Profil = (typeof PROFILS)[number];

export type ConfigProfils = {
  niveaux: Record<Niveau, { libelle: string }>;
  profils: Record<Profil, { libelle: string; description: string }>;
};

const texte = (x: unknown) => typeof x === "string" && x.trim().length > 0;

export function validerConfigProfils(c: unknown): ConfigProfils {
  const erreur = (m: string) => new Error(`config/profils.json : ${m}`);
  if (!c || typeof c !== "object") throw erreur("le fichier est vide ou illisible.");
  const o = c as Record<string, Record<string, Record<string, unknown>> | undefined>;

  for (const n of NIVEAUX) {
    if (!texte(o.niveaux?.[n]?.libelle)) throw erreur(`il manque le texte « libelle » du niveau « ${n} ».`);
  }
  for (const p of PROFILS) {
    if (!texte(o.profils?.[p]?.libelle)) throw erreur(`il manque le texte « libelle » du profil « ${p} ».`);
    if (!texte(o.profils?.[p]?.description)) throw erreur(`il manque le texte « description » du profil « ${p} ».`);
  }
  const inconnus = [
    ...Object.keys(o.niveaux ?? {}).filter((k) => !(NIVEAUX as readonly string[]).includes(k)),
    ...Object.keys(o.profils ?? {}).filter((k) => !(PROFILS as readonly string[]).includes(k)),
  ];
  if (inconnus.length) {
    throw erreur(`clé inconnue « ${inconnus[0]} » : ne renommez pas les clés, seulement les textes.`);
  }
  return o as unknown as ConfigProfils;
}
