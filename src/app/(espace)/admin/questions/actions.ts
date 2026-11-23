"use server";

import { utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Boîte à questions : l'admin marque une question traitée (ou à traiter) et peut la supprimer. */
export type ResultatQuestions = { erreur?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function admin() {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: "Ta session a expiré. Reconnecte-toi." } as const;
  if (u.role !== "admin") return { erreur: "Action réservée à un administrateur." } as const;
  return { supabase: await createClient() } as const;
}

export async function marquerQuestion(id: string, traitee: boolean): Promise<ResultatQuestions> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Cette question est introuvable." };
  const { data, error } = await a.supabase
    .from("questions_faq")
    .update({ traitee_le: traitee ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("Mise à jour de la question impossible", error.code, error.message);
    return { erreur: "Impossible d'enregistrer pour le moment." };
  }
  return data.length ? {} : { erreur: "Cette question n'existe plus." };
}

export async function supprimerQuestion(id: string): Promise<ResultatQuestions> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Cette question est introuvable." };
  const { data, error } = await a.supabase.from("questions_faq").delete().eq("id", id).select("id");
  if (error) {
    console.error("Suppression de la question impossible", error.code, error.message);
    return { erreur: "Impossible de supprimer pour le moment." };
  }
  return data.length ? {} : { erreur: "Cette question n'existe plus." };
}
