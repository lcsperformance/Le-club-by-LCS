import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cheminAccueil, type Role } from "@/lib/roles";

export type Utilisateur = { id: string; email: string; role: Role };

/** Personne connectée, ou null. */
export async function utilisateurConnecte(): Promise<Utilisateur | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: membre } = await supabase
    .from("membres")
    .select("email, role")
    .eq("id", id)
    .maybeSingle();
  if (!membre) return null;

  return { id, email: membre.email as string, role: membre.role as Role };
}

/** À appeler en tête d'une page protégée : renvoie vers la bonne page sinon. */
export async function exigerRole(...autorises: Role[]): Promise<Utilisateur> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  if (!autorises.includes(utilisateur.role)) redirect(cheminAccueil(utilisateur.role));
  return utilisateur;
}
