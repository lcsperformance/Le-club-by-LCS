import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { historiqueSport } from "@/lib/historique-serveur";
import { sportProgres } from "@/lib/progres";
import { createClient } from "@/lib/supabase/server";
import { EcranProgres } from "./EcranProgres";

export const metadata: Metadata = { title: "Mes progrès · Le Club by LCS" };

export default function PageProgres({ searchParams }: PageProps<"/progres">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({ searchParams }: Pick<PageProps<"/progres">, "searchParams">) {
  const utilisateur = await exigerRole("membre", "admin");
  const sport = sportProgres((await searchParams).sport);
  const supabase = await createClient();
  const [points, { count }] = await Promise.all([
    historiqueSport(sport, utilisateur.id),
    supabase.from("tests").select("id", { count: "exact", head: true }).eq("membre_id", utilisateur.id),
  ]);
  return <EcranProgres sport={sport} points={points} testsFaits={(count ?? 0) > 0} />;
}
