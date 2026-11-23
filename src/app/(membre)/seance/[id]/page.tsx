import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { lireSeanceProgramme } from "@/lib/programme-serveur";
import { erreurJour, jourDeLaSeance, type Ressenti } from "@/lib/ressenti";
import { createClient } from "@/lib/supabase/server";
import { CONFIG_ZONES } from "@/lib/zones";
import { bornesPersoApplicables } from "@/lib/zones-perso";
import { EcranSeance } from "./EcranSeance";

export const metadata: Metadata = { title: "Séance · Le Club by LCS" };

export default function PageSeance({ params, searchParams }: PageProps<"/seance/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({ params, searchParams }: Pick<PageProps<"/seance/[id]">, "params" | "searchParams">) {
  const utilisateur = await exigerRole("membre", "admin");
  const seance = await lireSeanceProgramme((await params).id);
  if (!seance) notFound();
  const aujourdhui = dateDuJourParis();
  const jour = jourDeLaSeance((await searchParams).jour, aujourdhui);

  const supabase = await createClient();
  const { data: tests } = await supabase
    .from("tests")
    .select("allure_seuil_course, ftp, vitesse_critique_natation, fc_seuil")
    .eq("membre_id", utilisateur.id)
    .order("date_test", { ascending: false })
    .limit(1)
    .maybeSingle();

  let bornesPerso = null;
  if (seance.sport !== "renfo") {
    const { data: perso } = await supabase
      .from("zones")
      .select("bornes")
      .eq("membre_id", utilisateur.id)
      .eq("sport", seance.sport)
      .maybeSingle();
    bornesPerso = bornesPersoApplicables(perso?.bornes, CONFIG_ZONES[seance.sport]);
  }

  // Ressenti du membre pour cette séance ce jour-là (données de santé : la sécurité par ligne ne renvoie que les siens).
  const { data: r } = await supabase
    .from("ressentis")
    .select("rpe, douleur, commentaire")
    .eq("membre_id", utilisateur.id)
    .eq("seance_id", seance.id)
    .eq("date_seance", jour)
    .maybeSingle();
  const ressenti: Ressenti | null = r
    ? { rpe: typeof r.rpe === "number" ? r.rpe : null, douleur: r.douleur === true, commentaire: typeof r.commentaire === "string" ? r.commentaire : null }
    : null;

  return (
    <EcranSeance seance={seance} tests={tests} bornesPerso={bornesPerso} suivi={{ jour, ressenti, interdit: erreurJour(jour, aujourdhui) }} />
  );
}
