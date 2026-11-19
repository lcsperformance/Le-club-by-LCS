"use server";

import { urlDuSite } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import type { EtatFormulaire } from "@/app/connexion/actions";

const MESSAGE_ENVOYE =
  "Si un compte existe avec cette adresse, tu vas recevoir un e-mail avec un lien pour choisir un nouveau mot de passe. Pense à regarder dans tes indésirables.";

export async function demanderReinitialisation(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { erreur: "Renseigne une adresse e-mail valide.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${urlDuSite()}/auth/confirm`,
  });

  if (error?.status === 429) {
    return { erreur: "Trop de demandes en peu de temps. Réessaie dans une heure.", email };
  }
  // Même réponse que le compte existe ou non : on ne révèle pas qui est inscrit.
  return { info: MESSAGE_ENVOYE };
}
