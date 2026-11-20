import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { lireObjectifs } from "@/lib/saison-serveur";
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
  const objectifs = await lireObjectifs(utilisateur.id);
  return <EcranSemaine utilisateur={utilisateur} objectifs={objectifs} aujourdhui={dateDuJourParis()} />;
}
