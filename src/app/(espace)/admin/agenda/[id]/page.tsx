import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RetourAdmin } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import { Chargement } from "@/components/Chargement";
import { DeuxColonnes } from "@/components/ui";
import { exigerRole } from "@/lib/auth";
import { lireEvenements } from "@/lib/club-serveur";
import { FormulaireEvenement } from "../FormulaireEvenement";

export const metadata: Metadata = { title: "Modifier un événement · Administration · Le Club by LCS" };

export default function PageModifierEvenement({ params }: PageProps<"/admin/agenda/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: Pick<PageProps<"/admin/agenda/[id]">, "params">) {
  await exigerRole("admin");
  const { id } = await params;
  const evenement = (await lireEvenements()).find((e) => e.id === id);
  if (!evenement) notFound();
  // Sur ordinateur : une colonne centrée de 720 px.
  return (
    <DeuxColonnes
      principale={
        <>
            <RetourAdmin href="/admin/agenda" libelle="Agenda" />
            <h1 className="titre" style={{ fontSize: 26 }}>
              Modifier un événement
            </h1>
            <FormulaireEvenement evenement={evenement} />
        </>
      }
    />
  );
}
