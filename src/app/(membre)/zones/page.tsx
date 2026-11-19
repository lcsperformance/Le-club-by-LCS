import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { BoutonPrincipal, Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sportDepuisAdresse } from "@/lib/zones";
import { AffichageZones } from "./AffichageZones";

export const metadata: Metadata = { title: "Mes zones · Le Club by LCS" };

export default function PageZones({ searchParams }: PageProps<"/zones">) {
  return (
    <>
      <Link href="/accueil" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, minHeight: 44 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Accueil
      </Link>
      <header>
        <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
          Mes zones
        </h1>
        <p style={{ fontSize: 15, color: "#a9a4c9", marginTop: 8, lineHeight: 1.45 }}>
          Calculées à partir de tes tests de départ.
        </p>
      </header>
      <Suspense fallback={<Chargement />}>
        <Contenu searchParams={searchParams} />
      </Suspense>
      <div style={{ height: 28 }} />
    </>
  );
}

async function Contenu({ searchParams }: Pick<PageProps<"/zones">, "searchParams">) {
  const utilisateur = await exigerRole("membre", "admin");
  const sport = sportDepuisAdresse((await searchParams).sport);

  const supabase = await createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("date_test, allure_seuil_course, ftp, vitesse_critique_natation, fc_seuil")
    .eq("membre_id", utilisateur.id)
    .order("date_test", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!test) {
    return (
      <Carte style={{ display: "grid", gap: 12 }}>
        <p className="message-info">Pour calculer tes zones, commence par tes tests de départ.</p>
        <BoutonPrincipal href="/tests">Faire mes tests</BoutonPrincipal>
      </Carte>
    );
  }

  return <AffichageZones sport={sport} test={test} />;
}
