import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AthleteCoach, SeanceCoach } from "./coach";

/** Athlètes vus par le coach (la base refuse à qui n'est ni coach ni admin) : jamais d'e-mail ni d'abonnement. */
export async function lireAthletes(): Promise<AthleteCoach[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("coach_athletes");
  if (error) console.error("Lecture des athlètes impossible", error.code, error.message);
  return (data ?? []) as AthleteCoach[];
}

/** Séances faites par un athlète, avec son ressenti (lecture seule), de la plus récente à la plus ancienne. */
export async function lireSeancesAthlete(membreId: string): Promise<SeanceCoach[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ressentis")
    .select("date_seance, rpe, douleur, commentaire, seances(sport, titre)")
    .eq("membre_id", membreId)
    .order("date_seance", { ascending: false })
    .limit(300);
  if (error) console.error("Lecture des séances de l'athlète impossible", error.code, error.message);
  return (data ?? []).map((r) => {
    const s = r.seances as { sport?: string; titre?: string } | { sport?: string; titre?: string }[] | null;
    const seance = Array.isArray(s) ? s[0] : s;
    return {
      date: r.date_seance as string,
      sport: seance?.sport ?? null,
      titre: seance?.titre ?? null,
      rpe: typeof r.rpe === "number" ? r.rpe : null,
      douleur: r.douleur === true,
      commentaire: (r.commentaire as string | null) ?? null,
    };
  });
}
