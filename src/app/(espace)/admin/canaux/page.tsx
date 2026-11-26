import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireCanaux } from "@/lib/club-serveur";
import { createClient } from "@/lib/supabase/server";
import { GestionCanaux } from "./GestionCanaux";

export const metadata: Metadata = { title: "Canaux · Administration · Le Club by LCS" };

export default function PageCanaux() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  const supabase = await createClient();
  const canaux = await lireCanaux();
  // Nombre de messages par canal (affiché avant une suppression définitive).
  const comptes = await Promise.all(
    canaux.map(async (c) => {
      const { count } = await supabase.from("messages_club").select("id", { count: "exact", head: true }).eq("canal", c.cle);
      return [c.cle, count ?? 0] as const;
    }),
  );
  return <GestionCanaux canaux={canaux} messagesParCanal={Object.fromEntries(comptes)} />;
}
