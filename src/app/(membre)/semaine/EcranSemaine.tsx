import Link from "next/link";
import { Cadenas } from "@/components/Cadenas";
import { CarteDecompte } from "@/components/CarteDecompte";
import { BandeauVisite } from "@/components/IdentiteMembre";
import type { Utilisateur } from "@/lib/auth";
import { CONFIG_PROFILS } from "@/lib/profils";
import { seancesDuJour, type SeancePrevue, type SemaineProgramme } from "@/lib/programme";
import { organiserSaison, phaseDuMoment, type Objectif } from "@/lib/saison";
import { joursDeLaSemaine, titreSemaine } from "@/lib/semaine";
import { BandeJours, type SeanceCarte } from "./BandeJours";
import styles from "./semaine.module.css";

export type ProgrammeSemaine = { semaine: SemaineProgramme; seances: SeancePrevue[] };

/**
 * Ma semaine (maquette) : dates et phase, niveau et profil, décompte, bande des 7 jours et séances du jour.
 * programme : null tant que le membre n'a pas choisi son niveau et son profil.
 * Le programme reste dans l'app : ni export, ni PDF, ni impression (data-programme, voir globals.css).
 */
export function EcranSemaine({
  utilisateur,
  objectifs,
  aujourdhui,
  programme,
  testsFaits,
  faites = [],
}: {
  utilisateur: Utilisateur;
  objectifs: Objectif[];
  aujourdhui: string;
  programme: ProgrammeSemaine | null;
  testsFaits: boolean;
  /** Séances marquées faites cette semaine : « AAAA-MM-JJ|id de séance ». */
  faites?: string[];
}) {
  const saison = organiserSaison(objectifs, aujourdhui);
  const jours = joursDeLaSemaine(aujourdhui);
  const seances = programme
    ? Object.fromEntries(
        jours.map((j, i) => [
          j.iso,
          seancesDuJour(programme.seances, i + 1).map(
            ({ id, sport, titre, dureeMinutes }): SeanceCarte => ({ id, sport, titre, dureeMinutes, faite: faites.includes(`${j.iso}|${id}`) }),
          ),
        ]),
      )
    : null;
  const pastille = [
    utilisateur.niveau && CONFIG_PROFILS.niveaux[utilisateur.niveau].libelle,
    utilisateur.profil && CONFIG_PROFILS.profils[utilisateur.profil].libelle,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div data-programme style={{ display: "grid", gap: 16 }}>
      <BandeauVisite utilisateur={utilisateur} />
      <header className={styles.entete}>
        <div className={styles.enteteTexte}>
          <h1 className="titre" style={{ fontSize: 28, lineHeight: 1.1, color: "#fff" }}>
            Ma semaine
          </h1>
          <p className={styles.sousTitre}>
            {titreSemaine(jours)} · {phaseDuMoment(saison)}
          </p>
          {pastille ? (
            <p className={styles.pastille}>{pastille}</p>
          ) : (
            <Link href="/profil" className={`${styles.pastille} ${styles.pastilleVide}`}>
              Choisis ton niveau
            </Link>
          )}
        </div>
        <Link href="/saison" className={styles.boutonSaison}>
          Ma saison
        </Link>
      </header>
      <CarteDecompte prochain={saison.prochain} href="/saison" />
      {programme && !testsFaits && (
        <Link href="/tests" className={styles.verrou}>
          <Cadenas />
          <span className={styles.verrouTexte}>Allures verrouillées. Fais tes tests pour les voir.</span>
          <Chevron />
        </Link>
      )}
      <BandeJours jours={jours} aujourdhui={aujourdhui} seances={seances} />
    </div>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
