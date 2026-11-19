"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoutonPrincipal, Carte, Champ } from "@/components/ui";
import type { EtatFormulaire } from "@/app/connexion/actions";
import { demanderReinitialisation } from "./actions";

export function FormulaireOubli() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(demanderReinitialisation, {});

  if (etat.info) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Carte>
          <p className="message-info" role="status">
            {etat.info}
          </p>
        </Carte>
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
      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Envoi…" style={{ marginTop: 6 }}>
        Recevoir le lien
      </BoutonPrincipal>
      <p style={{ textAlign: "center", fontSize: 14 }}>
        <Link href="/connexion" className="lien">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
