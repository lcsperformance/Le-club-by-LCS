import Link from "next/link";
import type { VueContenu } from "@/lib/ressources";
import { CarteContenu } from "./CarteContenu";
import styles from "./ressources.module.css";

export type Rubrique = { cle: string; nom: string; contenus: VueContenu[] };

/** Un thème des Ressources (ou « Mes favoris ») : ses sous-rubriques et leurs contenus. */
export function EcranTheme({ titre, rubriques, messageVide }: { titre: string; rubriques: Rubrique[]; messageVide?: string }) {
  return (
    <>
      <Link href="/ressources" className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Ressources
      </Link>
      <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
        {titre}
      </h1>
      {!rubriques.length && <p className={styles.vide}>{messageVide}</p>}
      {rubriques.map((r) => (
        <section key={r.cle} className={styles.rubrique} aria-labelledby={`rubrique-${r.cle}`}>
          <h2 id={`rubrique-${r.cle}`} className={styles.rubriqueNom}>
            {r.nom}
          </h2>
          {r.contenus.length ? (
            <ul className={`${styles.liste} ${styles.listeContenus}`}>
              {r.contenus.map((c) => (
                <CarteContenu key={c.id} c={c} />
              ))}
            </ul>
          ) : (
            <p className={styles.vide}>{messageVide}</p>
          )}
        </section>
      ))}
      <div style={{ height: 12 }} />
    </>
  );
}
