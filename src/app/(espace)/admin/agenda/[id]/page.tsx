import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageFormulaire } from "@/app/(espace)/admin/PageFormulaire";
import { Chargement } from "@/components/Chargement";
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
  return (
    <PageFormulaire retour={{ href: "/admin/agenda", libelle: "Agenda" }} titre="Modifier un événement">
      <FormulaireEvenement evenement={evenement} />
    </PageFormulaire>
  );
}
