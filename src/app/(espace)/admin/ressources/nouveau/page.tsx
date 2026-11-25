import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { DeuxColonnes } from "@/components/ui";
import { exigerRole } from "@/lib/auth";
import { lireThemes } from "@/lib/ressources-serveur";
import { RetourAdmin } from "../EcranAdminRessources";
import { FormulaireContenu } from "../FormulaireContenu";

export const metadata: Metadata = { title: "Ajouter un contenu · Administration · Le Club by LCS" };

export default function PageNouveauContenu() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  // Sur ordinateur : une colonne centrée de 720 px.
  return (
    <DeuxColonnes
      principale={
        <>
            <RetourAdmin href="/admin/ressources" libelle="Ressources" />
            <h1 className="titre" style={{ fontSize: 26 }}>
              Ajouter un contenu
            </h1>
            <FormulaireContenu themes={await lireThemes()} />
        </>
      }
    />
  );
}
