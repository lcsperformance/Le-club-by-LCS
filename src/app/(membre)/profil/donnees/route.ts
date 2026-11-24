import { utilisateurConnecte } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { COLONNES_FICHE, nomFichierExport, TABLES_EXPORT } from "@/lib/mes-donnees";
import { createClient } from "@/lib/supabase/server";

/**
 * « Télécharger mes données » (Profil) : toutes les données du membre connecté, dans un fichier JSON.
 * Lues avec SA session : la sécurité par ligne garantit qu'il n'obtient que les siennes.
 */
export async function GET() {
  const u = await utilisateurConnecte();
  if (!u) return new Response("Connexion requise", { status: 401 });

  const supabase = await createClient();
  const { data: fiche, error } = await supabase.from("membres").select(COLONNES_FICHE).eq("id", u.id).maybeSingle();
  if (error || !fiche) {
    console.error("Export : lecture de la fiche impossible", error?.code, error?.message);
    return new Response("Export impossible pour le moment. Réessaie dans un instant.", { status: 500 });
  }

  const donnees: Record<string, unknown> = { exporte_le: new Date().toISOString(), compte: fiche };
  for (const t of TABLES_EXPORT) {
    const { data, error: err } = await supabase.from(t.table).select(t.colonnes).eq("membre_id", u.id);
    if (err) {
      console.error(`Export : lecture de ${t.table} impossible`, err.code, err.message);
      return new Response("Export impossible pour le moment. Réessaie dans un instant.", { status: 500 });
    }
    donnees[t.cle] = data ?? [];
  }

  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomFichierExport(dateDuJourParis())}"`,
      "Cache-Control": "no-store",
    },
  });
}
