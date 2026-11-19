import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EcranAuth } from "@/components/EcranAuth";
import { peutChoisirNouveauMotDePasse } from "@/lib/auth";
import { FormulaireNouveau } from "./FormulaireNouveau";

export const metadata: Metadata = { title: "Nouveau mot de passe · Le Club by LCS" };

export default function PageNouveauMotDePasse() {
  return (
    <EcranAuth titre="Nouveau mot de passe">
      <Suspense fallback={null}>
        <ExigerSession />
      </Suspense>
      <FormulaireNouveau />
    </EcranAuth>
  );
}

/** Cette page n'est accessible que dans les 15 minutes qui suivent le lien reçu par e-mail. */
async function ExigerSession() {
  if (!(await peutChoisirNouveauMotDePasse())) redirect("/connexion?message=lien-invalide");
  return null;
}
