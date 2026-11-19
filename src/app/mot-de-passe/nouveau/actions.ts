"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validerNouveauMotDePasse } from "@/lib/mot-de-passe";
import { cheminAccueil, type Role } from "@/lib/roles";
import type { EtatFormulaire } from "@/app/connexion/actions";

export async function changerMotDePasse(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const erreur = validerNouveauMotDePasse(motDePasse, confirmation);
  if (erreur) return { erreur };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    if (error.code === "same_password") {
      return { erreur: "Choisis un mot de passe différent de l'ancien." };
    }
    if (error.code === "weak_password") {
      return { erreur: "Ce mot de passe est trop facile à deviner. Choisis-en un autre." };
    }
    return { erreur: "Impossible de modifier le mot de passe. Redemande un lien et réessaie." };
  }

  const { data: membre } = await supabase
    .from("membres")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  redirect(cheminAccueil((membre?.role as Role | undefined) ?? "membre"));
}
