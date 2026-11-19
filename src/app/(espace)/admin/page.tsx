import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { AccueilAdmin } from "./AccueilAdmin";

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
  return <AccueilAdmin email={utilisateur.email} />;
}
