import type { ComponentProps, ReactNode } from "react";
import styles from "./ui.module.css";

type Props = {
  libelle: string;
  name: string;
  /** Texte d'aide sous le champ. */
  aide?: string;
  /** Message d'erreur propre à ce champ. */
  erreur?: string;
  /** Bouton placé dans le champ, à droite (ex. « Afficher » du mot de passe). */
  bouton?: ReactNode;
} & Omit<ComponentProps<"input">, "name">;

/** Champ de saisie en verre, avec libellé, aide et erreur reliés pour les lecteurs d'écran. */
export function Champ({ libelle, name, aide, erreur, bouton, id, ...attributs }: Props) {
  const idChamp = id ?? `champ-${name}`;
  const idAide = aide ? `${idChamp}-aide` : undefined;
  const idErreur = erreur ? `${idChamp}-erreur` : undefined;
  const decrit = [idAide, idErreur].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.champ}>
      <label htmlFor={idChamp} className={styles.libelle}>
        {libelle}
      </label>
      {bouton ? (
        <div className={styles.saisieAvecBouton}>
          <input
            {...attributs}
            id={idChamp}
            name={name}
            className={styles.saisie}
            aria-invalid={erreur ? true : undefined}
            aria-describedby={decrit}
          />
          {bouton}
        </div>
      ) : (
        <input
          {...attributs}
          id={idChamp}
          name={name}
          className={styles.saisie}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrit}
        />
      )}
      {aide && (
        <p id={idAide} className={styles.aide}>
          {aide}
        </p>
      )}
      {erreur && (
        <p id={idErreur} className={styles.erreurChamp}>
          {erreur}
        </p>
      )}
    </div>
  );
}
