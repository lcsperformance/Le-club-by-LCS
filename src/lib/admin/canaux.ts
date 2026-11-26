/**
 * Canaux du Club gérés par l'admin : règles testables (saisie, adresse tirée du nom).
 * La base vérifie tout à nouveau (admin_creer_canal, admin_modifier_canal, admin_supprimer_canal).
 */
export type CanalSaisi = { nom: string; description: string; lecture_seule: boolean; ordre: number };

/** Adresses déjà prises par des pages du Club (/club/questions, /club/agenda). */
export const ADRESSES_RESERVEES = ["questions", "agenda"] as const;

/** Le canal « annonces » sert aux notifications : jamais supprimé, toujours en lecture seule. */
export const CANAL_PROTEGE = "annonces";

const texte = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

export function lireCanal(saisie: Record<string, unknown>): { canal: CanalSaisi } | { erreur: string } {
  const nom = texte(saisie.nom);
  if (!nom || nom.length > 30) return { erreur: "Le nom du canal doit faire de 1 à 30 caractères." };
  const description = texte(saisie.description);
  if (!description || description.length > 80) return { erreur: "La description doit faire de 1 à 80 caractères." };
  const ordre = Number(saisie.ordre);
  if (!Number.isInteger(ordre) || ordre < 1 || ordre > 99) return { erreur: "L'ordre est un nombre entier entre 1 et 99." };
  return { canal: { nom, description, lecture_seule: saisie.lecture_seule === true, ordre } };
}

/**
 * Adresse d'un nouveau canal tirée de son nom (« Sorties longues » → « sorties-longues ») :
 * minuscules sans accents, mots reliés par des tirets, 30 caractères au plus.
 * null si le nom ne donne aucune adresse utilisable, ou si elle est prise ou réservée.
 */
export function adresseCanal(nom: string, existantes: readonly string[]): string | null {
  const cle = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
  if (!cle) return null;
  if (existantes.includes(cle) || (ADRESSES_RESERVEES as readonly string[]).includes(cle)) return null;
  return cle;
}

/** La suppression exige de retaper exactement le nom du canal. */
export const confirmationValide = (nomCanal: string, saisie: string) => saisie.trim() === nomCanal;
