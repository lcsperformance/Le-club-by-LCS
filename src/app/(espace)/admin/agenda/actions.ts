"use server";

import { lireEvenement, type ChampEvenement } from "@/lib/agenda";
import { utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Agenda du Club : seul l'admin écrit (vérifié ici et par la base). */
export type ResultatAgenda = { erreur?: string; erreurs?: Partial<Record<ChampEvenement, string>> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMPOSSIBLE = "Impossible d'enregistrer pour le moment. Réessaie dans un instant.";

async function admin() {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: "Ta session a expiré. Reconnecte-toi." } as const;
  if (u.role !== "admin") return { erreur: "Action réservée à un administrateur." } as const;
  return { supabase: await createClient() } as const;
}

/** Ajoute (id absent) ou modifie un événement. Dates et heures saisies à l'heure de Paris. */
export async function enregistrerEvenement(id: string | null, saisie: Record<string, unknown>): Promise<ResultatAgenda> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (id && !UUID.test(id)) return { erreur: "Cet événement est introuvable." };
  const lu = lireEvenement(saisie);
  if ("erreurs" in lu) return { erreurs: lu.erreurs };
  const requete = id ? a.supabase.from("evenements").update(lu.evenement).eq("id", id).select("id") : a.supabase.from("evenements").insert(lu.evenement).select("id");
  const { data, error } = await requete;
  if (error) {
    console.error("Enregistrement de l'événement impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return data?.length ? {} : { erreur: "Cet événement est introuvable." };
}

export async function supprimerEvenement(id: string): Promise<ResultatAgenda> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Cet événement est introuvable." };
  const { error, count } = await a.supabase.from("evenements").delete({ count: "exact" }).eq("id", id);
  if (error) {
    console.error("Suppression de l'événement impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return count ? {} : { erreur: "Cet événement n'existe plus." };
}
