import Link from "next/link";
import { nomAthlete, objectifsAVenir, type AthleteCoach, type SeanceCoach } from "@/lib/coach";
import { CONFIG_PROFILS } from "@/lib/profils";
import type { Objectif } from "@/lib/saison";
import styles from "./coach.module.css";
import { TableauSeances } from "./TableauSeances";

/**
 * Fiche d'un athlète (maquette Coach), en lecture seule : niveau, profil, objectifs à venir et séances.
 * Aucune modification ni aucun message privé : le coach répond dans le Club (canaux, boîte à questions).
 */
export function FicheAthlete({ athlete, objectifs, seances, aujourdhui }: { athlete: AthleteCoach; objectifs: Objectif[]; seances: SeanceCoach[]; aujourdhui: string }) {
  return (
    <section className={styles.fiche} aria-labelledby="titre-athlete">
      <Link href="/coach" className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Athlètes
      </Link>
      <div className={styles.entete}>
        <div>
          <h2 id="titre-athlete" className="titre" style={{ fontSize: 28, lineHeight: 1.1 }}>
            {nomAthlete(athlete)}
          </h2>
          <div className={styles.pastilles}>
            <span className={styles.pastilleNiveau}>{athlete.niveau ? `Niveau ${CONFIG_PROFILS.niveaux[athlete.niveau].libelle}` : "Niveau pas encore choisi"}</span>
            {athlete.profil && <span className={styles.pastille}>Profil {CONFIG_PROFILS.profils[athlete.profil].libelle.toLocaleLowerCase("fr-FR")}</span>}
            {objectifsAVenir(objectifs, aujourdhui).map((o) => (
              <span key={o} className={styles.pastille}>
                {o}
              </span>
            ))}
          </div>
        </div>
        <p className={styles.lectureSeule}>Historique en lecture seule, pour retrouver ses séances quand il ou elle pose une question.</p>
      </div>
      <TableauSeances seances={seances} aujourdhui={aujourdhui} />
    </section>
  );
}
