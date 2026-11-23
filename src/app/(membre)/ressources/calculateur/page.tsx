import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { calculateurIntegrable } from "@/lib/calculateur-serveur";
import { EcranCalculateur } from "./EcranCalculateur";

export const metadata: Metadata = { title: "Calculateur LCS · Le Club by LCS" };

export default function PageCalculateur() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("membre", "admin");
  return <EcranCalculateur integrable={await calculateurIntegrable()} />;
}
