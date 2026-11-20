import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireObjectifs } from "@/lib/saison-serveur";
import { createClient } from "@/lib/supabase/server";
import { AccueilMembre } from "./AccueilMembre";

export const metadata: Metadata = { title: "Accueil · Le Club by LCS" };

export default function PageAccueil() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  const supabase = await createClient();
  const [{ count }, objectifs] = await Promise.all([
    supabase.from("tests").select("id", { count: "exact", head: true }).eq("membre_id", utilisateur.id),
    lireObjectifs(utilisateur.id),
  ]);

  return <AccueilMembre utilisateur={utilisateur} testsFaits={(count ?? 0) > 0} objectifs={objectifs} aujourdhui={new Date()} />;
}
