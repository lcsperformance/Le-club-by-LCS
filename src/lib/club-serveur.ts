import "server-only";
import { createClient } from "@/lib/supabase/server";
import { lireMessageRecu, MESSAGES_PAR_PAGE, type Canal, type Message } from "./club";

const CHAMPS = "id, canal, membre_id, auteur, auteur_role, texte, cree_le";

/** Les canaux du Club, dans leur ordre. */
export async function lireCanaux(): Promise<Canal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("canaux").select("cle, nom, description, lecture_seule, ordre").order("ordre");
  if (error) console.error("Lecture des canaux impossible", error.code, error.message);
  return (data ?? []) as Canal[];
}

/** Messages non lus par canal pour la personne connectée (calculé par la base). */
export async function lireNonLus(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("canaux_non_lus");
  if (error) console.error("Lecture des non-lus impossible", error.code, error.message);
  return Object.fromEntries(((data ?? []) as { canal: string; non_lus: number }[]).map((l) => [l.canal, l.non_lus]));
}

/** Les derniers messages d'un canal (avant une date pour remonter le fil), du plus ancien au plus récent. */
export async function lireMessages(canal: string, avant?: string): Promise<{ messages: Message[]; encore: boolean }> {
  const supabase = await createClient();
  let requete = supabase.from("messages_club").select(CHAMPS).eq("canal", canal).order("cree_le", { ascending: false }).limit(MESSAGES_PAR_PAGE + 1);
  if (avant) requete = requete.lt("cree_le", avant);
  const { data, error } = await requete;
  if (error) console.error("Lecture des messages impossible", error.code, error.message);
  const lus = (data ?? []).map(lireMessageRecu).filter((m): m is Message => !!m);
  return { messages: lus.slice(0, MESSAGES_PAR_PAGE).reverse(), encore: lus.length > MESSAGES_PAR_PAGE };
}

/** Marque le canal comme lu jusqu'à maintenant. */
export async function marquerCanalLu(canal: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("marquer_canal_lu", { c: canal });
  if (error) console.error("Lecture du canal non notée", error.code, error.message);
}
