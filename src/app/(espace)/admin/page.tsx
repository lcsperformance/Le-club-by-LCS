import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteEspace } from "@/components/EnTeteEspace";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Administration · Le Club by LCS" };

export default function PageAdmin() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("admin");
  return (
    <>
      <EnTeteEspace titre="Administration" email={utilisateur.email} />
      <section className="verre">
        <p className="message-info">Ici, tu géreras les membres, leurs rôles et leurs abonnements.</p>
      </section>
    </>
  );
}
