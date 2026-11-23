import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { lireCommentairesAdmin, lireContenusAdmin } from "@/lib/admin/ressources-serveur";
import { exigerRole } from "@/lib/auth";
import { lireThemes } from "@/lib/ressources-serveur";
import { EcranAdminRessources } from "./EcranAdminRessources";

export const metadata: Metadata = { title: "Ressources · Administration · Le Club by LCS" };

export default function PageAdminRessources() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  const [themes, contenus, commentaires] = await Promise.all([lireThemes(), lireContenusAdmin(), lireCommentairesAdmin()]);
  return <EcranAdminRessources themes={themes} contenus={contenus} nbCommentaires={commentaires.length} />;
}
