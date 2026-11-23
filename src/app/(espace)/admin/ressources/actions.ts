"use server";

import { cleDepuisNom, lireContenu, lireSousRubrique, lireTheme, type ChampContenu } from "@/lib/admin/ressources";
import { utilisateurConnecte } from "@/lib/auth";
import { lireThemes } from "@/lib/ressources-serveur";
import { createClient } from "@/lib/supabase/server";

/**
 * Actions de l'admin sur les Ressources. Chacune vérifie le rôle admin ; la base le vérifie à nouveau
 * (sécurité par ligne et règles du stockage), un autre compte ne peut donc rien écrire.
 */
export type ResultatAdminRessources = { erreur?: string; erreurs?: Partial<Record<ChampContenu, string>>; id?: string };

const IMPOSSIBLE = "Impossible d'enregistrer pour le moment. Réessaie dans un instant.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHEMIN = /^[a-z_]{1,30}\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/;

async function admin() {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: "Ta session a expiré. Reconnecte-toi." } as const;
  if (u.role !== "admin") return { erreur: "Action réservée à un administrateur." } as const;
  return { supabase: await createClient() } as const;
}

function echec(contexte: string, error: { code?: string; message: string }): ResultatAdminRessources {
  console.error(contexte, error.code, error.message);
  if (error.code === "23503") return { erreur: "Supprime ou déplace d'abord les contenus qu'il contient." };
  if (error.code === "42501") return { erreur: "Action réservée à un administrateur." };
  return { erreur: IMPOSSIBLE };
}

// ---------------------------------------------------------------------------
// Thèmes et sous-rubriques
// ---------------------------------------------------------------------------

/** Ajoute un thème (cle absente) ou modifie son nom, son icône et son ordre. */
export async function enregistrerTheme(cle: string | null, saisie: Record<string, unknown>): Promise<ResultatAdminRessources> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  const lu = lireTheme(saisie);
  if ("erreur" in lu) return { erreur: lu.erreur };
  if (cle) {
    const { error } = await a.supabase.from("themes_ressources").update(lu.theme).eq("cle", cle);
    return error ? echec("Modification du thème impossible", error) : {};
  }
  const { data: existants } = await a.supabase.from("themes_ressources").select("cle");
  const nouvelle = cleDepuisNom(lu.theme.nom, (existants ?? []).map((t) => t.cle as string), 30);
  const { error } = await a.supabase.from("themes_ressources").insert({ cle: nouvelle, ...lu.theme });
  return error ? echec("Ajout du thème impossible", error) : {};
}

/** Supprime un thème et ses sous-rubriques ; la base refuse s'il contient encore des contenus. */
export async function supprimerTheme(cle: string): Promise<ResultatAdminRessources> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  const { error, count } = await a.supabase.from("themes_ressources").delete({ count: "exact" }).eq("cle", cle);
  if (error?.code === "23503") return { erreur: "Ce thème contient encore des contenus : supprime-les ou déplace-les d'abord." };
  if (error) return echec("Suppression du thème impossible", error);
  return count ? {} : { erreur: "Ce thème n'existe plus." };
}

/** Ajoute une sous-rubrique (cle absente) ou modifie son nom et son ordre. */
export async function enregistrerSousRubrique(theme: string, cle: string | null, saisie: Record<string, unknown>): Promise<ResultatAdminRessources> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  const lu = lireSousRubrique(saisie);
  if ("erreur" in lu) return { erreur: lu.erreur };
  if (cle) {
    const { error } = await a.supabase.from("sous_rubriques").update(lu.sousRubrique).eq("theme", theme).eq("cle", cle);
    return error ? echec("Modification de la sous-rubrique impossible", error) : {};
  }
  const { data: existantes } = await a.supabase.from("sous_rubriques").select("cle").eq("theme", theme);
  const nouvelle = cleDepuisNom(lu.sousRubrique.nom, (existantes ?? []).map((s) => s.cle as string), 40);
  const { error } = await a.supabase.from("sous_rubriques").insert({ theme, cle: nouvelle, ...lu.sousRubrique });
  return error ? echec("Ajout de la sous-rubrique impossible", error) : {};
}

/** Supprime une sous-rubrique ; la base refuse si elle contient encore des contenus. */
export async function supprimerSousRubrique(theme: string, cle: string): Promise<ResultatAdminRessources> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  const { error, count } = await a.supabase.from("sous_rubriques").delete({ count: "exact" }).eq("theme", theme).eq("cle", cle);
  if (error?.code === "23503") return { erreur: "Cette sous-rubrique contient encore des contenus : supprime-les ou déplace-les d'abord." };
  if (error) return echec("Suppression de la sous-rubrique impossible", error);
  return count ? {} : { erreur: "Cette sous-rubrique n'existe plus." };
}

