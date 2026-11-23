"use server";

import { utilisateurConnecte } from "@/lib/auth";
import { lirePartenaire, type ChampPartenaire } from "@/lib/partenaires";
import { createClient } from "@/lib/supabase/server";

/** Partenaires des Avantages : seul l'admin écrit (vérifié ici et par la base). */
export type ResultatPartenaire = { erreur?: string; erreurs?: Partial<Record<ChampPartenaire, string>> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMPOSSIBLE = "Impossible d'enregistrer pour le moment. Réessaie dans un instant.";

async function admin() {
  const u = await utilisateurConnecte();
  if (!u) return { erreur: "Ta session a expiré. Reconnecte-toi." } as const;
  if (u.role !== "admin") return { erreur: "Action réservée à un administrateur." } as const;
  return { supabase: await createClient() } as const;
}

/** Ajoute (id absent) ou modifie un partenaire. Une fois modifié par l'admin, il n'est plus un « exemple ». */
export async function enregistrerPartenaire(id: string | null, saisie: Record<string, unknown>): Promise<ResultatPartenaire> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (id && !UUID.test(id)) return { erreur: "Ce partenaire est introuvable." };
  const lu = lirePartenaire(saisie);
  if ("erreurs" in lu) return { erreurs: lu.erreurs };
  const ligne = { ...lu.partenaire, exemple: false };
  const { data, error } = id
    ? await a.supabase.from("partenaires").update(ligne).eq("id", id).select("id")
    : await a.supabase.from("partenaires").insert(ligne).select("id");
  if (error) {
    console.error("Enregistrement du partenaire impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return data?.length ? {} : { erreur: "Ce partenaire est introuvable." };
}

export async function supprimerPartenaire(id: string): Promise<ResultatPartenaire> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Ce partenaire est introuvable." };
  const { error, count } = await a.supabase.from("partenaires").delete({ count: "exact" }).eq("id", id);
  if (error) {
    console.error("Suppression du partenaire impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return count ? {} : { erreur: "Ce partenaire n'existe plus." };
}
