/**
 * Gestion des Ressources par l'admin : règles testables, sans base.
 * - Lien YouTube collé sous n'importe quelle forme → identifiant de 11 caractères.
 * - Clé d'un thème ou d'une sous-rubrique tirée de son nom (« Récupération » → « recuperation »).
 * - Vérification des formulaires (thème, sous-rubrique, contenu) et des fichiers (PDF, miniature).
 */
import { estIcone, type IconeTheme, type Theme, type TypeRessource } from "@/lib/ressources";

export const TAILLE_MAX_PDF = 50 * 1024 * 1024; // limite d'un fichier sur l'offre gratuite de Supabase
export const TAILLE_MAX_MINIATURE = 2 * 1024 * 1024;
export const TYPES_MINIATURE = ["image/jpeg", "image/png", "image/webp"] as const;
export const SEMAINE_MAX = 520;

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const HOTES_YOUTUBE = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"];

/** Identifiant d'une vidéo YouTube à partir d'un lien (youtu.be, watch?v=, shorts, embed, live) ou de l'identifiant seul. */
export function lireLienYoutube(saisie: unknown): { id: string } | { erreur: string } {
  const texte = typeof saisie === "string" ? saisie.trim() : "";
  const erreur = { erreur: "Ce lien n'est pas une vidéo YouTube. Copie le lien de partage de la vidéo (ex. https://youtu.be/…)." };
  if (ID_YOUTUBE.test(texte)) return { id: texte };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(texte) ? texte : `https://${texte}`);
  } catch {
    return erreur;
  }
  const hote = url.hostname.toLowerCase();
  let id: string | null = null;
  if (hote === "youtu.be" || hote === "www.youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (HOTES_YOUTUBE.includes(hote)) {
    const morceaux = url.pathname.split("/").filter(Boolean);
    if (morceaux[0] === "watch") id = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(morceaux[0])) id = morceaux[1] ?? null;
  }
  return id && ID_YOUTUBE.test(id) ? { id } : erreur;
}

const RESERVEES = ["favoris", "contenu"];

/** Clé tirée d'un nom : minuscules sans accent, « _ » entre les mots, unique parmi les clés existantes. */
export function cleDepuisNom(nom: string, existantes: readonly string[], longueurMax = 30): string {
  const base =
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/[^a-z]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, longueurMax - 3)
      .replace(/_+$/g, "") || "rubrique";
  const prises = new Set([...existantes, ...RESERVEES]);
  if (!prises.has(base)) return base;
  // Les clés n'acceptent que des lettres et « _ » : les doublons reçoivent un suffixe « _b », « _c »…
  for (const lettre of "bcdefghijklmnopqrstuvwxyz") {
    const cle = `${base}_${lettre}`;
    if (!prises.has(cle)) return cle;
  }
  return `${base}_${Date.now().toString(36).replace(/[^a-z]/g, "")}`;
}

const entier = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN);
const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function lireOrdre(v: unknown): number | null {
  const n = entier(v);
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : null;
}

export type ThemeSaisi = { nom: string; icone: IconeTheme; ordre: number };

export function lireTheme(saisie: Record<string, unknown>): { theme: ThemeSaisi } | { erreur: string } {
  const nom = texte(saisie.nom);
  if (!nom || nom.length > 40) return { erreur: "Le nom du thème doit faire entre 1 et 40 caractères." };
  if (!estIcone(saisie.icone)) return { erreur: "Choisis une icône." };
  const ordre = lireOrdre(saisie.ordre);
  if (!ordre) return { erreur: "L'ordre est un nombre entier entre 1 et 99." };
  return { theme: { nom, icone: saisie.icone, ordre } };
}

export function lireSousRubrique(saisie: Record<string, unknown>): { sousRubrique: { nom: string; ordre: number } } | { erreur: string } {
  const nom = texte(saisie.nom);
  if (!nom || nom.length > 60) return { erreur: "Le nom de la sous-rubrique doit faire entre 1 et 60 caractères." };
  const ordre = lireOrdre(saisie.ordre);
  if (!ordre) return { erreur: "L'ordre est un nombre entier entre 1 et 99." };
  return { sousRubrique: { nom, ordre } };
}

