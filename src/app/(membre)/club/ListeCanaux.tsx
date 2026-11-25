import { Cadenas } from "@/components/Cadenas";
import { Carte } from "@/components/ui";
import { badgeNonLus, type Canal } from "@/lib/club";
import styles from "./club.module.css";

/**
 * Liste des canaux collectifs (maquette) : badge de non-lus, « Mon bloc », cadenas des annonces.
 * actif : canal ouvert à côté (ordinateur), mis en valeur.
 */
export function ListeCanaux({
  canaux,
  nonLus,
  monBloc,
  actif = null,
}: {
  canaux: Canal[];
  nonLus: Record<string, number>;
  monBloc: string | null;
  actif?: string | null;
}) {
  return (
    <ul className={styles.canaux}>
      {canaux.map((c) => {
        const badge = badgeNonLus(nonLus[c.cle] ?? 0);
        return (
          <li key={c.cle}>
            <Carte
              href={`/club/${c.cle}`}
              className={`${styles.canal} ${actif === c.cle ? styles.canalActif : ""}`}
              aria-current={actif === c.cle ? "page" : undefined}
            >
              <span className={`${styles.diese} ${c.lecture_seule ? styles.dieseAnnonces : ""}`} aria-hidden>
                #
              </span>
              <span className={styles.canalTexte}>
                <span className={styles.canalNom}>
                  {c.nom}
                  {monBloc === c.cle && <span className={styles.monBloc}>Mon bloc</span>}
                </span>
                <span className={styles.canalDescription}>{c.description}</span>
              </span>
              {c.lecture_seule && (
                <span className={styles.cadenas} role="img" aria-label="Lecture seule">
                  <Cadenas />
                </span>
              )}
              {badge && (
                <span className={styles.nonLus} aria-label={`${badge} message${badge === "1" ? "" : "s"} non lu${badge === "1" ? "" : "s"}`}>
                  {badge}
                </span>
              )}
            </Carte>
          </li>
        );
      })}
    </ul>
  );
}
