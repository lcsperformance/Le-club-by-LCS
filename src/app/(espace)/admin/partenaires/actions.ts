"use server";

import { utilisateurConnecte } from "@/lib/auth";
import { recupererLogo } from "@/lib/logo-partenaire-serveur";
import { CHEMIN_LOGO, lirePartenaire, type ChampPartenaire } from "@/lib/partenaires";
import { createClient } from "@/lib/supabase/server";

/** Partenaires des Avantages : seul l'admin écrit (vérifié ici et par la base). */
export type ResultatPartenaire = {
  erreur?: string;
  erreurs?: Partial<Record<ChampPartenaire, string>>;
  /** Logo pris sur le site du partenaire : trouvé, ou introuvable (la carte garde l'initiale). */
  logo?: "trouve" | "introuvable";
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Remplace le logo d'un partenaire (chemin dans le stockage « logos », ou null) et efface l'ancien fichier. */
async function remplacerLogo(supabase: Supabase, id: string, chemin: string | null): Promise<boolean> {
  const { data: avant } = await supabase.from("partenaires").select("logo").eq("id", id).maybeSingle();
  const { error } = await supabase.from("partenaires").update({ logo: chemin }).eq("id", id);
  if (error) {
    console.error("Enregistrement du logo impossible", error.code, error.message);
    return false;
  }
  if (avant?.logo && avant.logo !== chemin) await supabase.storage.from("logos").remove([avant.logo]);
  return true;
}

/** Va chercher le logo sur le site du partenaire et le garde dans notre stockage. */
async function logoDepuisSite(supabase: Supabase, id: string, lien: string): Promise<"trouve" | "introuvable"> {
  const logo = await recupererLogo(lien);
  if (!logo) return "introuvable";
  const chemin = `${crypto.randomUUID()}.${logo.type.ext}`;
  const { error } = await supabase.storage.from("logos").upload(chemin, new Blob([logo.octets as Uint8Array<ArrayBuffer>], { type: logo.type.mime }), { contentType: logo.type.mime });
  if (error) {
    console.error("Dépôt du logo impossible", error.message);
    return "introuvable";
  }
  if (!(await remplacerLogo(supabase, id, chemin))) {
    await supabase.storage.from("logos").remove([chemin]);
    return "introuvable";
  }
  return "trouve";
}

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
  // Ancien lien et logo : le logo est repris sur le site quand le lien change ou qu'il n'y en a pas encore.
  const { data: avant } = id ? await a.supabase.from("partenaires").select("lien, logo").eq("id", id).maybeSingle() : { data: null };
  const { data, error } = id
    ? await a.supabase.from("partenaires").update(ligne).eq("id", id).select("id")
    : await a.supabase.from("partenaires").insert(ligne).select("id");
  if (error) {
    console.error("Enregistrement du partenaire impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  if (!data?.length) return { erreur: "Ce partenaire est introuvable." };
  const lien = ligne.lien;
  if (lien && (lien !== avant?.lien || !avant?.logo)) return { logo: await logoDepuisSite(a.supabase, data[0].id as string, lien) };
  return {};
}

/** « Reprendre le logo du site » : le serveur va le chercher à nouveau. */
export async function reprendreLogo(id: string): Promise<ResultatPartenaire> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Ce partenaire est introuvable." };
  const { data } = await a.supabase.from("partenaires").select("lien").eq("id", id).maybeSingle();
  if (!data) return { erreur: "Ce partenaire est introuvable." };
  if (!data.lien) return { erreur: "Ajoute d'abord le site du partenaire (https://…)." };
  return { logo: await logoDepuisSite(a.supabase, id, data.lien as string) };
}

/** Logo déposé à la main par l'admin (le navigateur l'a mis dans le stockage « logos »). */
export async function changerLogo(id: string, chemin: string): Promise<ResultatPartenaire> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id) || !CHEMIN_LOGO.test(chemin)) return { erreur: "Ce logo est introuvable." };
  return (await remplacerLogo(a.supabase, id, chemin)) ? {} : { erreur: IMPOSSIBLE };
}

/** Retire le logo : la carte affiche de nouveau l'initiale. */
export async function retirerLogo(id: string): Promise<ResultatPartenaire> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Ce partenaire est introuvable." };
  return (await remplacerLogo(a.supabase, id, null)) ? {} : { erreur: IMPOSSIBLE };
}

export async function supprimerPartenaire(id: string): Promise<ResultatPartenaire> {
  const a = await admin();
  if ("erreur" in a) return { erreur: a.erreur };
  if (!UUID.test(id)) return { erreur: "Ce partenaire est introuvable." };
  const { data: avant } = await a.supabase.from("partenaires").select("logo").eq("id", id).maybeSingle();
  const { error, count } = await a.supabase.from("partenaires").delete({ count: "exact" }).eq("id", id);
  if (!error && count && avant?.logo) await a.supabase.storage.from("logos").remove([avant.logo as string]);
  if (error) {
    console.error("Suppression du partenaire impossible", error.code, error.message);
    return { erreur: IMPOSSIBLE };
  }
  return count ? {} : { erreur: "Ce partenaire n'existe plus." };
}
