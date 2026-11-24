"use server";

import { after } from "next/server";
import { aAccesEspace, utilisateurConnecte } from "@/lib/auth";
import { lireMessage, lireMessageRecu, type Message } from "@/lib/club";
import { lireQuestion } from "@/lib/questions";
import { lireMessages, marquerCanalLu } from "@/lib/club-serveur";
import { notificationAnnonce } from "@/lib/notifications";
import { envoyerNotification } from "@/lib/notifications-serveur";
import { createClient } from "@/lib/supabase/server";

export type ResultatClub = { erreur?: string; message?: Message };

const IMPOSSIBLE = "Impossible d'envoyer pour le moment. Réessaie dans un instant.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CANAL = /^[a-z-]{1,30}$/;

async function connecte() {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: "Ta session a expiré. Reconnecte-toi." } as const;
  if (!aAccesEspace(u)) return { erreur: "Ton accès au Club n'est plus actif." } as const;
  return { u, supabase: await createClient() } as const;
}

/** Envoie un message dans un canal ; la base refuse « annonces » à qui n'est ni admin ni coach. */
export async function envoyerMessage(canal: unknown, saisie: unknown): Promise<ResultatClub> {
  const c = await connecte();
  if ("erreur" in c) return { erreur: c.erreur };
  if (typeof canal !== "string" || !CANAL.test(canal)) return { erreur: "Ce canal n'existe pas." };
  const lu = lireMessage(saisie);
  if ("erreur" in lu) return { erreur: lu.erreur };
  const { data, error } = await c.supabase
    .from("messages_club")
    .insert({ canal, membre_id: c.u.id, texte: lu.texte })
    .select("id, canal, membre_id, auteur, auteur_role, texte, cree_le")
    .single();
  if (error) {
    console.error("Envoi du message impossible", error.code, error.message);
    if (error.code === "42501") return { erreur: "Seuls l'équipe du Club et le coach publient dans ce canal." };
    if (error.code === "23503") return { erreur: "Ce canal n'existe pas." };
    return { erreur: IMPOSSIBLE };
  }
  await c.supabase.rpc("marquer_canal_lu", { c: canal });
  const message = lireMessageRecu(data) ?? undefined;
  // Annonce : notification aux membres, après la réponse (l'auteur n'attend pas l'envoi).
  if (canal === "annonces" && message) {
    after(() => envoyerNotification("annonces", notificationAnnonce(message), c.u.id).then(() => undefined));
  }
  return { message };
}

/** Supprime un message : le sien, ou n'importe lequel pour l'admin (noté dans le journal). */
export async function supprimerMessage(id: unknown): Promise<ResultatClub> {
  const c = await connecte();
  if ("erreur" in c) return { erreur: c.erreur };
  if (typeof id !== "string" || !UUID.test(id)) return { erreur: "Ce message est introuvable." };
  const { data, error } = await c.supabase.from("messages_club").delete().eq("id", id).eq("membre_id", c.u.id).select("id");
  if (error) {
    console.error("Suppression du message impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  if (data.length) return {};
  if (c.u.role !== "admin") return { erreur: "Tu ne peux supprimer que tes propres messages." };
  const { error: errAdmin } = await c.supabase.rpc("admin_supprimer_message", { mid: id });
  if (errAdmin?.code === "P0002") return { erreur: "Ce message a déjà été supprimé." };
  if (errAdmin) {
    console.error("Suppression (admin) impossible", errAdmin.code, errAdmin.message);
    return { erreur: IMPOSSIBLE };
  }
  return {};
}

/** Messages plus anciens d'un canal (« Voir les messages précédents »). */
export async function messagesPrecedents(canal: unknown, avant: unknown): Promise<{ messages: Message[]; encore: boolean } | { erreur: string }> {
  const c = await connecte();
  if ("erreur" in c) return { erreur: c.erreur ?? IMPOSSIBLE };
  if (typeof canal !== "string" || !CANAL.test(canal) || typeof avant !== "string") return { erreur: "Ce canal n'existe pas." };
  return lireMessages(canal, avant);
}

/** Note que le canal est lu (appelé quand un message arrive pendant qu'on le regarde). */
export async function noterLecture(canal: unknown): Promise<void> {
  const c = await connecte();
  if ("erreur" in c || typeof canal !== "string" || !CANAL.test(canal)) return;
  await marquerCanalLu(canal);
}

/** Pose une question pour la FAQ en visio (prénom et date ajoutés par la base). */
export async function poserQuestion(saisie: unknown): Promise<ResultatClub> {
  const c = await connecte();
  if ("erreur" in c) return { erreur: c.erreur };
  const lu = lireQuestion(saisie);
  if ("erreur" in lu) return { erreur: lu.erreur };
  const { error } = await c.supabase.from("questions_faq").insert({ membre_id: c.u.id, texte: lu.texte });
  if (error) {
    console.error("Envoi de la question impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return {};
}

/** Retire une de ses questions (l'admin peut retirer n'importe laquelle). */
export async function retirerQuestion(id: unknown): Promise<ResultatClub> {
  const c = await connecte();
  if ("erreur" in c) return { erreur: c.erreur };
  if (typeof id !== "string" || !UUID.test(id)) return { erreur: "Cette question est introuvable." };
  const { data, error } = await c.supabase.from("questions_faq").delete().eq("id", id).select("id");
  if (error) {
    console.error("Retrait de la question impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return data.length ? {} : { erreur: "Tu ne peux retirer que tes propres questions." };
}
