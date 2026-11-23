import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { lireSeancesFaites, lireSemaineProgramme } from "@/lib/programme-serveur";
import { organiserSaison } from "@/lib/saison";
import { lireObjectifs } from "@/lib/saison-serveur";
import { joursDeLaSemaine } from "@/lib/semaine";
import { createClient } from "@/lib/supabase/server";
import { EcranSemaine } from "./EcranSemaine";

export const metadata: Metadata = { title: "Ma semaine · Le Club by LCS" };

export default function PageSemaine() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  const aujourdhui = dateDuJourParis();
  const supabase = await createClient();
  const [objectifs, { count }] = await Promise.all([
    lireObjectifs(utilisateur.id),
    supabase.from("tests").select("id", { count: "exact", head: true }).eq("membre_id", utilisateur.id),
  ]);
  const jours = joursDeLaSemaine(aujourdhui);
  const [programme, faites] = await Promise.all([
    lireSemaineProgramme(utilisateur, organiserSaison(objectifs, aujourdhui), jours[0].iso),
    lireSeancesFaites(utilisateur.id, jours[0].iso, jours[6].iso),
  ]);
  return (
    <EcranSemaine
      utilisateur={utilisateur}
      objectifs={objectifs}
      aujourdhui={aujourdhui}
      programme={programme}
      testsFaits={(count ?? 0) > 0}
      faites={faites}
    />
  );
}
