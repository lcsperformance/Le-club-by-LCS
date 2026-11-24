import "server-only";
import type { Utilisateur } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { lireSeance, lireSemaine, semaineDuProgramme, type SeancePrevue, type SemaineProgramme, type Seance } from "./programme";
import type { Saison } from "./saison";

const CHAMPS_SEANCE = "id, sport, titre, duree_minutes, blocs_seance(ordre, libelle, detail, zone)";

/*
 * Le programme n'est PAS lisible par les membres dans la base (migration 20261215000000) : seul ce
 * fichier le lit, avec la clé secrète, et seulement après que la page a vérifié la personne
 * (exigerRole) et calculé la semaine autorisée. Il ne renvoie jamais que la semaine demandée,
 * au niveau et au profil du membre, ou une séance de son programme.
 */

/**
 * Séances de la semaine qui commence ce lundi, pour le niveau et le profil du membre.
 * null tant que le membre n'a pas choisi son niveau et son profil.
 */
export async function lireSemaineProgramme(
  utilisateur: Pick<Utilisateur, "niveau" | "profil">,
  saison: Saison,
  lundi: string,
): Promise<{ semaine: SemaineProgramme; seances: SeancePrevue[] } | null> {
  const { niveau, profil } = utilisateur;
  if (!niveau || !profil) return null;
  const supabase = createAdminClient();

  // Nombre de semaines du fil rouge écrites pour ce niveau et ce profil (elles tournent en boucle).
  let semainesFilRouge = 1;
  if (!saison.enCours) {
    const { data } = await supabase
      .from("programme")
      .select("semaine")
      .eq("phase", "fil_rouge")
      .eq("niveau", niveau)
      .eq("profil", profil)
      .order("semaine", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (typeof data?.semaine === "number") semainesFilRouge = data.semaine;
  }

  const semaine = semaineDuProgramme(saison, lundi, semainesFilRouge);
  const { data, error } = await supabase
    .from("programme")
    .select(`jour, ordre, seances(${CHAMPS_SEANCE})`)
    .eq("phase", semaine.phase)
    .eq("semaine", semaine.semaine)
    .eq("niveau", niveau)
    .eq("profil", profil);
  if (error) console.error("Lecture du programme impossible", error.code, error.message);
  return { semaine, seances: lireSemaine(data) };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Une séance et ses blocs, ou null si elle n'existe pas, ou si elle ne fait pas partie du programme
 * du niveau et du profil du membre (le coach et l'admin voient toutes les séances).
 */
export async function lireSeanceProgramme(
  id: string,
  utilisateur: Pick<Utilisateur, "role" | "niveau" | "profil">,
): Promise<Seance | null> {
  if (!UUID.test(id)) return null;
  const supabase = createAdminClient();
  if (utilisateur.role === "membre") {
    if (!utilisateur.niveau || !utilisateur.profil) return null;
    const { data: prevue } = await supabase
      .from("programme")
      .select("id")
      .eq("seance_id", id)
      .eq("niveau", utilisateur.niveau)
      .eq("profil", utilisateur.profil)
      .limit(1)
      .maybeSingle();
    if (!prevue) return null;
  }
  const { data, error } = await supabase.from("seances").select(CHAMPS_SEANCE).eq("id", id).maybeSingle();
  if (error) console.error("Lecture de la séance impossible", error.code, error.message);
  return lireSeance(data);
}

/** Séances marquées faites par le membre entre ces deux jours, sous la forme « AAAA-MM-JJ|id de séance ». */
export async function lireSeancesFaites(membreId: string, du: string, au: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ressentis")
    .select("seance_id, date_seance")
    .eq("membre_id", membreId)
    .gte("date_seance", du)
    .lte("date_seance", au);
  if (error) console.error("Lecture des séances faites impossible", error.code, error.message);
  return (data ?? []).filter((r) => typeof r.seance_id === "string").map((r) => `${r.date_seance}|${r.seance_id}`);
}
