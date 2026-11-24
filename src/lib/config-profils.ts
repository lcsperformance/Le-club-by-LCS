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
  /** Seuils de la suggestion de profil (FTP / puissance max 5 min, en %). */
  suggestion: { extensif_a_partir_de: number; intensif_en_dessous_de: number };
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
  const s = (c as Record<string, unknown>).suggestion as Record<string, unknown> | undefined;
  const pourcentage = (x: unknown) => Number.isInteger(x) && (x as number) >= 50 && (x as number) <= 100;
  if (!pourcentage(s?.extensif_a_partir_de) || !pourcentage(s?.intensif_en_dessous_de)) {
    throw erreur("« suggestion » : « extensif_a_partir_de » et « intensif_en_dessous_de » doivent être des nombres entiers entre 50 et 100.");
  }
  if ((s!.intensif_en_dessous_de as number) > (s!.extensif_a_partir_de as number)) {
    throw erreur("« suggestion » : « intensif_en_dessous_de » ne peut pas dépasser « extensif_a_partir_de ».");
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
