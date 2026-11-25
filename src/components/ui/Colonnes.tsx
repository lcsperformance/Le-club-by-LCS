import type { ReactNode } from "react";
import styles from "./ui.module.css";

/*
 * Mises en page de la version ordinateur (à partir de 1100 px, src/lib/points-de-rupture.ts).
 * En dessous (téléphone, iPad), elles sont transparentes (display: contents) : leurs enfants
 * restent dans la colonne de la page, exactement comme sans elles.
 */

/** Cartes rangées en grille de 2 sur ordinateur, à la suite sur téléphone. */
export function GrilleCartes({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.grille} ${className}`}>{children}</div>;
}

/**
 * Deux colonnes sur ordinateur (principale à gauche, latérale à droite), à la suite sur téléphone.
 * collante : la colonne latérale reste visible quand la page défile.
 * Sans colonne latérale, la principale est limitée en largeur pour ne pas s'étirer.
 */
export function DeuxColonnes({ principale, laterale, collante = false }: { principale: ReactNode; laterale?: ReactNode; collante?: boolean }) {
  const avecLaterale = laterale !== undefined && laterale !== null && laterale !== false;
  return (
    <div className={`${styles.deuxColonnes} ${avecLaterale ? "" : styles.uneColonne}`}>
      <div className={styles.colonne}>{principale}</div>
      {avecLaterale && <div className={`${styles.colonne} ${collante ? styles.collante : ""}`}>{laterale}</div>}
    </div>
  );
}
