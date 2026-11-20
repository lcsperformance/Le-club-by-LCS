import { BandeauVisite, PastilleProfil } from "@/components/IdentiteMembre";
import type { Utilisateur } from "@/lib/auth";
import { formatJourFr } from "@/lib/dates";
import styles from "./EnTeteAccueil.module.css";

/** « Salut Caroline » si le prénom est connu, sinon « Salut ! ». */
export const salutation = (prenom: string | null) => (prenom ? `Salut ${prenom}` : "Salut !");

/** En-tête de l'accueil, comme la maquette : bandeau rose, logo, pastille, salutation, date et phase (« semaine 2 du bloc S » ou « fil rouge »). */
export function EnTeteAccueil({ utilisateur, aujourdhui, phase }: { utilisateur: Utilisateur; aujourdhui: Date; phase: string }) {
  return (
    <>
      <header className={styles.bandeau}>
        <div className={styles.ligne}>
          <span className="logo" style={{ fontSize: 30, lineHeight: 1 }}>
            le club
          </span>
          <PastilleProfil utilisateur={utilisateur} />
        </div>
        <div>
          <h1 className={`titre ${styles.salut}`}>{salutation(utilisateur.prenom)}</h1>
          <p className={styles.date}>
            {formatJourFr(aujourdhui)} · {phase}
          </p>
        </div>
      </header>
      <BandeauVisite utilisateur={utilisateur} />
    </>
  );
}
