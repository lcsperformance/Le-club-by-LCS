import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Le Club · Le Club by LCS" };

export default function PageClub() {
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
      <EnTeteMembre utilisateur={utilisateur} titre="Le Club" />
      <Carte as="section">
        <p className="message-info">Les canaux du club et la boîte à questions.</p>
      </Carte>
    </>
  );
}
