import { IconeTheme } from "@/components/IconeTheme";
import { Carte } from "@/components/ui";
import type { IconeTheme as Icone } from "@/lib/ressources";
import styles from "./ressources.module.css";

export type CarteTheme = { cle: string; nom: string; icone: Icone; compte: string };

/** Ressources (maquette) : calculateur, favoris, puis la grille des thèmes. */
export function EcranRessources({ themes, nbFavoris }: { themes: CarteTheme[]; nbFavoris: number }) {
  return (
    <>
      <header>
        <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
          Ressources
        </h1>
        <p className={styles.intro}>Classées par thème. Du nouveau chaque semaine d&apos;abonnement.</p>
      </header>

      <div className={styles.calculateur}>
        <span className={styles.calculateurIcone} aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fond)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M8 7h8M8 12h2M12 12h2M8 16h2M12 16h2" />
          </svg>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className={styles.calculateurTitre} style={{ display: "block" }}>
            Calculateur LCS Performance
          </span>
          <span className={styles.calculateurSous} style={{ display: "block" }}>
            L&apos;outil du site, bientôt dans l&apos;app
          </span>
        </span>
      </div>

      <Carte href="/ressources/favoris" className={styles.ligneFavoris}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--aurore)" stroke="var(--texte)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
        </svg>
        <span className={styles.ligneFavorisTexte}>Mes favoris</span>
        <span className={styles.compteur} aria-label={`${nbFavoris} favori${nbFavoris > 1 ? "s" : ""}`}>
          {nbFavoris}
        </span>
      </Carte>

      <h2 className={styles.surtitre}>Thèmes</h2>
      <ul className={styles.grille} style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {themes.map((t) => (
          <li key={t.cle} style={{ display: "grid" }}>
            <Carte href={`/ressources/${t.cle}`} className={styles.theme}>
              <IconeTheme icone={t.icone} className={styles.themeIcone} />
              <span className={styles.themeNom}>{t.nom}</span>
              <span className={styles.themeCompte}>{t.compte}</span>
            </Carte>
          </li>
        ))}
      </ul>
      <div style={{ height: 12 }} />
    </>
  );
}
