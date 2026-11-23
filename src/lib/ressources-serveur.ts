import "server-only";
import type { Utilisateur } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { semaineAnciennete, type Commentaire, type Media, type Ressource, type Suivi } from "./ressources";

const CHAMPS = "id, theme, sous_rubrique, titre, type, semaine_deblocage, ordre";

const estRessource = (r: Record<string, unknown>): r is Ressource =>
  typeof r.id === "string" &&
  typeof r.theme === "string" &&
  typeof r.sous_rubrique === "string" &&
  typeof r.titre === "string" &&
  (r.type === "pdf" || r.type === "video") &&
  typeof r.semaine_deblocage === "number" &&
  typeof r.ordre === "number";

/** Semaine d'ancienneté du membre ; null pour l'équipe du Club (tout est débloqué). */
export function semaineDuMembre(u: Pick<Utilisateur, "role" | "dateInscription">, aujourdhui = dateDuJourParis()): number | null {
  if (u.role !== "membre") return null;
  if (!u.dateInscription) return 1;
  return semaineAnciennete(dateDuJourParis(new Date(u.dateInscription)), aujourdhui);
}

/** Catalogue (titres, types, semaines de déblocage) : jamais les liens ni les fichiers. */
export async function lireCatalogue(): Promise<Ressource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ressources").select(CHAMPS);
  if (error) console.error("Lecture des ressources impossible", error.code, error.message);
  return ((data ?? []) as Record<string, unknown>[]).filter(estRessource);
}

/** Un contenu du catalogue, ou null. */
export async function lireRessource(id: string): Promise<Ressource | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("ressources").select(CHAMPS).eq("id", id).maybeSingle();
  return data && estRessource(data as Record<string, unknown>) ? (data as Ressource) : null;
}

/** Favoris et contenus vus ou téléchargés par le membre, par identifiant de contenu. */
export async function lireSuivis(membreId: string): Promise<Record<string, Suivi>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("suivi_ressources").select("ressource_id, favori, consulte_le").eq("membre_id", membreId);
  if (error) console.error("Lecture du suivi des ressources impossible", error.code, error.message);
  return Object.fromEntries((data ?? []).map((s) => [s.ressource_id as string, { favori: !!s.favori, consulte_le: (s.consulte_le as string | null) ?? null }]));
}

/** Lien vidéo et présence du PDF des contenus débloqués pour la personne connectée (calculé par la base). */
export async function lireMedias(): Promise<Record<string, Media>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ressources_medias");
  if (error) console.error("Lecture des médias impossible", error.code, error.message);
  return Object.fromEntries(
    ((data ?? []) as { id: string; youtube_id: string | null; fichier_disponible: boolean }[]).map((m) => [
      m.id,
      { youtube_id: m.youtube_id, fichier_disponible: !!m.fichier_disponible },
    ]),
  );
}

/** Commentaires d'une vidéo, du plus ancien au plus récent (vides si la vidéo est verrouillée). */
export async function lireCommentaires(ressourceId: string, membreId: string): Promise<Commentaire[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commentaires_ressources")
    .select("id, membre_id, auteur, auteur_role, texte, cree_le")
    .eq("ressource_id", ressourceId)
    .order("cree_le", { ascending: true });
  if (error) console.error("Lecture des commentaires impossible", error.code, error.message);
  return (data ?? []).map((c) => ({
    id: c.id as string,
    auteur: c.auteur as string,
    auteur_role: c.auteur_role as string,
    texte: c.texte as string,
    cree_le: c.cree_le as string,
    mien: c.membre_id === membreId,
  }));
}
