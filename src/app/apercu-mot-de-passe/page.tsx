import { Suspense } from "react";
import { FormulaireNouveau } from "@/app/mot-de-passe/nouveau/FormulaireNouveau";
import { EcranAuth } from "@/components/EcranAuth";
import { exigerApercu } from "@/lib/apercu";

/** Aperçu de l'écran « Nouveau mot de passe » (mode test uniquement) : la vraie page exige le lien reçu par e-mail. */
export default function ApercuMotDePasse() {
  return (
    <Suspense fallback={null}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerApercu();
  return (
    <EcranAuth titre="Nouveau mot de passe">
      <FormulaireNouveau />
    </EcranAuth>
  );
}
