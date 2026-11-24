import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { profilSuggere } from "@/lib/profil-suggere";
import { createClient } from "@/lib/supabase/server";
import { EcranProfil } from "./EcranProfil";

export const metadata: Metadata = { title: "Mon profil · Le Club by LCS" };

export default function PageProfil() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  // Dernier test, pour suggérer un profil (FTP et puissance max sur 5 min).
  const supabase = await createClient();
  const { data: test } = await supabase
    .from("tests")
    .select("ftp, pma_5min")
    .eq("membre_id", utilisateur.id)
    .order("date_test", { ascending: false })
    .limit(1)
    .maybeSingle();
  return <EcranProfil utilisateur={utilisateur} maintenant={new Date()} suggestion={profilSuggere(test)} />;
}
