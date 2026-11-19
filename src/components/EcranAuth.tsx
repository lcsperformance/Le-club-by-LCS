import type { ReactNode } from "react";
import styles from "./EcranAuth.module.css";

/** Mise en page des écrans de connexion : halos, logo « le club », contenu en bas. */
export function EcranAuth({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <main className={styles.ecran}>
      <div className={styles.halo} aria-hidden />
      <div className={styles.point} aria-hidden />
      <div className={styles.logo}>
        <div className={`logo ${styles.club}`}>
          le
          <br />
          club
        </div>
        <div className={styles.signature}>by LCS Performance</div>
      </div>
      <div className={styles.espace} />
      <div className={styles.contenu}>
        <h1 className={`titre ${styles.titre}`}>{titre}</h1>
        {children}
      </div>
    </main>
  );
}
