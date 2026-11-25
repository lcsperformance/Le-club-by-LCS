/** Avantages du Club : remises des partenaires. Règles testables, sans base. */

export type Partenaire = {
  id: string;
  nom: string;
  /** En pourcentage : 15 = « −15 % ». */
  remise: number;
  description: string;
  code: string;
  lien: string | null;
  ordre: number;
  affiche: boolean;
  /** Code d'exemple, à remplacer par le vrai. */
  exemple: boolean;
};

/** « −15 % » (signe moins et espace insécable, à la française). */
export const formatRemise = (remise: number) => `−${remise} %`;

export const initialePartenaire = (nom: string) => (nom.trim().charAt(0) || "?").toLocaleUpperCase("fr-FR");

const CODE = /^[A-Za-z0-9_!?-]{3,30}$/;

export type ChampPartenaire = "nom" | "remise" | "description" | "code" | "lien" | "ordre";
export type PartenaireSaisi = Omit<Partenaire, "id" | "exemple">;

const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const entier = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v.replace(",", ".")) : NaN);

/** Vérifie le formulaire de l'admin ; les erreurs sont rattachées à leur champ. */
export function lirePartenaire(s: Record<string, unknown>): { partenaire: PartenaireSaisi } | { erreurs: Partial<Record<ChampPartenaire, string>> } {
  const erreurs: Partial<Record<ChampPartenaire, string>> = {};
  const nom = texte(s.nom);
  if (!nom || nom.length > 40) erreurs.nom = "Le nom fait entre 1 et 40 caractères.";
  const remise = entier(s.remise);
  if (!Number.isInteger(remise) || remise < 1 || remise > 90) erreurs.remise = "La remise est un nombre entier de 1 à 90 (en %).";
  const description = texte(s.description);
  if (!description || description.length > 80) erreurs.description = "La description fait entre 1 et 80 caractères (ex. « sur les produits Pyrène »).";
  const code = texte(s.code);
  if (!CODE.test(code)) erreurs.code = "Le code fait 3 à 30 caractères : lettres, chiffres, tirets, « ! » et « ? » (sans espace ni accent).";
  const lien = texte(s.lien) || null;
  if (lien && (!/^https:\/\/\S+$/.test(lien) || lien.length > 300)) erreurs.lien = "Le lien doit commencer par https://";
  const ordre = entier(s.ordre);
  if (!Number.isInteger(ordre) || ordre < 1 || ordre > 99) erreurs.ordre = "L'ordre est un nombre entier entre 1 et 99.";
  if (Object.keys(erreurs).length) return { erreurs };
  return { partenaire: { nom, remise, description, code, lien, ordre, affiche: s.affiche !== false } };
}

/** Partenaires dans l'ordre (puis par nom). */
export const trierPartenaires = (liste: Partenaire[]) => [...liste].sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom, "fr"));
