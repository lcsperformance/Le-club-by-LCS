import { Carte } from "@/components/ui";
import { dateSeance, niveauRpe, nomSport, trierSeances, type SeanceCoach } from "@/lib/coach";
import styles from "./coach.module.css";

/** Séances de l'athlète avec RPE et commentaire (lecture seule), de la plus récente à la plus ancienne. */
export function TableauSeances({ seances, aujourdhui }: { seances: SeanceCoach[]; aujourdhui: string }) {
  const liste = trierSeances(seances);
  return (
    <>
      <Carte as="section" className={styles.tableau} aria-label="Séances faites">
        <div className={styles.enteteTableau} aria-hidden>
          <span>Date</span>
          <span>Sport</span>
          <span>Séance</span>
          <span>RPE</span>
          <span>Commentaire</span>
        </div>
        {liste.length ? (
          <ul className={styles.seances}>
            {liste.map((s, i) => (
              <li key={`${s.date}-${i}`} className={styles.ligne}>
                <span className={`${styles.cellule} ${styles.date}`}>
                  <span className={styles.libelle}>Date</span>
                  {dateSeance(s.date, aujourdhui)}
                </span>
                <span className={`${styles.cellule} ${styles.sport}`}>
                  <span className={styles.libelle}>Sport</span>
                  {nomSport(s.sport)}
                </span>
                <span className={`${styles.cellule} ${styles.titreSeance}`}>
                  <span className={styles.libelle}>Séance</span>
                  {s.titre ?? "Séance retirée du programme"}
                </span>
                <span className={styles.cellule}>
                  <span className={styles.libelle}>RPE</span>
                  {s.rpe === null ? (
                    <span className={styles.non}>—</span>
                  ) : (
                    <span className={styles.rpe} data-niveau={niveauRpe(s.rpe)} aria-label={`RPE ${s.rpe} sur 10`}>
                      {s.rpe}
                    </span>
                  )}
                </span>
                <span className={`${styles.cellule} ${styles.commentaire}`}>
                  <span className={styles.libelle}>Commentaire</span>
                  {s.commentaire ?? <span className={styles.non}>—</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.aucune}>Aucune séance notée pour l&apos;instant.</p>
        )}
      </Carte>
    </>
  );
}
