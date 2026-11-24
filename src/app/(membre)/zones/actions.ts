"use server";

import { utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bornesDuClub, SPORTS, type Sport } from "@/lib/zones";
import { memesBornes, validerBornesPerso } from "@/lib/zones-perso";

export type ResultatZones = { erreur?: string };

/**
 * Enregistre les bornes personnalisées d'un sport.
 * Si elles sont identiques à celles du Club, la personnalisation est supprimée :
 * le membre suivra de nouveau config/zones.json, même si Martin le modifie.
 */
export async function enregistrerZones(sport: string, bornes: unknown): Promise<ResultatZones> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return { erreur: "Ta session a expiré. Reconnecte-toi pour enregistrer tes zones." };

  if (!SPORTS.some((s) => s.cle === sport)) return { erreur: "Sport inconnu." };
  const club = bornesDuClub(sport as Sport);

  const valides = validerBornesPerso(bornes, club);
  if (!valides) return { erreur: "Ces bornes ne sont pas valables. Recharge la page et réessaie." };

  const supabase = await createClient();
  const { error } = memesBornes(valides, club)
    ? await supabase.from("zones").delete().eq("membre_id", utilisateur.id).eq("sport", sport)
    : await supabase
        .from("zones")
        .upsert(
          { membre_id: utilisateur.id, sport, bornes: valides, mis_a_jour: new Date().toISOString() },
          { onConflict: "membre_id,sport" },
        );

  if (error) {
    console.error("Enregistrement des zones impossible", error.code, error.message);
    return { erreur: "Impossible d'enregistrer tes zones pour le moment. Réessaie dans un instant." };
  }
  return {};
}
