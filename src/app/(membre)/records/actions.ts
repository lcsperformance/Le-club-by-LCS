"use server";

import { aAccesEspace, utilisateurConnecte } from "@/lib/auth";
import { EPREUVES, lireRecords, type Epreuve } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";

export type ResultatRecords = { erreur?: string; erreurs?: Partial<Record<Epreuve, string>> };

const IMPOSSIBLE = "Impossible d'enregistrer tes records pour le moment. Réessaie dans un instant.";

/** Enregistre les records saisis ; un champ vide efface le record de l'épreuve. Uniquement ceux du membre connecté. */
export async function enregistrerRecords(saisies: unknown): Promise<ResultatRecords> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return { erreur: "Ta session a expiré. Reconnecte-toi pour enregistrer tes records." };
  if (!aAccesEspace(utilisateur)) return { erreur: "Ton accès au Club n'est plus actif." };

  const lu = lireRecords(saisies);
  if ("erreurs" in lu) return { erreurs: lu.erreurs };

  const aGarder = EPREUVES.filter((e) => lu.records[e.cle] !== null).map((e) => ({
    membre_id: utilisateur.id,
    epreuve: e.cle,
    duree_secondes: lu.records[e.cle] as number,
    mis_a_jour: new Date().toISOString(),
  }));
  const aEffacer = EPREUVES.filter((e) => lu.records[e.cle] === null).map((e) => e.cle);

  const supabase = await createClient();
  if (aGarder.length) {
    const { error } = await supabase.from("records").upsert(aGarder, { onConflict: "membre_id,epreuve" });
    if (error) {
      console.error("Enregistrement des records impossible", error.code, error.message);
      return { erreur: IMPOSSIBLE };
    }
  }
  if (aEffacer.length) {
    const { error } = await supabase.from("records").delete().eq("membre_id", utilisateur.id).in("epreuve", aEffacer);
    if (error) {
      console.error("Suppression des records impossible", error.code, error.message);
      return { erreur: IMPOSSIBLE };
    }
  }
  return {};
}
