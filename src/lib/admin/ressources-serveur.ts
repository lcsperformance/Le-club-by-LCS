import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TypeRessource } from "@/lib/ressources";

/** Fiche complète d'un contenu pour l'admin (lien, fichier et miniature compris). */
export type ContenuAdmin = {
  id: string;
  theme: string;
  sous_rubrique: string;
  titre: string;
  type: TypeRessource;
  semaine_deblocage: number;
  ordre: number;
  youtube_id: string | null;
  fichier: string | null;
  miniature: string | null;
};

/** Tous les contenus (la base refuse à qui n'est pas admin). */
export async function lireContenusAdmin(): Promise<ContenuAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_ressources");
  if (error) console.error("Lecture des contenus (admin) impossible", error.code, error.message);
  return ((data ?? []) as ContenuAdmin[]).map((c) => ({
    id: c.id,
    theme: c.theme,
    sous_rubrique: c.sous_rubrique,
    titre: c.titre,
    type: c.type,
    semaine_deblocage: c.semaine_deblocage,
    ordre: c.ordre,
    youtube_id: c.youtube_id ?? null,
    fichier: c.fichier ?? null,
    miniature: c.miniature ?? null,
  }));
}

export type CommentaireAdmin = { id: string; ressource_id: string; titre: string; auteur: string; auteur_role: string; texte: string; cree_le: string };

/** Derniers commentaires, du plus récent au plus ancien, avec le titre de leur vidéo. */
export async function lireCommentairesAdmin(limite = 200): Promise<CommentaireAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commentaires_ressources")
    .select("id, ressource_id, auteur, auteur_role, texte, cree_le, ressources(titre)")
    .order("cree_le", { ascending: false })
    .limit(limite);
  if (error) console.error("Lecture des commentaires (admin) impossible", error.code, error.message);
  return (data ?? []).map((c) => {
    const r = c.ressources as { titre?: string } | { titre?: string }[] | null;
    const titre = (Array.isArray(r) ? r[0]?.titre : r?.titre) ?? "Vidéo";
    return {
      id: c.id as string,
      ressource_id: c.ressource_id as string,
      titre,
      auteur: c.auteur as string,
      auteur_role: c.auteur_role as string,
      texte: c.texte as string,
      cree_le: c.cree_le as string,
    };
  });
}
