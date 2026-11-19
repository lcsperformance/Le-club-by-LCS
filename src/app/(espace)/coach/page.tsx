import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteEspace } from "@/components/EnTeteEspace";
import { Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Espace coach · Le Club by LCS" };

export default function PageCoach() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("coach", "admin");
  return (
    <>
      <EnTeteEspace titre="Espace coach" email={utilisateur.email} />
      <Carte as="section">
        <p className="message-info">Ici, tu verras l&apos;historique de chaque athlète, en lecture seule.</p>
      </Carte>
    </>
  );
}
