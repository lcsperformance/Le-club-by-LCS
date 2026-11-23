import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import type { Partenaire } from "@/lib/partenaires";
import { createClient } from "@/lib/supabase/server";
import { GestionPartenaires } from "./GestionPartenaires";

export const metadata: Metadata = { title: "Partenaires · Administration · Le Club by LCS" };

export default function PagePartenaires() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.from("partenaires").select("id, nom, remise, description, code, lien, ordre, affiche, exemple");
  if (error) console.error("Lecture des partenaires impossible", error.code, error.message);
  return <GestionPartenaires partenaires={(data ?? []) as Partenaire[]} />;
}
