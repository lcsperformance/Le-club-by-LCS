import Link from "next/link";
import { Carte } from "@/components/ui";
import { URL_CALCULATEUR } from "@/lib/calculateur";
import styles from "../ressources.module.css";

/**
 * Calculateur LCS Performance (maquette) : la page du site dans un cadre, avec le bandeau « lcsperformance.fr »
 * et « Ouvrir dans le navigateur » dessous. Si le site refuse l'affichage intégré (integrable = false),
 * pas de cadre vide : une explication et un grand bouton pour l'ouvrir sur le site.
 * adresseCadre : page chargée dans le cadre (les aperçus passent « about:blank » pour ne pas dépendre du site).
 */
export function EcranCalculateur({ integrable, adresseCadre = URL_CALCULATEUR }: { integrable: boolean; adresseCadre?: string }) {
  return (
    <>
      <Link href="/ressources" className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Ressources
      </Link>
      <header>
        <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
          Calculateur LCS
        </h1>
        <p className={styles.intro} style={{ marginTop: 8, fontSize: 15 }}>
          L&apos;outil du site LCS Performance, directement dans l&apos;app.
        </p>
      </header>

      {integrable ? (
        <>
          <div className={styles.cadreCalculateur}>
            <p className={styles.barreSite}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 018 0v3" />
              </svg>
              lcsperformance.fr
            </p>
            <iframe src={adresseCadre} title="Calculateur LCS Performance" className={styles.calculateurPage} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          </div>
          <a href={URL_CALCULATEUR} target="_blank" rel="noopener noreferrer" className={`${styles.bouton} ${styles.boutonFavori}`}>
            Ouvrir dans le navigateur
          </a>
        </>
      ) : (
        <Carte style={{ display: "grid", gap: 14 }}>
          <p className="message-info">
            Le calculateur s&apos;ouvre sur le site LCS Performance, dans ton navigateur. Reviens ensuite dans l&apos;app : tu restes connecté.
          </p>
          <a href={URL_CALCULATEUR} target="_blank" rel="noopener noreferrer" className={`${styles.bouton} ${styles.boutonSuivi}`} style={{ height: 52, fontSize: 16 }}>
            Ouvrir le calculateur
          </a>
        </Carte>
      )}
      <div style={{ height: 12 }} />
    </>
  );
}
