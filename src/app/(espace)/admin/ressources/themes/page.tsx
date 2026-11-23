import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { lireContenusAdmin } from "@/lib/admin/ressources-serveur";
import { exigerRole } from "@/lib/auth";
import { lireThemes } from "@/lib/ressources-serveur";
import { RetourAdmin } from "../EcranAdminRessources";
import { GestionThemes } from "../GestionThemes";

export const metadata: Metadata = { title: "Thèmes et sous-rubriques · Administration · Le Club by LCS" };

export default function PageThemes() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  const [themes, contenus] = await Promise.all([lireThemes(), lireContenusAdmin()]);
  const contenusParRubrique: Record<string, number> = {};
  for (const c of contenus) contenusParRubrique[`${c.theme}/${c.sous_rubrique}`] = (contenusParRubrique[`${c.theme}/${c.sous_rubrique}`] ?? 0) + 1;
  return (
    <>
      <RetourAdmin href="/admin/ressources" libelle="Ressources" />
      <header>
        <h1 className="titre" style={{ fontSize: 26 }}>
          Thèmes et sous-rubriques
        </h1>
        <p style={{ marginTop: 6, fontSize: 13, color: "var(--texte-doux)" }}>
          Un thème ou une sous-rubrique ne peut être supprimé que s&apos;il ne contient plus aucun contenu.
        </p>
      </header>
      <GestionThemes themes={themes} contenusParRubrique={contenusParRubrique} />
    </>
  );
}
