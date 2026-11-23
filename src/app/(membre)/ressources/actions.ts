"use server";

import { aAccesEspace, utilisateurConnecte } from "@/lib/auth";
import { lireCommentaire } from "@/lib/ressources";
import { createClient } from "@/lib/supabase/server";

export type ResultatRessource = { erreur?: string };

const IMPOSSIBLE = "Impossible d'enregistrer pour le moment. Réessaie dans un instant.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function membre() {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return { erreur: "Ta session a expiré. Reconnecte-toi." } as const;
  if (!aAccesEspace(utilisateur)) return { erreur: "Ton accès au Club n'est plus actif." } as const;
  return { utilisateur, supabase: await createClient() } as const;
}

function echec(contexte: string, error: { code?: string; message: string }): ResultatRessource {
  console.error(contexte, error.code, error.message);
  // 42501 : la sécurité par ligne refuse (contenu encore verrouillé).
  return { erreur: error.code === "42501" ? "Ce contenu n'est pas encore débloqué." : IMPOSSIBLE };
}

/**
 * Met à jour le suivi d'un contenu (favori, vu ou téléchargé) ; crée la ligne au besoin.
 * La base refuse si le contenu n'est pas débloqué pour ce membre.
 */
export async function changerSuivi(ressourceId: unknown, changement: { favori?: boolean; consulte?: boolean }): Promise<ResultatRessource> {
  const m = await membre();
  if ("erreur" in m) return { erreur: m.erreur };
  if (typeof ressourceId !== "string" || !UUID.test(ressourceId)) return { erreur: "Ce contenu est introuvable." };
  const valeurs: Record<string, unknown> = { mis_a_jour: new Date().toISOString() };
  if (typeof changement?.favori === "boolean") valeurs.favori = changement.favori;
  if (typeof changement?.consulte === "boolean") valeurs.consulte_le = changement.consulte ? new Date().toISOString() : null;

  const { data, error } = await m.supabase
    .from("suivi_ressources")
    .update(valeurs)
    .eq("membre_id", m.utilisateur.id)
    .eq("ressource_id", ressourceId)
    .select("id");
  if (error) return echec("Suivi de ressource impossible", error);
  if (data.length) return {};
  const { error: errAjout } = await m.supabase.from("suivi_ressources").insert({ membre_id: m.utilisateur.id, ressource_id: ressourceId, ...valeurs });
  // 23505 : deux touchers simultanés ; la ligne existe déjà, on réessaie la mise à jour.
  if (errAjout?.code === "23505") return changerSuivi(ressourceId, changement);
  return errAjout ? echec("Suivi de ressource impossible", errAjout) : {};
}

/** Publie un commentaire sous une vidéo débloquée (prénom et rôle ajoutés par la base). */
export async function publierCommentaire(ressourceId: unknown, saisie: unknown): Promise<ResultatRessource> {
  const m = await membre();
  if ("erreur" in m) return { erreur: m.erreur };
  if (typeof ressourceId !== "string" || !UUID.test(ressourceId)) return { erreur: "Ce contenu est introuvable." };
  const lu = lireCommentaire(saisie);
  if ("erreur" in lu) return { erreur: lu.erreur };
  const { error } = await m.supabase
    .from("commentaires_ressources")
    .insert({ ressource_id: ressourceId, membre_id: m.utilisateur.id, texte: lu.texte });
  return error ? echec("Publication du commentaire impossible", error) : {};
}

/** Supprime un de ses commentaires (l'admin peut supprimer n'importe lequel). */
export async function supprimerCommentaire(commentaireId: unknown): Promise<ResultatRessource> {
  const m = await membre();
  if ("erreur" in m) return { erreur: m.erreur };
  if (typeof commentaireId !== "string" || !UUID.test(commentaireId)) return { erreur: "Ce commentaire est introuvable." };
  const { data, error } = await m.supabase.from("commentaires_ressources").delete().eq("id", commentaireId).select("id");
  if (error) return echec("Suppression du commentaire impossible", error);
  return data.length ? {} : { erreur: "Tu ne peux supprimer que tes propres commentaires." };
}
