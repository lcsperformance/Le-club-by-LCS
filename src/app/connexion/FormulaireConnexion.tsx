"use client";

import Link from "next/link";
import { useActionState } from "react";
import { seConnecter, type EtatFormulaire } from "./actions";

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(seConnecter, {});

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
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
      <label className="champ">
        Mot de passe
        <input type="password" name="mot_de_passe" autoComplete="current-password" placeholder="••••••••" required />
      </label>
      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <button type="submit" className="bouton-principal" disabled={enCours} style={{ marginTop: 6 }}>
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
      <p style={{ textAlign: "center", fontSize: 14 }}>
        <Link href="/mot-de-passe-oublie" className="lien">
          Mot de passe oublié ?
        </Link>
      </p>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--texte-doux)", lineHeight: 1.4 }}>
        Tes identifiants t&apos;ont été envoyés à ton inscription.
        <br />
        Un souci de connexion ? Écris-nous.
      </p>
    </form>
  );
}
