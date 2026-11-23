import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { lireCanaux, lireMessages, marquerCanalLu } from "@/lib/club-serveur";
import { dateDuJourParis } from "@/lib/dates";
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
  const canal = (await lireCanaux()).find((c) => c.cle === cle);
  if (!canal) notFound();
  const [{ messages, encore }] = await Promise.all([lireMessages(canal.cle), marquerCanalLu(canal.cle)]);
  return (
    <EcranCanal
      canal={canal}
      messages={messages}
      encore={encore}
      aujourdhui={dateDuJourParis()}
      moi={{ id: utilisateur.id, role: utilisateur.role }}
    />
  );
}
