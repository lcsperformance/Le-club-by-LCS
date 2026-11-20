import Link from "next/link";
import { CarteDecompte } from "@/components/CarteDecompte";
import { BandeauVisite } from "@/components/IdentiteMembre";
import type { Utilisateur } from "@/lib/auth";
import { CONFIG_PROFILS } from "@/lib/profils";
import { organiserSaison, phaseDuMoment, type Objectif } from "@/lib/saison";
import { joursDeLaSemaine, titreSemaine } from "@/lib/semaine";
import { BandeJours } from "./BandeJours";
import styles from "./semaine.module.css";

/** Ma semaine (maquette) : dates et phase, niveau et profil, décompte, bande des 7 jours. */
export function EcranSemaine({ utilisateur, objectifs, aujourdhui }: { utilisateur: Utilisateur; objectifs: Objectif[]; aujourdhui: string }) {
  const saison = organiserSaison(objectifs, aujourdhui);
  const jours = joursDeLaSemaine(aujourdhui);
  const pastille = [
    utilisateur.niveau && CONFIG_PROFILS.niveaux[utilisateur.niveau].libelle,
    utilisateur.profil && CONFIG_PROFILS.profils[utilisateur.profil].libelle,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
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
      <BandeJours jours={jours} aujourdhui={aujourdhui} />
    </>
  );
}
