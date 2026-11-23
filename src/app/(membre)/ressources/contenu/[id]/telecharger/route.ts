/**
 * Téléchargement d'un PDF des Ressources : seulement si le contenu est débloqué pour le membre.
 * La base donne le chemin du fichier (fichier_ressource) et le stockage privé vérifie à nouveau
 * le déblocage avant de créer un lien valable 60 secondes. Le contenu est noté « Téléchargé ».
 */
import { NextResponse } from "next/server";
import { aAccesEspace, utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(requete: Request, ctx: RouteContext<"/ressources/contenu/[id]/telecharger">) {
  const { id } = await ctx.params;
  const retour = new URL(`/ressources/contenu/${encodeURIComponent(id)}`, requete.url);
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return NextResponse.redirect(new URL("/connexion", requete.url), 303);
  if (!aAccesEspace(utilisateur)) return NextResponse.redirect(new URL("/abonnement", requete.url), 303);
  if (!UUID.test(id)) return NextResponse.redirect(new URL("/ressources", requete.url), 303);

  const supabase = await createClient();
  const { data: chemin } = await supabase.rpc("fichier_ressource", { rid: id });
  if (typeof chemin !== "string" || !chemin) return NextResponse.redirect(retour, 303);

  const { data: lien, error } = await supabase.storage.from("ressources").createSignedUrl(chemin, 60, { download: true });
  if (error || !lien) {
    console.error("Lien de téléchargement impossible", error?.message);
    return NextResponse.redirect(retour, 303);
  }

  // « Téléchargé » : on crée ou met à jour la ligne de suivi du membre (la base vérifie le déblocage).
  const maintenant = new Date().toISOString();
  const { data: maj } = await supabase
    .from("suivi_ressources")
    .update({ consulte_le: maintenant, mis_a_jour: maintenant })
    .eq("membre_id", utilisateur.id)
    .eq("ressource_id", id)
    .select("id");
  if (!maj?.length) {
    await supabase.from("suivi_ressources").insert({ membre_id: utilisateur.id, ressource_id: id, consulte_le: maintenant, mis_a_jour: maintenant });
  }
  return NextResponse.redirect(lien.signedUrl, 303);
}
