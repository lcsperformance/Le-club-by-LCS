"use client";

import { useActionState } from "react";
import { BoutonPrincipal, Champ } from "@/components/ui";
import type { EtatFormulaire } from "@/app/connexion/actions";
import { LONGUEUR_MIN_MOT_DE_PASSE } from "@/lib/mot-de-passe";
import { changerMotDePasse } from "./actions";

export function FormulaireNouveau() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(changerMotDePasse, {});

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
      <p className="message-info" style={{ color: "var(--texte-doux)" }}>
        Au moins {LONGUEUR_MIN_MOT_DE_PASSE} caractères, avec au moins une lettre et un chiffre.
      </p>
      <Champ libelle="Nouveau mot de passe" name="mot_de_passe" type="password" autoComplete="new-password" required />
      <Champ libelle="Confirme le mot de passe" name="confirmation" type="password" autoComplete="new-password" required />
      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Enregistrement…" style={{ marginTop: 6 }}>
        Enregistrer
      </BoutonPrincipal>
    </form>
  );
}
