/** « Ajouter à mon agenda » : fichier .ics d'un événement daté, pour les membres connectés. */
import { NextResponse } from "next/server";
import { fichierIcs, nomFichierIcs, type Evenement } from "@/lib/agenda";
import { aAccesEspace, utilisateurConnecte } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(requete: Request, ctx: RouteContext<"/club/agenda/[id]/ics">) {
  const { id } = await ctx.params;
  const u = await utilisateurConnecte();
  if (!u) return NextResponse.redirect(new URL("/connexion", requete.url), 303);
  if (!aAccesEspace(u)) return NextResponse.redirect(new URL("/abonnement", requete.url), 303);
  if (!UUID.test(id)) return new NextResponse("Événement introuvable", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase
    .from("evenements")
    .select("id, titre, type, debut, fin, lieu, lien, description, dates_a_confirmer, periode")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.dates_a_confirmer) return new NextResponse("Événement introuvable ou pas encore daté", { status: 404 });
  const e = { ...data, debut: new Date(data.debut).toISOString(), fin: data.fin ? new Date(data.fin).toISOString() : null } as Evenement;
  return new NextResponse(fichierIcs(e, new Date()), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${nomFichierIcs(e)}"`,
      "cache-control": "private, no-store",
    },
  });
}
