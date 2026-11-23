import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { cartesThemes, favoris } from "@/lib/ressources";
import { lireCatalogue, lireSuivis, lireThemes, semaineDuMembre } from "@/lib/ressources-serveur";
import { EcranRessources } from "./EcranRessources";

export const metadata: Metadata = { title: "Ressources · Le Club by LCS" };

export default function PageRessources() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  const semaine = semaineDuMembre(utilisateur);
  const [themes, catalogue, suivis] = await Promise.all([lireThemes(), lireCatalogue(), lireSuivis(utilisateur.id)]);
  return <EcranRessources themes={cartesThemes(themes, catalogue, semaine)} nbFavoris={favoris(themes, catalogue, suivis, semaine).length} />;
}
