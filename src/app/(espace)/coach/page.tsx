import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { AccueilCoach } from "./AccueilCoach";

export const metadata: Metadata = { title: "Espace coach · Le Club by LCS" };

export default function PageCoach() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("coach", "admin");
  return <AccueilCoach email={utilisateur.email} />;
}
