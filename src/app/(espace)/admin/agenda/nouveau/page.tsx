import type { Metadata } from "next";
import { Suspense } from "react";
import { RetourAdmin } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
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
    <>
      <RetourAdmin href="/admin/agenda" libelle="Agenda" />
      <h1 className="titre" style={{ fontSize: 26 }}>
        Ajouter un événement
      </h1>
      <FormulaireEvenement />
    </>
  );
}
