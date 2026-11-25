import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFormulaire } from "@/app/(espace)/admin/PageFormulaire";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { FormulaireEvenement } from "../FormulaireEvenement";

export const metadata: Metadata = { title: "Ajouter un événement · Administration · Le Club by LCS" };

export default function PageNouvelEvenement() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  return (
    <PageFormulaire retour={{ href: "/admin/agenda", libelle: "Agenda" }} titre="Ajouter un événement">
      <FormulaireEvenement />
    </PageFormulaire>
  );
}
