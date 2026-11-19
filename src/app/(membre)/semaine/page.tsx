import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Ma semaine · Le Club by LCS" };

export default function PageSemaine() {
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
      <EnTeteMembre utilisateur={utilisateur} titre="Ma semaine" />
      <Carte as="section">
        <p className="message-info">Tes séances de la semaine apparaîtront ici.</p>
      </Carte>
    </>
  );
}
