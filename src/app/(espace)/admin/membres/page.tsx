import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteEspace } from "@/components/EnTeteEspace";
import type { LigneJournal, MembreAdmin } from "@/lib/admin/membres";
import { exigerRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EcranMembres } from "./EcranMembres";

export const metadata: Metadata = { title: "Membres · Administration · Le Club by LCS" };

export default function PageMembres() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

/** Réservée à l'admin : un membre ou un coach est renvoyé vers son propre accueil, sans rien lire. */
async function Contenu() {
  const utilisateur = await exigerRole("admin");
  const supabase = await createClient();
  const [{ data: membres, error }, { data: journal }] = await Promise.all([
    supabase
      .from("membres")
      .select(
        "id, email, prenom, niveau, statut_abonnement, abonnement_fin, annulation_prevue, formule, date_inscription, acces_offert_jusqua, acces_coupe",
      )
      .eq("role", "membre")
      .order("date_inscription", { ascending: false }),
    supabase.from("journal_admin").select("membre_id, action, detail, fait_le").order("fait_le", { ascending: false }).limit(500),
  ]);
  if (error) console.error("Lecture des membres impossible", error.code, error.message);

  return (
    <>
      <EnTeteEspace titre="Membres" email={utilisateur.email} />
      <Link className="lien" href="/admin" style={{ fontSize: 14 }}>
        ← Administration
      </Link>
      {error ? (
        <p className="message-erreur">Impossible de lire la liste des membres pour le moment. Recharge la page.</p>
      ) : (
        <EcranMembres
          membres={(membres ?? []) as MembreAdmin[]}
          journal={(journal ?? []) as LigneJournal[]}
          maintenant={new Date().toISOString()}
        />
      )}
    </>
  );
}
