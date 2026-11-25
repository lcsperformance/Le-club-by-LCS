import Link from "next/link";
import { Cadenas } from "@/components/Cadenas";
import { CarteDecompte } from "@/components/CarteDecompte";
import { BandeauVisite } from "@/components/IdentiteMembre";
import type { Utilisateur } from "@/lib/auth";
import { CONFIG_PROFILS } from "@/lib/profils";
import { seancesDuJour, type SeancePrevue, type SemaineProgramme } from "@/lib/programme";
import { organiserSaison, phaseDuMoment, type Objectif } from "@/lib/saison";
import { joursDeLaSemaine, lundiDe, titreSemaine } from "@/lib/semaine";
import { BandeJours, type SeanceCarte } from "./BandeJours";
import styles from "./semaine.module.css";

export type ProgrammeSemaine = { semaine: SemaineProgramme; seances: SeancePrevue[] };

/**
 * Ma semaine (maquette) : dates et phase, niveau et profil, décompte, bande des 7 jours et séances du jour.
 * programme : null tant que le membre n'a pas choisi son niveau et son profil.
 * lundi : semaine affichée (la semaine en cours par défaut) ; navigation : semaines voisines accessibles.
 * Le programme reste dans l'app : ni export, ni PDF, ni impression (data-programme, voir globals.css).
 */
export function EcranSemaine({
  utilisateur,
  objectifs,
  aujourdhui,
  programme,
  testsFaits,
  faites = [],
  lundi = lundiDe(aujourdhui),
  navigation = { precedente: null, suivante: null },
}: {
  utilisateur: Utilisateur;
  objectifs: Objectif[];
  aujourdhui: string;
  programme: ProgrammeSemaine | null;
  testsFaits: boolean;
  /** Séances marquées faites cette semaine : « AAAA-MM-JJ|id de séance ». */
  faites?: string[];
  lundi?: string;
  navigation?: { precedente: string | null; suivante: string | null };
}) {
  const courante = lundi === lundiDe(aujourdhui);
  // Décompte : toujours depuis aujourd'hui. Phase : celle de la semaine affichée (son lundi, ou aujourd'hui).
  const saison = organiserSaison(objectifs, aujourdhui);
  const saisonAffichee = courante ? saison : organiserSaison(objectifs, lundi);
  const jours = joursDeLaSemaine(lundi);
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
      <BandeJours
        key={lundi}
        jours={jours}
        aujourdhui={aujourdhui}
        seances={seances}
        avant={
          <>
          <header className={styles.entete}>
            <div className={styles.enteteTexte}>
              <h1 className="titre" style={{ fontSize: 28, lineHeight: 1.1, color: "#fff" }}>
                Ma semaine
              </h1>
              <p className={styles.sousTitre}>
                {titreSemaine(jours)} · {phaseDuMoment(saisonAffichee)}
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
          <nav className={styles.navSemaine} aria-label="Changer de semaine">
            <Fleche vers={navigation.precedente} sens="precedente" />
            {courante ? (
              <span className={styles.navTexte}>Cette semaine</span>
            ) : (
              <Link href="/semaine" className={`${styles.navTexte} lien`} scroll={false}>
                Revenir à cette semaine
              </Link>
            )}
            <Fleche vers={navigation.suivante} sens="suivante" />
          </nav>
          </>
        }
      />
    </div>
  );
}

/** Flèche vers la semaine précédente ou suivante ; grisée en bout de course (inscription, fin de la période payée). */
function Fleche({ vers, sens }: { vers: string | null; sens: "precedente" | "suivante" }) {
  const libelle = sens === "precedente" ? "Semaine précédente" : "Semaine suivante";
  const trace = sens === "precedente" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7";
  const icone = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={trace} />
    </svg>
  );
  return vers ? (
    <Link href={`/semaine?du=${vers}`} className={styles.fleche} aria-label={libelle} scroll={false}>
      {icone}
    </Link>
  ) : (
    <span className={styles.fleche} aria-disabled="true" title={sens === "suivante" ? "Au-delà de ta période d'abonnement" : undefined}>
      {icone}
    </span>
  );
}

function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
