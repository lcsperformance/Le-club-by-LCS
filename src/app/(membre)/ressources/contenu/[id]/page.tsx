import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { estDebloquee } from "@/lib/ressources";
import { lireCommentaires, lireMedias, lireRessource, lireSuivis, semaineDuMembre } from "@/lib/ressources-serveur";
import { EcranContenu } from "./EcranContenu";

export const metadata: Metadata = { title: "Ressources · Le Club by LCS" };

export default function PageContenu({ params }: PageProps<"/ressources/contenu/[id]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

async function Contenu({ params }: Pick<PageProps<"/ressources/contenu/[id]">, "params">) {
  const utilisateur = await exigerRole("membre", "admin");
  const ressource = await lireRessource((await params).id);
  if (!ressource) notFound();
  const semaine = semaineDuMembre(utilisateur);
  if (!estDebloquee(ressource, semaine)) return <EcranContenu ressource={ressource} semaine={semaine} />;

  const [medias, suivis, commentaires] = await Promise.all([
    lireMedias(),
    lireSuivis(utilisateur.id),
    ressource.type === "video" ? lireCommentaires(ressource.id, utilisateur.id) : Promise.resolve([]),
  ]);
  return (
    <EcranContenu
      ressource={ressource}
      semaine={semaine}
      media={medias[ressource.id]}
      suivi={suivis[ressource.id]}
      commentaires={commentaires}
      moderateur={utilisateur.role === "admin"}
    />
  );
}
