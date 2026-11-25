"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./ui.module.css";

/**
 * Fenêtre par-dessus la page : panneau qui monte du bas sur téléphone et iPad (maquette),
 * fenêtre centrée sur ordinateur (à partir de 1100 px). Titre, bouton « Fermer » (qui reçoit le
 * focus à l'ouverture), touche Échap et clic sur le voile pour fermer.
 */
export function FeuilleModale({ titre, fermer, children }: { titre: string; fermer: () => void; children: ReactNode }) {
  const boutonFermer = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    boutonFermer.current?.focus();
    const touche = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [fermer]);

  return (
    <div className={styles.voile} onClick={(e) => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-feuille" className={styles.feuille}>
        <div className={styles.feuilleEntete}>
          <h2 id="titre-feuille" className="titre-carte" style={{ fontSize: 18 }}>
            {titre}
          </h2>
          <button ref={boutonFermer} type="button" className={styles.feuilleFermer} aria-label="Fermer" onClick={fermer}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
