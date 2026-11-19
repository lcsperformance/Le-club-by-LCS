"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TYPES_ACCEPTES: EmailOtpType[] = ["recovery", "invite"];

/**
 * Valide le lien reçu par e-mail puis ouvre la page « nouveau mot de passe ».
 * Deux formats de lien sont acceptés :
 * - `code` : lien standard de Supabase (passe d'abord par Supabase, puis revient ici) ;
 * - `token_hash` + `type` : lien direct, utilisé une fois les modèles d'e-mail personnalisés.
 */
export async function confirmerLien(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "") as EmailOtpType;
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) redirect("/connexion?message=lien-invalide");
  } else if (tokenHash && TYPES_ACCEPTES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) redirect("/connexion?message=lien-invalide");
  } else {
    redirect("/connexion?message=lien-invalide");
  }

  redirect("/mot-de-passe/nouveau");
}
