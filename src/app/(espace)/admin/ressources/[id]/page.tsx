import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageFormulaire } from "@/app/(espace)/admin/PageFormulaire";
import { Chargement } from "@/components/Chargement";
import { lireContenusAdmin } from "@/lib/admin/ressources-serveur";
import { exigerRole } from "@/lib/auth";
import { lireThemes, urlMiniature } from "@/lib/ressources-serveur";
import { FormulaireContenu } from "../FormulaireContenu";

export const metadata: Metadata = { title: "Modifier un contenu · Administration · Le Club by LCS" };

export default function PageModifierContenu({ params }: PageProps<"/admin/ressources/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: Pick<PageProps<"/admin/ressources/[id]">, "params">) {
  await exigerRole("admin");
  const { id } = await params;
  const [themes, contenus] = await Promise.all([lireThemes(), lireContenusAdmin()]);
  const contenu = contenus.find((c) => c.id === id);
  if (!contenu) notFound();
  return (
    <PageFormulaire retour={{ href: "/admin/ressources", libelle: "Ressources" }} titre="Modifier un contenu">
      <FormulaireContenu themes={themes} contenu={contenu} miniatureActuelle={contenu.miniature ? urlMiniature(contenu.miniature) : null} />
    </PageFormulaire>
  );
}
