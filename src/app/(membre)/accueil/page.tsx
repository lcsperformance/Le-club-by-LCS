import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";
import { formatJourFr } from "@/lib/dates";

export const metadata: Metadata = { title: "Accueil · Le Club by LCS" };

export default function PageAccueil() {
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
      <EnTeteMembre utilisateur={utilisateur} titre="Salut !" sousTitre={formatJourFr(new Date())} />
      <Carte as="section">
        <p className="message-info">Ton programme arrive bientôt. Lancement le 1er janvier 2027.</p>
      </Carte>
    </>
  );
}