// ---------------------------------------------------------------------------
// Contenus
// ---------------------------------------------------------------------------

type Fichiers = {
  /** Nouveau PDF déjà déposé dans le stockage (chemin), ou undefined pour garder l'actuel. */
  fichier?: string;
  /** Nouvelle miniature déposée (chemin), null pour la retirer, undefined pour garder l'actuelle. */
  miniature?: string | null;
};

/** Fichiers d'un contenu (pour les supprimer du stockage quand ils sont remplacés). */
async function fichiersActuels(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data } = await supabase.rpc("admin_ressources");
  const c = ((data ?? []) as { id: string; fichier: string | null; miniature: string | null }[]).find((r) => r.id === id);
  return c ? { fichier: c.fichier, miniature: c.miniature } : null;
}

async function effacerFichiers(supabase: Awaited<ReturnType<typeof createClient>>, pdf: (string | null)[], images: (string | null)[]) {
  const p = pdf.filter((x): x is string => !!x);
  const i = images.filter((x): x is string => !!x);
  if (p.length) await supabase.storage.from("ressources").remove(p);
  if (i.length) await supabase.storage.from("miniatures").remove(i);
}

/** Ajoute (id absent) ou modifie un contenu ; les fichiers sont déposés avant par le navigateur de l'admin. */
export async function enregistrerContenu(id: string | null, saisie: Record<string, unknown>, fichiers: Fichiers): Promise<ResultatAdminRessources> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (id && !UUID.test(id)) return { erreur: "Ce contenu est introuvable." };
  for (const chemin of [fichiers.fichier, fichiers.miniature]) {
    if (chemin && !CHEMIN.test(chemin)) return { erreur: "Fichier invalide : dépose-le à nouveau." };
  }
  const lu = lireContenu(saisie, await lireThemes());
  if ("erreurs" in lu) return { erreurs: lu.erreurs };

  const avant = id ? await fichiersActuels(a.supabase, id) : { fichier: null, miniature: null };
  if (!avant) return { erreur: "Ce contenu est introuvable." };
  const c = lu.contenu;
  // Un PDF n'a ni lien ni miniature ; une vidéo n'a pas de PDF.
  const fichier = c.type === "pdf" ? (fichiers.fichier ?? avant.fichier) : null;
  const miniature = c.type === "video" ? (fichiers.miniature === undefined ? avant.miniature : fichiers.miniature) : null;
  const ligne = { ...c, youtube_id: c.type === "video" ? c.youtube_id : null, fichier, miniature };

  const requete = id ? a.supabase.from("ressources").update(ligne).eq("id", id).select("id") : a.supabase.from("ressources").insert(ligne).select("id");
  const { data, error } = await requete;
  if (error) return echec("Enregistrement du contenu impossible", error);
  if (!data?.length) return { erreur: "Ce contenu est introuvable." };
  // Fichiers remplacés ou retirés : on les efface du stockage.
  await effacerFichiers(a.supabase, [avant.fichier !== fichier ? avant.fichier : null], [avant.miniature !== miniature ? avant.miniature : null]);
  return { id: data[0].id as string };
}

/** Supprime un contenu, ses favoris, ses commentaires et ses fichiers. */
export async function supprimerContenu(id: string): Promise<ResultatAdminRessources> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Ce contenu est introuvable." };
  const avant = await fichiersActuels(a.supabase, id);
  const { error, count } = await a.supabase.from("ressources").delete({ count: "exact" }).eq("id", id);
  if (error) return echec("Suppression du contenu impossible", error);
  if (!count) return { erreur: "Ce contenu n'existe plus." };
  if (avant) await effacerFichiers(a.supabase, [avant.fichier], [avant.miniature]);
  return {};
}

/** Retire du stockage des fichiers déposés pour un contenu qui n'a finalement pas été enregistré. */
export async function annulerDepot(chemins: { fichier?: string; miniature?: string }): Promise<void> {
  const a = await admin();
  if ("erreur" in a) return;
  const ok = (c?: string) => (c && CHEMIN.test(c) ? c : null);
  await effacerFichiers(a.supabase, [ok(chemins.fichier)], [ok(chemins.miniature)]);
}

// ---------------------------------------------------------------------------
// Modération
// ---------------------------------------------------------------------------

/** Supprime un commentaire ; la suppression est notée dans le journal de l'admin. */
export async function modererCommentaire(id: string): Promise<ResultatAdminRessources> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Ce commentaire est introuvable." };
  const { error } = await a.supabase.rpc("admin_supprimer_commentaire", { cid: id });
  if (error?.code === "P0002") return { erreur: "Ce commentaire a déjà été supprimé." };
  return error ? echec("Suppression du commentaire impossible", error) : {};
}
