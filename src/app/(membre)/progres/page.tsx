import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EcranBientot } from "@/components/EcranBientot";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Mes progrès · Le Club by LCS" };

export default function PageProgres() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("membre", "admin");
  return <EcranBientot titre="Mes progrès" description="Les courbes de tes tests de départ, sport par sport." />;
}
