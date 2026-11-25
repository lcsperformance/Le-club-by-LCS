import type { ReactNode } from "react";
import { RetourAdmin } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import { DeuxColonnes } from "@/components/ui";

/**
 * Page d'un formulaire de l'administration (ajouter ou modifier un contenu, un événement) :
 * lien de retour, titre, formulaire ; une colonne centrée de 720 px sur ordinateur.
 * Utilisée par les vraies pages et par leurs aperçus.
 */
export function PageFormulaire({ retour, titre, children }: { retour: { href: string; libelle: string }; titre: string; children: ReactNode }) {
  return (
    <DeuxColonnes
      principale={
        <>
          <RetourAdmin href={retour.href} libelle={retour.libelle} />
          <h1 className="titre" style={{ fontSize: 26 }}>
            {titre}
          </h1>
          {children}
        </>
      }
    />
  );
}
