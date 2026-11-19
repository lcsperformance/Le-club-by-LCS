"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cheminAccueil, type Role } from "@/lib/roles";

export type EtatFormulaire = { erreur?: string; info?: string; email?: string };

export async function seConnecter(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!email || !motDePasse) {
    return { erreur: "Renseigne ton e-mail et ton mot de passe.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });

  if (error || !data.user) {
    if (error?.status === 429) {
      return { erreur: "Trop de tentatives. Réessaie dans quelques minutes.", email };
    }
    return { erreur: "E-mail ou mot de passe incorrect.", email };
  }

  const { data: membre } = await supabase
    .from("membres")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // Compte d'authentification sans fiche membre : ne pas laisser la personne coincée
  // entre la connexion et son espace.
  if (!membre) {
    await supabase.auth.signOut({ scope: "local" });
    return { erreur: "Ton compte n'est pas encore activé. Écris-nous pour qu'on le règle.", email };
  }

  redirect(cheminAccueil(membre.role as Role));
}
