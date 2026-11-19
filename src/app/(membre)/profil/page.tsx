import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { EcranProfil } from "./EcranProfil";

export const metadata: Metadata = { title: "Mon profil · Le Club by LCS" };

export default function PageProfil() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  return <EcranProfil utilisateur={utilisateur} />;
}
