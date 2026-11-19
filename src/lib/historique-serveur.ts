import "server-only";
import { utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { COLONNE_PAR_SPORT, extraireHistorique, type PointHistorique, type SportHistorique } from "./historique";

/**
 * Historique d'un sport, classé par date (de la plus ancienne à la plus récente).
 *
 * Sans `membreId` : celui de la personne connectée. Avec `membreId` : celui d'un athlète,
 * lisible seulement par un coach ou un admin — la sécurité par ligne de Supabase renvoie
 * une liste vide à tout autre membre.
 */
export async function historiqueSport(sport: SportHistorique, membreId?: string): Promise<PointHistorique[]> {
  const id = membreId ?? (await utilisateurConnecte())?.id;
  if (!id) return [];

  const colonne = COLONNE_PAR_SPORT[sport];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tests")
    .select(`date_test, ${colonne}`)
    .eq("membre_id", id)
    .not(colonne, "is", null)
    .order("date_test", { ascending: true });

  if (error) {
    console.error("Lecture de l'historique impossible", error.code, error.message);
    return [];
  }
  return extraireHistorique((data ?? []) as unknown as Parameters<typeof extraireHistorique>[0], sport);
}
