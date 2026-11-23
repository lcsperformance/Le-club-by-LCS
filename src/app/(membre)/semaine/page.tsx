import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { lireSeancesFaites, lireSemaineProgramme } from "@/lib/programme-serveur";
import { ajouterJours, organiserSaison } from "@/lib/saison";
import { lireObjectifs } from "@/lib/saison-serveur";
import { bornesSemaines, dernierJourPaye, lundiDe, semaineDemandee, semainesVoisines } from "@/lib/semaine";
import { createClient } from "@/lib/supabase/server";
import { EcranSemaine } from "./EcranSemaine";

export const metadata: Metadata = { title: "Ma semaine · Le Club by LCS" };

export default function PageSemaine({ searchParams }: PageProps<"/semaine">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({ searchParams }: Pick<PageProps<"/semaine">, "searchParams">) {
  const utilisateur = await exigerRole("membre", "admin");
  const aujourdhui = dateDuJourParis();
  // Semaines visibles : depuis l'inscription jusqu'à la fin de la période payée.
  const inscription = utilisateur.dateInscription ? dateDuJourParis(new Date(utilisateur.dateInscription)) : null;
  const bornes = bornesSemaines(aujourdhui, inscription, dernierJourPaye(utilisateur, aujourdhui));
  const lundi = semaineDemandee((await searchParams).du, aujourdhui, bornes);
  const courante = lundi === lundiDe(aujourdhui);

  const supabase = await createClient();
  const [objectifs, { count }] = await Promise.all([
    lireObjectifs(utilisateur.id),
    supabase.from("tests").select("id", { count: "exact", head: true }).eq("membre_id", utilisateur.id),
  ]);
  const [programme, faites] = await Promise.all([
    lireSemaineProgramme(utilisateur, organiserSaison(objectifs, courante ? aujourdhui : lundi), lundi),
    lireSeancesFaites(utilisateur.id, lundi, ajouterJours(lundi, 6)),
  ]);
  return (
    <EcranSemaine
      utilisateur={utilisateur}
      objectifs={objectifs}
      aujourdhui={aujourdhui}
      programme={programme}
      testsFaits={(count ?? 0) > 0}
      faites={faites}
      lundi={lundi}
      navigation={semainesVoisines(lundi, bornes)}
    />
  );
}
