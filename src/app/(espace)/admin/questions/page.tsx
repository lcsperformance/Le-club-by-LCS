import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireQuestions } from "@/lib/club-serveur";
import { EcranQuestionsAdmin } from "./EcranQuestionsAdmin";

export const metadata: Metadata = { title: "Boîte à questions · Administration · Le Club by LCS" };

export default function PageQuestionsAdmin() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  return <EcranQuestionsAdmin questions={await lireQuestions()} />;
}
