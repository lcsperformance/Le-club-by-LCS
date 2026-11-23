import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { prochaineFaq } from "@/lib/agenda";
import { exigerRole } from "@/lib/auth";
import { lireEvenements, lireQuestions } from "@/lib/club-serveur";
import { EcranQuestions } from "./EcranQuestions";

export const metadata: Metadata = { title: "Questions · Le Club · Le Club by LCS" };

export default function PageQuestions() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "coach", "admin");
  const [evenements, questions] = await Promise.all([lireEvenements(), lireQuestions()]);
  return <EcranQuestions utilisateur={utilisateur} prochaine={prochaineFaq(evenements, new Date())} questions={questions} />;
}
