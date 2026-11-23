import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { canalDuBloc } from "@/lib/club";
import { lireCanaux, lireNonLus } from "@/lib/club-serveur";
import { dateDuJourParis } from "@/lib/dates";
import { organiserSaison } from "@/lib/saison";
import { lireObjectifs } from "@/lib/saison-serveur";
import { EcranClub } from "./EcranClub";

export const metadata: Metadata = { title: "Le Club · Le Club by LCS" };

export default function PageClub() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  // Le coach lit et écrit dans les canaux comme les membres (et seul, avec l'admin, dans « annonces »).
  const utilisateur = await exigerRole("membre", "coach", "admin");
  const [canaux, nonLus, objectifs] = await Promise.all([lireCanaux(), lireNonLus(), lireObjectifs(utilisateur.id)]);
  const monBloc = canalDuBloc(organiserSaison(objectifs, dateDuJourParis()).enCours?.bloc);
  return <EcranClub utilisateur={utilisateur} canaux={canaux} nonLus={nonLus} monBloc={monBloc} />;
}
