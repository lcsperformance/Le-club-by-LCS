"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoutonPrincipal, Champ } from "@/components/ui";
import { seConnecter, type EtatFormulaire } from "./actions";

export function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(seConnecter, {});

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
      <Champ
        libelle="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="ton.adresse@exemple.fr"
        defaultValue={etat.email}
        required
      />
      <Champ
        libelle="Mot de passe"
        name="mot_de_passe"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />
      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Connexion…" style={{ marginTop: 6 }}>
        Se connecter
      </BoutonPrincipal>
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
