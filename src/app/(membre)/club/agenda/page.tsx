import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireEvenements } from "@/lib/club-serveur";
import { dateDuJourParis } from "@/lib/dates";
import { EcranAgenda } from "./EcranAgenda";

export const metadata: Metadata = { title: "Agenda · Le Club · Le Club by LCS" };

export default function PageAgenda() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "coach", "admin");
  return <EcranAgenda utilisateur={utilisateur} evenements={await lireEvenements()} aujourdhui={dateDuJourParis()} />;
}
