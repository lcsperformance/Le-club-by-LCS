import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EcranAuth } from "@/components/EcranAuth";
import { utilisateurConnecte } from "@/lib/auth";
import { cheminAccueil } from "@/lib/roles";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion · Le Club by LCS" };

const MESSAGES: Record<string, string> = {
  "lien-invalide": "Ce lien n'est plus valable. Redemande un e-mail depuis « Mot de passe oublié ».",
  deconnecte: "Tu es déconnecté·e. À bientôt !",
};

export default function PageConnexion({ searchParams }: PageProps<"/connexion">) {
  return (
    <EcranAuth titre="Ta prépa triathlon, ton rythme.">
      <Suspense fallback={null}>
        <RedirigerSiConnecte />
        <Message searchParams={searchParams} />
      </Suspense>
      <FormulaireConnexion />
    </EcranAuth>
  );
}

/** Une personne déjà connectée va directement sur son espace. */
async function RedirigerSiConnecte() {
  const utilisateur = await utilisateurConnecte();
  if (utilisateur) redirect(cheminAccueil(utilisateur.role));
  return null;
}

async function Message({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const { message } = await searchParams;
  const texte = typeof message === "string" ? MESSAGES[message] : undefined;
  if (!texte) return null;
  return (
    <p className="message-info" role="status">
      {texte}
    </p>
  );
}
