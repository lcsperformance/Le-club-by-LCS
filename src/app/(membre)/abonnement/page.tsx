import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { configAbonnement } from "@/lib/abonnement/config";
import { aAccesEspace, exigerConnexion } from "@/lib/auth";
import { cheminAccueil } from "@/lib/roles";
import { EcranAbonnement } from "./EcranAbonnement";

export const metadata: Metadata = { title: "Mon abonnement · Le Club by LCS" };

export default function PageAbonnement() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerConnexion();
  const maintenant = new Date();
  // Accès ouvert : rien à faire ici, direction l'espace habituel.
  if (aAccesEspace(utilisateur, maintenant)) redirect(cheminAccueil(utilisateur.role));
  return <EcranAbonnement utilisateur={utilisateur} lienPaiement={configAbonnement.lienPaiement()} maintenant={maintenant} />;
}
