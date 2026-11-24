"use server";

import { aAccesEspace, utilisateurConnecte } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { erreurJour, lireRessentiSaisi } from "@/lib/ressenti";
import { createClient } from "@/lib/supabase/server";

export type ResultatRessenti = { erreur?: string };

const IMPOSSIBLE = "Impossible d'enregistrer pour le moment. Réessaie dans un instant.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Vérifie le membre, la séance et le jour ; la sécurité par ligne limite ensuite tout à ses propres ressentis. */
async function verifier(seanceId: unknown, jour: unknown) {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return { erreur: "Ta session a expiré. Reconnecte-toi pour enregistrer ta séance." } as const;
  if (!aAccesEspace(utilisateur)) return { erreur: "Ton accès au Club n'est plus actif." } as const;
  if (typeof seanceId !== "string" || !UUID.test(seanceId)) return { erreur: "Cette séance est introuvable." } as const;
  const erreur = erreurJour(jour, dateDuJourParis());
  if (erreur) return { erreur } as const;
  const supabase = await createClient();
  const { data: seance } = await supabase.from("seances").select("id").eq("id", seanceId).maybeSingle();
  if (!seance) return { erreur: "Cette séance est introuvable." } as const;
  return { utilisateur, supabase, seanceId, jour: jour as string } as const;
}

function echec(contexte: string, error: { code?: string; message: string }): ResultatRessenti {
  console.error(contexte, error.code, error.message);
  return { erreur: IMPOSSIBLE };
}

/** Marque la séance de ce jour comme faite (faite = true) ou l'annule, ressenti compris (faite = false). */
export async function marquerSeance(seanceId: unknown, jour: unknown, faite: unknown): Promise<ResultatRessenti> {
  const v = await verifier(seanceId, jour);
  if ("erreur" in v) return { erreur: v.erreur };
  const ligne = { membre_id: v.utilisateur.id, seance_id: v.seanceId, date_seance: v.jour };
  if (faite === true) {
    // Déjà marquée (double toucher) : rien à faire.
    const { error } = await v.supabase.from("ressentis").upsert(ligne, { onConflict: "membre_id,seance_id,date_seance", ignoreDuplicates: true });
    return error ? echec("Séance faite : enregistrement impossible", error) : {};
  }
  const { error } = await v.supabase.from("ressentis").delete().match(ligne);
  return error ? echec("Séance faite : annulation impossible", error) : {};
}

/** Enregistre le ressenti (RPE, commentaire) ; la séance est marquée faite au passage. */
export async function enregistrerRessenti(seanceId: unknown, jour: unknown, saisie: unknown): Promise<ResultatRessenti> {
  const v = await verifier(seanceId, jour);
  if ("erreur" in v) return { erreur: v.erreur };
  const lu = lireRessentiSaisi(saisie);
  if ("erreur" in lu) return { erreur: lu.erreur };

  const ligne = { membre_id: v.utilisateur.id, seance_id: v.seanceId, date_seance: v.jour };
  const { error: errFaite } = await v.supabase.from("ressentis").upsert(ligne, { onConflict: "membre_id,seance_id,date_seance", ignoreDuplicates: true });
  if (errFaite) return echec("Ressenti : enregistrement impossible", errFaite);
  const { error } = await v.supabase
    .from("ressentis")
    .update({ ...lu.ressenti, mis_a_jour: new Date().toISOString() })
    .match(ligne);
  return error ? echec("Ressenti : enregistrement impossible", error) : {};
}
