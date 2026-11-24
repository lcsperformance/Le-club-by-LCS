import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteEspace } from "@/components/EnTeteEspace";
import type { CompteEquipe } from "@/lib/admin/equipe";
import { exigerRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EcranEquipe } from "./EcranEquipe";

export const metadata: Metadata = { title: "Équipe · Administration · Le Club by LCS" };

export default function PageEquipe() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

/** Réservée à l'admin. */
async function Contenu() {
  const utilisateur = await exigerRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase.from("membres").select("id, email, prenom, nom, role, affiche_coach");
  if (error) console.error("Lecture de l'équipe impossible", error.code, error.message);
  return (
    <>
      <EnTeteEspace titre="Équipe" email={utilisateur.email} />
      <Link className="lien" href="/admin" style={{ fontSize: 14 }}>
        ← Administration
      </Link>
      {error ? (
        <p className="message-erreur">Impossible de lire l&apos;équipe pour le moment. Recharge la page.</p>
      ) : (
        <EcranEquipe comptes={(data ?? []) as CompteEquipe[]} moi={utilisateur.id} />
      )}
    </>
  );
}
