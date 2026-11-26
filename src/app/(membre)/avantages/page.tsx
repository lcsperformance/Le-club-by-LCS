import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { COLONNES_PARTENAIRE, type Partenaire } from "@/lib/partenaires";
import { createClient } from "@/lib/supabase/server";
import { EcranAvantages } from "./EcranAvantages";

export const metadata: Metadata = { title: "Avantages · Le Club by LCS" };

export default function PageAvantages() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  const supabase = await createClient();
  // Les règles de la base ne donnent aux membres que les partenaires affichés.
  const { data, error } = await supabase.from("partenaires").select(COLONNES_PARTENAIRE).eq("affiche", true);
  if (error) console.error("Lecture des partenaires impossible", error.code, error.message);
  return <EcranAvantages utilisateur={utilisateur} partenaires={(data ?? []) as Partenaire[]} />;
}
