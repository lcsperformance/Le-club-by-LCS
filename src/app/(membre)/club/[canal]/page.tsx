import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { canalDuBloc } from "@/lib/club";
import { lireCanaux, lireMessages, lireNonLus, marquerCanalLu } from "@/lib/club-serveur";
import { dateDuJourParis } from "@/lib/dates";
import { organiserSaison } from "@/lib/saison";
import { lireObjectifs } from "@/lib/saison-serveur";
import { ListeCanauxEnDirect } from "../ListeCanauxEnDirect";
import { EcranCanal } from "./EcranCanal";

export const metadata: Metadata = { title: "Le Club · Le Club by LCS" };

export default function PageCanal({ params }: PageProps<"/club/[canal]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: Pick<PageProps<"/club/[canal]">, "params">) {
  // Le coach lit et écrit dans les canaux comme les membres (et seul, avec l'admin, dans « annonces »).
  const utilisateur = await exigerRole("membre", "coach", "admin");
  const { canal: cle } = await params;
  const canaux = await lireCanaux();
  const canal = canaux.find((c) => c.cle === cle);
  if (!canal) notFound();
  // Liste des canaux à gauche du fil sur ordinateur : mêmes lectures que la page /club.
  const [{ messages, encore }, , nonLus, objectifs] = await Promise.all([
    lireMessages(canal.cle),
    marquerCanalLu(canal.cle),
    lireNonLus(),
    lireObjectifs(utilisateur.id),
  ]);
  const monBloc = canalDuBloc(organiserSaison(objectifs, dateDuJourParis()).enCours?.bloc);
  return (
    <EcranCanal
      canal={canal}
      messages={messages}
      encore={encore}
      aujourdhui={dateDuJourParis()}
      moi={{ id: utilisateur.id, role: utilisateur.role }}
      // Le canal ouvert vient d'être marqué lu : pas de badge pour lui.
      liste={
        <ListeCanauxEnDirect canaux={canaux} nonLus={{ ...nonLus, [canal.cle]: 0 }} monBloc={monBloc} actif={canal.cle} moi={utilisateur.id} />
      }
    />
  );
}
