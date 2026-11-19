import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteEspace } from "@/components/EnTeteEspace";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Mon espace · Le Club by LCS" };

export default function PageAccueil() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre");
  return (
    <>
      <EnTeteEspace titre="Mon espace" email={utilisateur.email} />
      <section className="verre">
        <p className="message-info">Ton programme arrive bientôt. Lancement le 1er janvier 2027.</p>
      </section>
    </>
  );
}
