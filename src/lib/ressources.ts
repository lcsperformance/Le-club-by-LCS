/**
 * Ressources (maquette) : contenus PDF ou vidéo, classés par thème et sous-rubrique (tables
 * themes_ressources et sous_rubriques, gérées par l'admin), débloqués selon l'ancienneté du membre.
 * Règles testables, sans base.
 *
 * - Semaine d'ancienneté : 1 la première semaine après l'inscription, 2 la suivante… (jours à Paris).
 *   La base applique la même règle (fonction semaine_anciennete) : c'est elle qui protège les liens.
 * - Un contenu est débloqué si sa semaine de déblocage est atteinte ; l'équipe du Club voit tout.
 */
import { formatDateCourteFr, formatHeureFr } from "./dates";
import { ecartJours } from "./saison";

/** Icônes proposées pour un thème (dessins SVG de la maquette, composant IconeTheme). */
export const ICONES_THEMES = ["nutrition", "natation", "velo", "course", "preparation"] as const;
export type IconeTheme = (typeof ICONES_THEMES)[number];
export const estIcone = (v: unknown): v is IconeTheme => (ICONES_THEMES as readonly unknown[]).includes(v);

export type SousRubrique = { cle: string; nom: string; ordre: number };
/** Thème et ses sous-rubriques, dans l'ordre d'affichage. */
export type Theme = { cle: string; nom: string; icone: IconeTheme; ordre: number; sous_rubriques: SousRubrique[] };

export type TypeRessource = "pdf" | "video";

/** Contenu tel que lu par un membre (sans lien ni fichier). */
export type Ressource = {
  id: string;
  theme: string;
  sous_rubrique: string;
  titre: string;
  type: TypeRessource;
  semaine_deblocage: number;
  ordre: number;
};

/** Lien vidéo, présence du PDF et miniature (adresse complète), donnés par la base pour les seuls contenus débloqués. */
export type Media = { youtube_id: string | null; fichier_disponible: boolean; miniature?: string | null };

/** Suivi du membre : favori, et date à laquelle il a vu la vidéo ou téléchargé le PDF. */
export type Suivi = { favori: boolean; consulte_le: string | null };

export type Commentaire = { id: string; auteur: string; auteur_role: string; texte: string; cree_le: string; mien: boolean };

export const LONGUEUR_MAX_COMMENTAIRE = 500;

/** Semaine d'ancienneté le jour donné (AAAA-MM-JJ) pour une inscription ce jour-là. */
export function semaineAnciennete(inscription: string, aujourdhui: string): number {
  return Math.max(1, Math.floor(ecartJours(inscription, aujourdhui) / 7) + 1);
}

export const estDebloquee = (r: Pick<Ressource, "semaine_deblocage">, semaine: number | null) =>
  semaine === null || r.semaine_deblocage <= semaine;

export const themeParCle = (themes: Theme[], cle: string): Theme | undefined => themes.find((t) => t.cle === cle);

/** « Vidéo », « PDF », ou « Vidéo · débloqué semaine 6 ». */
export function metaRessource(r: Pick<Ressource, "type" | "semaine_deblocage">, debloquee: boolean): string {
  const type = r.type === "video" ? "Vidéo" : "PDF";
  return debloquee ? type : `${type} · débloqué semaine ${r.semaine_deblocage}`;
}

/** Badge sous le titre : « Vue » (vidéo) ou « Téléchargé » (PDF), ou rien. */
export const badgeSuivi = (r: Pick<Ressource, "type">, suivi?: Suivi) =>
  suivi?.consulte_le ? (r.type === "video" ? "Vue" : "Téléchargé") : null;

const parOrdre = (a: Ressource, b: Ressource) => a.ordre - b.ordre || a.titre.localeCompare(b.titre, "fr");

/** Cartes des thèmes : « 3 / 8 contenus » (débloqués / total). Les contenus d'un thème inconnu sont ignorés. */
export function cartesThemes(themes: Theme[], ressources: Ressource[], semaine: number | null) {
  return themes.map((t) => {
    const du = ressources.filter((r) => r.theme === t.cle && t.sous_rubriques.some((s) => s.cle === r.sous_rubrique));
    const ouverts = du.filter((r) => estDebloquee(r, semaine)).length;
    return { cle: t.cle, nom: t.nom, icone: t.icone, compte: `${ouverts} / ${du.length} contenu${du.length > 1 ? "s" : ""}` };
  });
}

/** Sous-rubriques d'un thème, dans leur ordre, avec leurs contenus (rubriques vides omises). */
export function sousRubriques(theme: Theme, ressources: Ressource[]) {
  return theme.sous_rubriques
    .map((s) => ({ cle: s.cle, nom: s.nom, contenus: ressources.filter((r) => r.theme === theme.cle && r.sous_rubrique === s.cle).sort(parOrdre) }))
    .filter((s) => s.contenus.length);
}

/** Favoris débloqués, dans l'ordre des thèmes puis des sous-rubriques. */
export function favoris(themes: Theme[], ressources: Ressource[], suivis: Record<string, Suivi>, semaine: number | null): Ressource[] {
  return themes.flatMap((t) =>
    sousRubriques(t, ressources).flatMap((s) => s.contenus.filter((r) => suivis[r.id]?.favori && estDebloquee(r, semaine))),
  );
}

/** Miniature d'une vidéo YouTube (servie par YouTube). */
export const miniatureYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
/** Lecteur YouTube sans cookies publicitaires. */
export const lecteurYoutube = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;

/** « 18/11/2026 · 14 h 30 ». */
export function dateCommentaire(iso: string): string {
  const d = new Date(iso);
  return `${formatDateCourteFr(d)} · ${formatHeureFr(d)}`;
}

/** Commentaire saisi : 1 à 500 caractères, espaces du début et de la fin retirés. */
export function lireCommentaire(saisie: unknown): { texte: string } | { erreur: string } {
  const texte = typeof saisie === "string" ? saisie.trim() : "";
  if (!texte) return { erreur: "Écris ton commentaire avant de le publier." };
  if (texte.length > LONGUEUR_MAX_COMMENTAIRE) return { erreur: `Ton commentaire dépasse ${LONGUEUR_MAX_COMMENTAIRE} caractères.` };
  return { texte };
}

/** Ce qu'affiche la carte d'un contenu (maquette). */
export type VueContenu = {
  id: string;
  titre: string;
  type: TypeRessource;
  meta: string;
  badge: string | null;
  debloquee: boolean;
  favori: boolean;
  /** Miniature d'une vidéo débloquée (celle choisie par l'admin, sinon celle de YouTube), sinon null (vignette du Club). */
  miniature: string | null;
};

export function vueContenu(r: Ressource, semaine: number | null, suivi?: Suivi, media?: Media): VueContenu {
  const debloquee = estDebloquee(r, semaine);
  return {
    id: r.id,
    titre: r.titre,
    type: r.type,
    meta: metaRessource(r, debloquee),
    badge: debloquee ? badgeSuivi(r, suivi) : null,
    debloquee,
    favori: debloquee && !!suivi?.favori,
    miniature: debloquee && r.type === "video" ? (media?.miniature ?? (media?.youtube_id ? miniatureYoutube(media.youtube_id) : null)) : null,
  };
}