export type ContenuSaisi = {
  theme: string;
  sous_rubrique: string;
  titre: string;
  type: TypeRessource;
  /** Identifiant YouTube (vidéo) ; null = vidéo pas encore en ligne. */
  youtube_id: string | null;
  semaine_deblocage: number;
  ordre: number;
};

export type ChampContenu = "theme" | "sous_rubrique" | "titre" | "type" | "lien" | "semaine" | "ordre";

/** Vérifie le formulaire d'un contenu ; les erreurs sont rattachées à leur champ. */
export function lireContenu(
  saisie: Record<string, unknown>,
  themes: Theme[],
): { contenu: ContenuSaisi } | { erreurs: Partial<Record<ChampContenu, string>> } {
  const erreurs: Partial<Record<ChampContenu, string>> = {};
  const theme = themes.find((t) => t.cle === saisie.theme);
  if (!theme) erreurs.theme = "Choisis un thème.";
  const sous = theme?.sous_rubriques.find((s) => s.cle === saisie.sous_rubrique);
  if (theme && !sous) erreurs.sous_rubrique = "Choisis une sous-rubrique de ce thème.";
  const titre = texte(saisie.titre);
  if (!titre || titre.length > 120) erreurs.titre = "Le titre doit faire entre 1 et 120 caractères.";
  const type = saisie.type === "pdf" || saisie.type === "video" ? saisie.type : null;
  if (!type) erreurs.type = "Choisis PDF ou vidéo.";
  let youtube_id: string | null = null;
  if (type === "video" && texte(saisie.lien)) {
    const lu = lireLienYoutube(saisie.lien);
    if ("erreur" in lu) erreurs.lien = lu.erreur;
    else youtube_id = lu.id;
  }
  const semaine = entier(saisie.semaine);
  if (!Number.isInteger(semaine) || semaine < 1 || semaine > SEMAINE_MAX) {
    erreurs.semaine = `La semaine de déblocage est un nombre entier entre 1 et ${SEMAINE_MAX} (1 = dès l'inscription).`;
  }
  const ordre = lireOrdre(saisie.ordre);
  if (!ordre) erreurs.ordre = "L'ordre est un nombre entier entre 1 et 99.";
  if (Object.keys(erreurs).length) return { erreurs };
  return {
    contenu: { theme: theme!.cle, sous_rubrique: sous!.cle, titre, type: type!, youtube_id, semaine_deblocage: semaine, ordre: ordre! },
  };
}

/** Vérifie un fichier choisi avant de le téléverser. */
export function erreurFichier(f: { type: string; size: number; name: string }, genre: "pdf" | "miniature"): string | null {
  if (genre === "pdf") {
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) return "Choisis un fichier PDF.";
    if (f.size > TAILLE_MAX_PDF) return "Ce PDF dépasse 50 Mo : allège-le (export « taille réduite ») avant de le déposer.";
    return null;
  }
  if (!(TYPES_MINIATURE as readonly string[]).includes(f.type)) return "La miniature doit être une image JPG, PNG ou WebP.";
  if (f.size > TAILLE_MAX_MINIATURE) return "Cette image dépasse 2 Mo : choisis-en une plus légère.";
  return null;
}

/** Chemin d'un nouveau fichier dans le stockage : « theme/identifiant.pdf » (jamais le nom d'origine). */
export function nouveauChemin(theme: string, genre: "pdf" | "miniature", typeImage: string, aleatoire: string): string {
  const extension = genre === "pdf" ? "pdf" : typeImage === "image/png" ? "png" : typeImage === "image/webp" ? "webp" : "jpg";
  return `${theme}/${aleatoire}.${extension}`;
}

/** Ligne d'un contenu dans la liste de l'admin : « Vidéo · semaine 3 », et ce qu'il manque (« lien à ajouter »). */
export function resumeContenu(c: { type: TypeRessource; semaine_deblocage: number; youtube_id: string | null; fichier: string | null }) {
  return {
    texte: `${c.type === "video" ? "Vidéo" : "PDF"} · semaine ${c.semaine_deblocage}`,
    manque: c.type === "video" ? (c.youtube_id ? null : "lien à ajouter") : c.fichier ? null : "PDF à déposer",
  };
}
