import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EcranBientot } from "@/components/EcranBientot";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Mes records · Le Club by LCS" };

export default function PageRecords() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("membre", "admin");
  return <EcranBientot titre="Mes records" description="Tes meilleures performances, au fil de tes séances." />;
}
