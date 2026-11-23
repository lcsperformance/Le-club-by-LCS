import "server-only";
import type { Utilisateur } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { lireSeance, lireSemaine, semaineDuProgramme, type SeancePrevue, type SemaineProgramme, type Seance } from "./programme";
import type { Saison } from "./saison";

const CHAMPS_SEANCE = "id, sport, titre, duree_minutes, blocs_seance(ordre, libelle, detail, zone)";

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
  const supabase = await createClient();

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

/** Une séance et ses blocs, ou null si elle n'existe pas. */
export async function lireSeanceProgramme(id: string): Promise<Seance | null> {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("seances").select(CHAMPS_SEANCE).eq("id", id).maybeSingle();
  if (error) console.error("Lecture de la séance impossible", error.code, error.message);
  return lireSeance(data);
}
