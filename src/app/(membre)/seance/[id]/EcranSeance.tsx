import Link from "next/link";
import { Cadenas } from "@/components/Cadenas";
import { IconeSport } from "@/components/IconeSport";
import { Carte, PastilleZone } from "@/components/ui";
import type { Bornes } from "@/lib/config-zones";
import { cibleDuBloc, formatDuree, NOMS_SPORTS, type Seance } from "@/lib/programme";
import type { Ressenti } from "@/lib/ressenti";
import { libelleJour } from "@/lib/semaine";
import type { Tests } from "@/lib/zones";
import { SuiviSeance } from "./SuiviSeance";
import styles from "./seance.module.css";

/**
 * Séance ouverte (maquette) : sport, titre, durée, puis chaque bloc avec sa zone et l'allure du membre.
 * tests : derniers tests du membre (null : allures verrouillées) ; bornesPerso, bornesFc : ses zones personnalisées (sport de la séance, cardio).
 * suivi : jour de la séance et ressenti du membre (« Marquer comme faite », RPE, douleur, commentaire).
 * Le programme reste dans l'app : ni export, ni PDF, ni impression (data-programme).
 */
export function EcranSeance({
  seance,
  tests,
  bornesPerso = null,
  bornesFc = null,
  suivi,
}: {
  seance: Seance;
  tests: Tests | null;
  bornesPerso?: Bornes | null;
  bornesFc?: Bornes | null;
  suivi?: { jour: string; ressenti: Ressenti | null; interdit: string | null };
}) {
  const blocs = seance.blocs.map((b) => ({ ...b, cible: cibleDuBloc(seance.sport, b.zone, tests, bornesPerso, bornesFc) }));
  const verrouillee = blocs.some((b) => b.cible.type === "verrouillee");
  return (
    <div data-programme style={{ display: "grid", gap: 16 }}>
      <Link href="/semaine" className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Ma semaine
      </Link>
      <header className={styles.entete}>
        <IconeSport sport={seance.sport} grande />
        <div className={styles.enteteTexte}>
          <p className={styles.surtitre}>{NOMS_SPORTS[seance.sport]}</p>
          <h1 className="titre" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>
            {seance.titre}
          </h1>
          <p className={styles.duree}>
            {formatDuree(seance.dureeMinutes)}
            {suivi && ` · ${libelleJour(suivi.jour)}`}
          </p>
        </div>
      </header>

      <ol className={styles.blocs}>
        {blocs.map((b, i) => (
          <li key={i}>
            <Carte className={styles.bloc}>
              {b.zone ? <PastilleZone zone={b.zone} /> : <span className={styles.sansZone} aria-hidden />}
              <span className={styles.blocTexte}>
                <span className={styles.blocLibelle}>{b.libelle}</span>
                {b.detail && <span className={styles.blocDetail}>{b.detail}</span>}
              </span>
              {b.cible.type === "cible" && (
                <span className={styles.cible}>
                  <span className={styles.cibleValeur}>{b.cible.cible}</span>
                  {b.cible.frequenceCardiaque && <span className={styles.cibleFc}>{b.cible.frequenceCardiaque}</span>}
                </span>
              )}
              {b.cible.type === "verrouillee" && (
                <span className={styles.cadenas} role="img" aria-label="Allure verrouillée">
                  <Cadenas />
                </span>
              )}
            </Carte>
          </li>
        ))}
      </ol>

      {verrouillee && (
        <Link href="/tests" className="lien" style={{ fontWeight: 800 }}>
          Débloquer mes allures : faire mes tests
        </Link>
      )}
      {suivi && <SuiviSeance key={suivi.jour} seanceId={seance.id} jour={suivi.jour} ressenti={suivi.ressenti} interdit={suivi.interdit} />}
      <div style={{ height: 12 }} />
    </div>
  );
}
