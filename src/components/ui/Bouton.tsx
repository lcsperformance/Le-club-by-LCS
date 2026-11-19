import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import styles from "./ui.module.css";

type Commun = {
  children: ReactNode;
  /** Largeur ajustée au contenu au lieu de toute la largeur. */
  compact?: boolean;
  /** Affiche le texte d'attente et bloque le bouton. */
  enCours?: boolean;
  texteEnCours?: string;
};

type PropsBouton = Commun & { href?: undefined } & Omit<ComponentProps<"button">, "children">;
type PropsLien = Commun & { href: string } & Omit<ComponentProps<typeof Link>, "children" | "href">;

function fabriquer(variante: "principal" | "secondaire") {
  function Bouton(props: PropsBouton | PropsLien) {
    const { children, compact, enCours, texteEnCours, className = "", ...reste } = props;
    const classes = `${styles.bouton} ${styles[variante]} ${compact ? styles.compact : ""} ${className}`;
    const contenu = enCours && texteEnCours ? texteEnCours : children;

    if (reste.href !== undefined) {
      return (
        <Link {...(reste as Omit<PropsLien, keyof Commun>)} className={classes}>
          {contenu}
        </Link>
      );
    }
    const { type = "button", disabled, ...attributs } = reste as Omit<PropsBouton, keyof Commun>;
    return (
      <button
        {...attributs}
        type={type}
        className={classes}
        disabled={disabled || enCours}
        aria-busy={enCours || undefined}
      >
        {contenu}
      </button>
    );
  }
  Bouton.displayName = variante === "principal" ? "BoutonPrincipal" : "BoutonSecondaire";
  return Bouton;
}

/** Bouton principal jaune-vert avec ombre colorée. Un seul par écran, idéalement. */
export const BoutonPrincipal = fabriquer("principal");

/** Bouton secondaire en verre, pour les actions moins importantes. */
export const BoutonSecondaire = fabriquer("secondaire");
