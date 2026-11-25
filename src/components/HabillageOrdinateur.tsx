import { SymboleClub } from "./SymboleClub";
import styles from "./HabillageOrdinateur.module.css";

/**
 * Sur grand écran (1100 px et plus), deux panneaux fixes de part et d'autre de la colonne du téléphone :
 * la marque à gauche, un mot sur l'installation à droite. Invisible sur téléphone et tablette.
 */
export function HabillageOrdinateur() {
  return (
    <>
      <aside className={`${styles.cote} ${styles.gauche}`} aria-hidden>
        <div className={styles.marque}>
          <SymboleClub hauteur={84} />
          <div className={`logo ${styles.nom}`}>
            le
            <br />
            club
          </div>
          <div className={styles.signature}>by LCS Performance</div>
          <p className={`titre ${styles.accroche}`}>Ta prépa triathlon, ton rythme.</p>
        </div>
      </aside>
      <aside className={`${styles.cote} ${styles.droite}`} aria-hidden>
        <div className={styles.note}>
          <div className={styles.noteTitre}>Pensé pour le téléphone</div>
          <div className={styles.noteTexte}>
            Ouvre le Club sur ton téléphone et ajoute-le à ton écran d&apos;accueil pour l&apos;avoir toujours sous la main.
          </div>
        </div>
      </aside>
    </>
  );
}
