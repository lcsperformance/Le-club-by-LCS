"use server";

import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/auth";
import { VERSION_TEXTES } from "@/lib/legal";
import { cheminAccueil } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type EtatConditions = { erreur?: string };

/** Note l'accord du membre (case cochée), puis ouvre le Club. */
export async function accepterConditions(_: EtatConditions, formData: FormData): Promise<EtatConditions> {
  const u = await utilisateurConnecte();
  if (!u) redirect("/connexion");
  if (formData.get("accord") !== "oui") {
    return { erreur: "Coche la case pour accepter les CGV et la politique de confidentialité." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("accepter_conditions", { version: VERSION_TEXTES });
  if (error) {
    console.error("Acceptation des conditions impossible", error.code, error.message);
    return { erreur: "Impossible d'enregistrer ton accord pour le moment. Réessaie dans un instant." };
  }
  redirect(cheminAccueil(u.role));
}
