import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";

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
  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Ressources" />
      <Carte as="section">
        <p className="message-info">Vidéos, fiches et conseils, débloqués au fil de ton ancienneté.</p>
      </Carte>
    </>
  );
}
