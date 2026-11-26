"use server";

import { adresseCanal, lireCanal } from "@/lib/admin/canaux";
import { utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Actions de l'admin sur les canaux du Club. Chacune vérifie le rôle admin ; la base le vérifie à
 * nouveau (fonctions admin_*_canal), un autre compte ne peut donc rien écrire.
 */
export type ResultatCanal = { erreur?: string; supprimes?: number };

async function admin() {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: "Ta session a expiré. Reconnecte-toi." } as const;
  if (u.role !== "admin") return { erreur: "Action réservée à un administrateur." } as const;
  return { supabase: await createClient() } as const;
}

function echec(contexte: string, error: { code?: string; message: string }): ResultatCanal {
  console.error(contexte, error.code, error.message);
  // Messages de la base pensés pour l'admin (nom déjà pris, annonces protégé, confirmation…).
  if (["22023", "23505", "P0002", "42501"].includes(error.code ?? "")) return { erreur: error.message };
  return { erreur: "Impossible d'enregistrer pour le moment. Réessaie dans un instant." };
}

/** Ajoute un canal (cle absente : adresse tirée du nom) ou le modifie. */
export async function enregistrerCanal(cle: string | null, saisie: Record<string, unknown>): Promise<ResultatCanal> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  const lu = lireCanal(saisie);
  if ("erreur" in lu) return { erreur: lu.erreur };
  const { nom, description, lecture_seule, ordre } = lu.canal;
  if (cle) {
    const { error } = await a.supabase.rpc("admin_modifier_canal", { p_cle: cle, p_nom: nom, p_description: description, p_lecture_seule: lecture_seule, p_ordre: ordre });
    return error ? echec("Modification du canal impossible", error) : {};
  }
  const { data: existants } = await a.supabase.from("canaux").select("cle");
  const nouvelle = adresseCanal(nom, (existants ?? []).map((c) => c.cle as string));
  if (!nouvelle) return { erreur: "Ce nom donne une adresse déjà prise ou invalide : choisis un autre nom." };
  const { error } = await a.supabase.rpc("admin_creer_canal", { p_cle: nouvelle, p_nom: nom, p_description: description, p_lecture_seule: lecture_seule, p_ordre: ordre });
  return error ? echec("Ajout du canal impossible", error) : {};
}

/**
 * Supprime définitivement un canal et tous ses messages (après la confirmation de l'admin dans l'écran).
 * La base demande le nom du canal en garde-fou : le serveur le lit lui-même, l'admin n'a rien à taper.
 */
export async function supprimerCanal(cle: string): Promise<ResultatCanal> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  const { data: canal } = await a.supabase.from("canaux").select("nom").eq("cle", cle).maybeSingle();
  if (!canal) return { erreur: "Ce canal n'existe plus." };
  const { data, error } = await a.supabase.rpc("admin_supprimer_canal", { p_cle: cle, p_confirmation: canal.nom as string });
  return error ? echec("Suppression du canal impossible", error) : { supprimes: data as number };
}
