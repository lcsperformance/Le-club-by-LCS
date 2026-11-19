"use client";

import { useActionState } from "react";
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
      <label className="champ">
        Nouveau mot de passe
        <input type="password" name="mot_de_passe" autoComplete="new-password" required />
      </label>
      <label className="champ">
        Confirme le mot de passe
        <input type="password" name="confirmation" autoComplete="new-password" required />
      </label>
      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <button type="submit" className="bouton-principal" disabled={enCours} style={{ marginTop: 6 }}>
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
