import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EcranAuth } from "@/components/EcranAuth";
import { utilisateurConnecte } from "@/lib/auth";
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

/** Cette page n'est accessible qu'après avoir cliqué sur le lien reçu par e-mail. */
async function ExigerSession() {
  if (!(await utilisateurConnecte())) redirect("/connexion?message=lien-invalide");
  return null;
}
