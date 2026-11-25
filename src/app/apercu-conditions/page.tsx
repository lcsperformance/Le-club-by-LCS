import { Suspense } from "react";
import { FormulaireConditions } from "@/app/conditions/FormulaireConditions";
import { EcranAuth } from "@/components/EcranAuth";
import { exigerApercu } from "@/lib/apercu";

/**
 * Aperçu de l'écran « Avant de commencer » (mode test uniquement), hors de l'espace membre
 * comme la vraie page /conditions : même mise en page sur téléphone et sur ordinateur.
 */
export default function ApercuConditions() {
  return (
    <Suspense fallback={null}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerApercu();
  return (
    <EcranAuth titre="Avant de commencer">
      <FormulaireConditions nouvelleVersion={false} />
    </EcranAuth>
  );
}
