"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BoutonPrincipal } from "@/components/ui";
import { accepterConditions, type EtatConditions } from "./actions";
import styles from "./conditions.module.css";

/** Case d'acceptation des CGV et de la politique de confidentialité (liens ouverts dans un nouvel onglet). */
export function FormulaireConditions({ nouvelleVersion }: { nouvelleVersion: boolean }) {
  const [etat, action, enCours] = useActionState<EtatConditions, FormData>(accepterConditions, {});
  return (
    <form action={action} className={styles.formulaire} noValidate>
      <p className={styles.texte}>
        {nouvelleVersion
          ? "Nos conditions ont changé. Prends un instant pour les relire avant de continuer."
          : "Bienvenue ! Avant d'entrer dans le Club, prends un instant pour lire nos conditions."}
      </p>
      <ul className={styles.liens}>
        <li>
          <Link href="/cgv" target="_blank" className="lien">
            Conditions générales de vente
          </Link>
        </li>
        <li>
          <Link href="/confidentialite" target="_blank" className="lien">
            Politique de confidentialité
          </Link>
        </li>
        <li>
          <Link href="/mentions-legales" target="_blank" className="lien">
            Mentions légales
          </Link>
        </li>
      </ul>
      <label className={styles.case}>
        <input type="checkbox" name="accord" value="oui" required />
        <span>J&apos;ai lu et j&apos;accepte les conditions générales de vente et la politique de confidentialité.</span>
      </label>
      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Un instant…">
        Continuer
      </BoutonPrincipal>
    </form>
  );
}
