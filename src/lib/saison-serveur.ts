import "server-only";
import { createClient } from "@/lib/supabase/server";
import { estBloc, type Objectif } from "./saison";

/**
 * Objectifs de saison d'un membre (dans n'importe quel ordre : organiserSaison() les classe).
 * La sécurité par ligne ne renvoie que ceux du membre connecté (ou tous pour le coach).
 */
export async function lireObjectifs(membreId: string): Promise<Objectif[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("objectifs").select("id, bloc, date_objectif, nom").eq("membre_id", membreId);
  if (error) {
    console.error("Lecture des objectifs impossible", error.code, error.message);
    return [];
  }
  return data.flatMap((o): Objectif[] =>
    estBloc(o.bloc) && typeof o.date_objectif === "string"
      ? [{ id: o.id, bloc: o.bloc, date_objectif: o.date_objectif, nom: typeof o.nom === "string" ? o.nom : null }]
      : [],
  );
}
