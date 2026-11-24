import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EcranAuth } from "@/components/EcranAuth";
import { exigerConnexion } from "@/lib/auth";
import { doitAccepter } from "@/lib/legal";
import { cheminAccueil } from "@/lib/roles";
import { FormulaireConditions } from "./FormulaireConditions";

export const metadata: Metadata = { title: "Nos conditions · Le Club by LCS" };

/** À la première connexion (ou quand les textes changent) : accepter les CGV et la politique de confidentialité. */
export default function PageConditions() {
  return (
    <EcranAuth titre="Avant de commencer">
      <Suspense fallback={null}>
        <Contenu />
      </Suspense>
    </EcranAuth>
  );
}

async function Contenu() {
  const u = await exigerConnexion();
  if (!doitAccepter(u)) redirect(cheminAccueil(u.role));
  return <FormulaireConditions nouvelleVersion={u.conditionsAcceptees !== null} />;
}
