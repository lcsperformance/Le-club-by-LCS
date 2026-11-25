import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFormulaire } from "@/app/(espace)/admin/PageFormulaire";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireThemes } from "@/lib/ressources-serveur";
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
  return (
    <PageFormulaire retour={{ href: "/admin/ressources", libelle: "Ressources" }} titre="Ajouter un contenu">
      <FormulaireContenu themes={await lireThemes()} />
    </PageFormulaire>
  );
}
