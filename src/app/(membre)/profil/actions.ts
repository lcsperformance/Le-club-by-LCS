"use server";

import { utilisateurConnecte } from "@/lib/auth";
import { estNiveau, estProfil } from "@/lib/profils";
import { createClient } from "@/lib/supabase/server";

export type ResultatChoix = { erreur?: string };

/** Enregistre le niveau ou le profil choisi par le membre, sur sa propre fiche uniquement. */
export async function enregistrerChoix(champ: "niveau" | "profil", valeur: string): Promise<ResultatChoix> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return { erreur: "Ta session a expiré. Reconnecte-toi pour enregistrer ton choix." };

  const valide = champ === "niveau" ? estNiveau(valeur) : champ === "profil" ? estProfil(valeur) : false;
  if (!valide) return { erreur: "Ce choix n'existe pas." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("membres")
    .update({ [champ]: valeur })
    .eq("id", utilisateur.id);

  if (error) {
    console.error("Enregistrement du choix impossible", error.code, error.message);
    return { erreur: "Impossible d'enregistrer ton choix pour le moment. Réessaie dans un instant." };
  }
  return {};
}
