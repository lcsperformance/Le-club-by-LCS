import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { BoutonPrincipal, Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bornesDuClub, sportDepuisAdresse } from "@/lib/zones";
import { bornesPersoApplicables } from "@/lib/zones-perso";
import { AffichageZones } from "./AffichageZones";
import { EnTeteZones } from "./EnTeteZones";

export const metadata: Metadata = { title: "Mes zones · Le Club by LCS" };

export default function PageZones({ searchParams }: PageProps<"/zones">) {
  return (
    <>
      <EnTeteZones />
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

  // Zones personnalisées du sport affiché, et zones cardio (ligne FC sous la course et le vélo).
  const { data: persos } = await supabase
    .from("zones")
    .select("sport, bornes")
    .eq("membre_id", utilisateur.id)
    .in("sport", sport === "cardio" ? ["cardio"] : [sport, "cardio"]);
  const enregistrees = (s: string) => persos?.find((p) => p.sport === s)?.bornes;

  return (
    <AffichageZones
      sport={sport}
      test={test}
      bornesEnregistrees={bornesPersoApplicables(enregistrees(sport), bornesDuClub(sport))}
      bornesFc={bornesPersoApplicables(enregistrees("cardio"), bornesDuClub("cardio"))}
      niveau={utilisateur.niveau}
      profil={utilisateur.profil}
    />
  );
}
