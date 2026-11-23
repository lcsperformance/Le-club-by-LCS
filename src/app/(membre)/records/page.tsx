import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { estEpreuve, type Records } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";
import { EcranRecords } from "./EcranRecords";

export const metadata: Metadata = { title: "Mes records · Le Club by LCS" };

export default function PageRecords() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  const supabase = await createClient();
  const { data, error } = await supabase.from("records").select("epreuve, duree_secondes").eq("membre_id", utilisateur.id);
  if (error) console.error("Lecture des records impossible", error.code, error.message);
  const records: Records = {};
  for (const r of data ?? []) if (estEpreuve(r.epreuve) && typeof r.duree_secondes === "number") records[r.epreuve] = r.duree_secondes;
  return <EcranRecords records={records} />;
}
