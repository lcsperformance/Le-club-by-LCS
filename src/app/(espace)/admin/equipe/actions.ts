"use server";

import { estChoixRole } from "@/lib/admin/equipe";
import { utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ResultatEquipe = { erreur?: string; info?: string };

/** Change le rôle d'un compte (la base vérifie aussi que la personne connectée est admin). */
export async function changerRole(compteId: unknown, choix: unknown): Promise<ResultatEquipe> {
  const u = await utilisateurConnecte();
  if (u?.role !== "admin") return { erreur: "Action réservée à un administrateur." };
  if (typeof compteId !== "string" || !estChoixRole(choix)) return { erreur: "Ce choix n'existe pas." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_changer_role_equipe", { cible: compteId, choix });
  if (error) {
    if (error.code === "42501") return { erreur: "Action réservée à un administrateur." };
    if (error.code === "P0002") return { erreur: "Ce compte est introuvable." };
    if (error.code === "22023") return { erreur: error.message };
    console.error("Changement de rôle impossible", error.code, error.message);
    return { erreur: "Action impossible pour le moment. Réessaie dans un instant." };
  }
  return { info: "Rôle enregistré ✓" };
}
