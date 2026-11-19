"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EtatFormulaire } from "@/app/connexion/actions";
import { demanderReinitialisation } from "./actions";

export function FormulaireOubli() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(demanderReinitialisation, {});

  if (etat.info) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <p className="verre message-info" role="status">
          {etat.info}
        </p>
        <Link href="/connexion" className="lien" style={{ textAlign: "center" }}>
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
      <p className="message-info" style={{ color: "var(--texte-doux)" }}>
        Indique l&apos;adresse e-mail de ton compte : on t&apos;envoie un lien pour choisir un nouveau mot de passe.
      </p>
      <label className="champ">
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="ton.adresse@exemple.fr"
          defaultValue={etat.email}
          required
        />
      </label>
      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <button type="submit" className="bouton-principal" disabled={enCours} style={{ marginTop: 6 }}>
        {enCours ? "Envoi…" : "Recevoir le lien"}
      </button>
      <p style={{ textAlign: "center", fontSize: 14 }}>
        <Link href="/connexion" className="lien">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
