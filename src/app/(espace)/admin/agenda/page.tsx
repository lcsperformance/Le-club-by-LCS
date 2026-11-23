import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireEvenements } from "@/lib/club-serveur";
import { EcranAgendaAdmin } from "./EcranAgendaAdmin";

export const metadata: Metadata = { title: "Agenda · Administration · Le Club by LCS" };

export default function PageAgendaAdmin() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  return <EcranAgendaAdmin evenements={await lireEvenements()} maintenant={new Date().toISOString()} />;
}
