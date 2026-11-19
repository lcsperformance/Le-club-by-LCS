"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Déconnecte uniquement cet appareil (« local ») : par défaut, Supabase fermerait
 * la session sur tous les appareils du membre (téléphone, ordinateur…).
 */
export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/connexion?message=deconnecte");
}
