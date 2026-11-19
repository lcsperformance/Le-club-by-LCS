"use server";

import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { lireValeurs } from "@/lib/tests-depart";

export type EtatTests = { erreur?: string };

/** Enregistre les tests du jour ; une nouvelle saisie le même jour remplace la précédente. */
export async function enregistrerTests(_: EtatTests, formData: FormData): Promise<EtatTests> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) redirect("/connexion");

  const lu = lireValeurs(formData);
  if ("erreur" in lu) return { erreur: lu.erreur };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tests")
    .upsert(
      { membre_id: utilisateur.id, date_test: dateDuJourParis(), ...lu.valeurs },
      { onConflict: "membre_id,date_test" },
    );

  if (error) {
    console.error("Enregistrement des tests impossible", error.code, error.message);
    return { erreur: "Impossible d'enregistrer tes tests pour le moment. Réessaie dans un instant." };
  }

  redirect("/zones");
}
