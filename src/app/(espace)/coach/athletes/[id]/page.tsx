import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireAthletes, lireSeancesAthlete } from "@/lib/coach-serveur";
import { dateDuJourParis } from "@/lib/dates";
import { lireObjectifs } from "@/lib/saison-serveur";
import { AccueilCoach } from "../../AccueilCoach";
import { FicheAthlete } from "../../FicheAthlete";

export const metadata: Metadata = { title: "Fiche athlète · Espace coach · Le Club by LCS" };

export default function PageAthlete({ params }: PageProps<"/coach/athletes/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

/** Fiche d'un athlète, en lecture seule (la base n'accorde au coach aucune écriture). */
async function Contenu({ params }: Pick<PageProps<"/coach/athletes/[id]">, "params">) {
  const utilisateur = await exigerRole("coach", "admin");
  const { id } = await params;
  const athletes = await lireAthletes();
  const athlete = athletes.find((a) => a.id === id);
  if (!athlete) notFound();
  const [objectifs, seances] = await Promise.all([lireObjectifs(athlete.id), lireSeancesAthlete(athlete.id)]);
  return (
    <AccueilCoach
      email={utilisateur.email}
      athletes={athletes}
      choisi={athlete.id}
      fiche={<FicheAthlete athlete={athlete} objectifs={objectifs} seances={seances} aujourdhui={dateDuJourParis()} />}
    />
  );
}
