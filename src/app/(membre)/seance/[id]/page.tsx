import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireSeanceProgramme } from "@/lib/programme-serveur";
import { createClient } from "@/lib/supabase/server";
import { CONFIG_ZONES } from "@/lib/zones";
import { bornesPersoApplicables } from "@/lib/zones-perso";
import { EcranSeance } from "./EcranSeance";

export const metadata: Metadata = { title: "Séance · Le Club by LCS" };

export default function PageSeance({ params }: PageProps<"/seance/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: Pick<PageProps<"/seance/[id]">, "params">) {
  const utilisateur = await exigerRole("membre", "admin");
  const seance = await lireSeanceProgramme((await params).id);
  if (!seance) notFound();

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

  return <EcranSeance seance={seance} tests={tests} bornesPerso={bornesPerso} />;
}
