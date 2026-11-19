import type { Metadata } from "next";
import { EcranAuth } from "@/components/EcranAuth";
import { FormulaireOubli } from "./FormulaireOubli";

export const metadata: Metadata = { title: "Mot de passe oublié · Le Club by LCS" };

export default function PageMotDePasseOublie() {
  return (
    <EcranAuth titre="Mot de passe oublié">
      <FormulaireOubli />
    </EcranAuth>
  );
}
