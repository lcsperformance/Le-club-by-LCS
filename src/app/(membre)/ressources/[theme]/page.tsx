import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { exigerRole } from "@/lib/auth";
import { favoris, sousRubriques, themeParCle, vueContenu } from "@/lib/ressources";
import { lireCatalogue, lireMedias, lireSuivis, lireThemes, semaineDuMembre } from "@/lib/ressources-serveur";
import { EcranTheme } from "../EcranTheme";

export const metadata: Metadata = { title: "Ressources · Le Club by LCS" };

export default function PageTheme({ params }: PageProps<"/ressources/[theme]">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu params={params} />
    </Suspense>
  );
}

/** Un thème, ou « Mes favoris » (/ressources/favoris). */
async function Contenu({ params }: Pick<PageProps<"/ressources/[theme]">, "params">) {
  const utilisateur = await exigerRole("membre", "admin");
  const { theme: cle } = await params;
  const themes = await lireThemes();
  const theme = themeParCle(themes, cle);
  if (cle !== "favoris" && !theme) notFound();

  const semaine = semaineDuMembre(utilisateur);
  const [catalogue, suivis, medias] = await Promise.all([lireCatalogue(), lireSuivis(utilisateur.id), lireMedias()]);
  const vue = (r: (typeof catalogue)[number]) => vueContenu(r, semaine, suivis[r.id], medias[r.id]);

  if (!theme) {
    return (
      <EcranTheme
        titre="Mes favoris"
        rubriques={[{ cle: "favoris", nom: "Contenus ajoutés en favoris", contenus: favoris(themes, catalogue, suivis, semaine).map(vue) }]}
        messageVide="Aucun favori pour l'instant. Touche l'étoile d'un contenu pour l'ajouter ici."
      />
    );
  }
  return (
    <EcranTheme
      titre={theme.nom}
      rubriques={sousRubriques(theme, catalogue).map((s) => ({ cle: s.cle, nom: s.nom, contenus: s.contenus.map(vue) }))}
      messageVide="Pas encore de contenu dans cette rubrique."
    />
  );
}
