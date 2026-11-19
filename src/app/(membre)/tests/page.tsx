import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { valeursDeDepart } from "@/lib/tests-depart";
import { FormulaireTests } from "./FormulaireTests";

export const metadata: Metadata = { title: "Tests de départ · Le Club by LCS" };

export default function PageTests() {
  return (
    <>
      <Link href="/accueil" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, minHeight: 44 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Retour
      </Link>
      <header>
        <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
          Tes tests de départ
        </h1>
        <p style={{ fontSize: 15, color: "#a9a4c9", marginTop: 8, lineHeight: 1.45 }}>
          Quatre mesures à faire en autonomie, à ton rythme. Note ton résultat : l&apos;app calcule tes zones et tes
          allures.
        </p>
      </header>
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
