import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { estSessionDeReinitialisation } from "@/lib/reinitialisation";
import type { Niveau, Profil } from "@/lib/profils";
import { cheminAccueil, type Role } from "@/lib/roles";

export type Utilisateur = {
  id: string;
  email: string;
  role: Role;
  /** Choisis par le membre ; null tant qu'il ne l'a pas fait. */
  niveau: Niveau | null;
  profil: Profil | null;
};

/**
 * Personne connectée, ou null.
 * `cache` : lue une seule fois par requête, même si plusieurs composants la demandent.
 */
export const utilisateurConnecte = cache(async function utilisateurConnecte(): Promise<Utilisateur | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: membre } = await supabase
    .from("membres")
    .select("email, role, niveau, profil")
    .eq("id", id)
    .maybeSingle();
  if (!membre) return null;

  return {
    id,
    email: membre.email as string,
    role: membre.role as Role,
    niveau: (membre.niveau as Niveau | null) ?? null,
    profil: (membre.profil as Profil | null) ?? null,
  };
});

/** Vrai si la session vient d'un lien « mot de passe oublié » utilisé il y a moins de 15 minutes. */
export async function peutChoisirNouveauMotDePasse(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return estSessionDeReinitialisation(data?.claims?.amr);
}

/** À appeler en tête d'une page protégée : renvoie vers la bonne page sinon. */
export async function exigerRole(...autorises: Role[]): Promise<Utilisateur> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  if (!autorises.includes(utilisateur.role)) redirect(cheminAccueil(utilisateur.role));
  return utilisateur;
}
