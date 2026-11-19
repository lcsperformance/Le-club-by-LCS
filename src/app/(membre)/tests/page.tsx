import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { valeursDeDepart } from "@/lib/tests-depart";
import { EnTeteTests } from "./EnTeteTests";
import { FormulaireTests } from "./FormulaireTests";

export const metadata: Metadata = { title: "Tests de départ · Le Club by LCS" };

export default function PageTests() {
  return (
    <>
      <EnTeteTests />
      <Suspense fallback={<Chargement />}>
        <Formulaire />
      </Suspense>
      <div style={{ height: 28 }} />
    </>
  );
}

/** Reprend le dernier test du membre, ou les valeurs par défaut. */
async function Formulaire() {
  const utilisateur = await exigerRole("membre", "admin");
  const supabase = await createClient();
  const { data: dernier } = await supabase
    .from("tests")
    .select("allure_seuil_course, ftp, vitesse_critique_natation, fc_seuil")
    .eq("membre_id", utilisateur.id)
    .order("date_test", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <FormulaireTests valeursInitiales={valeursDeDepart(dernier)} />;
}
