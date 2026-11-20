"use server";

import { aAccesEspace, utilisateurConnecte } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { erreurDateCourse, estBloc, lireNomCourse, OBJECTIFS_MAX } from "@/lib/saison";
import { createClient } from "@/lib/supabase/server";

export type ResultatSaison = { erreur?: string };

const IMPOSSIBLE = "Impossible d'enregistrer ta saison pour le moment. Réessaie dans un instant.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Membre connecté avec un accès en cours ; la sécurité par ligne limite ensuite tout à ses propres objectifs. */
async function membreAvecAcces() {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) return { erreur: "Ta session a expiré. Reconnecte-toi pour modifier ta saison." } as const;
  if (!aAccesEspace(utilisateur)) return { erreur: "Ton accès au Club n'est plus actif." } as const;
  return { utilisateur } as const;
}

function echec(contexte: string, error: { code?: string; message: string }): ResultatSaison {
  console.error(contexte, error.code, error.message);
  return { erreur: IMPOSSIBLE };
}

/** Ajoute un objectif (bloc S, M, L ou XL, date de course à venir, nom facultatif). */
export async function ajouterObjectif(bloc: unknown, date: unknown, nomSaisi?: unknown): Promise<ResultatSaison> {
  const m = await membreAvecAcces();
  if ("erreur" in m) return { erreur: m.erreur };
  if (!estBloc(bloc)) return { erreur: "Choisis un bloc : S, M, L ou XL." };
  const erreurDate = erreurDateCourse(date, dateDuJourParis());
  if (erreurDate) return { erreur: erreurDate };
  const lu = lireNomCourse(nomSaisi);
  if ("erreur" in lu) return { erreur: lu.erreur };

  const supabase = await createClient();
  const { data: existants, error: errLecture } = await supabase
    .from("objectifs")
    .select("bloc, date_objectif")
    .eq("membre_id", m.utilisateur.id);
  if (errLecture) return echec("Lecture des objectifs impossible", errLecture);
  // Même objectif déjà enregistré (double toucher) : rien à faire.
  if (existants.some((o) => o.bloc === bloc && o.date_objectif === date)) return {};
  if (existants.length >= OBJECTIFS_MAX) {
    return { erreur: `Tu as déjà ${OBJECTIFS_MAX} objectifs : supprime ceux qui sont terminés pour en ajouter.` };
  }

  const { error } = await supabase
    .from("objectifs")
    .insert({ membre_id: m.utilisateur.id, bloc, date_objectif: date, nom: lu.nom });
  if (error) return echec("Ajout de l'objectif impossible", error);
  return {};
}

/** Change la date de course d'un de ses objectifs. */
export async function changerDateObjectif(id: unknown, date: unknown): Promise<ResultatSaison> {
  const m = await membreAvecAcces();
  if ("erreur" in m) return { erreur: m.erreur };
  if (typeof id !== "string" || !UUID.test(id)) return { erreur: "Cet objectif est introuvable." };
  const erreurDate = erreurDateCourse(date, dateDuJourParis());
  if (erreurDate) return { erreur: erreurDate };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objectifs")
    .update({ date_objectif: date })
    .eq("id", id)
    .eq("membre_id", m.utilisateur.id)
    .select("id");
  if (error) return echec("Changement de date impossible", error);
  if (!data.length) return { erreur: "Cet objectif est introuvable." };
  return {};
}

/** Donne un nom à sa course, le change, ou le retire (champ vide). */
export async function renommerObjectif(id: unknown, nomSaisi: unknown): Promise<ResultatSaison> {
  const m = await membreAvecAcces();
  if ("erreur" in m) return { erreur: m.erreur };
  if (typeof id !== "string" || !UUID.test(id)) return { erreur: "Cet objectif est introuvable." };
  const lu = lireNomCourse(nomSaisi);
  if ("erreur" in lu) return { erreur: lu.erreur };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("objectifs")
    .update({ nom: lu.nom })
    .eq("id", id)
    .eq("membre_id", m.utilisateur.id)
    .select("id");
  if (error) return echec("Changement de nom impossible", error);
  if (!data.length) return { erreur: "Cet objectif est introuvable." };
  return {};
}

/** Supprime un de ses objectifs. */
export async function supprimerObjectif(id: unknown): Promise<ResultatSaison> {
  const m = await membreAvecAcces();
  if ("erreur" in m) return { erreur: m.erreur };
  if (typeof id !== "string" || !UUID.test(id)) return { erreur: "Cet objectif est introuvable." };

  const supabase = await createClient();
  const { error } = await supabase.from("objectifs").delete().eq("id", id).eq("membre_id", m.utilisateur.id);
  if (error) return echec("Suppression de l'objectif impossible", error);
  return {};
}
