import { redirect } from "next/navigation";
import { Suspense } from "react";
import { utilisateurConnecte } from "@/lib/auth";
import { cheminAccueil } from "@/lib/roles";

export default function Racine() {
  return (
    <Suspense fallback={null}>
      <Aiguillage />
    </Suspense>
  );
}

async function Aiguillage() {
  const utilisateur = await utilisateurConnecte();
  redirect(utilisateur ? cheminAccueil(utilisateur.role) : "/connexion");
  return null;
}
