import { BandeauVisite, PastilleProfil } from "@/components/IdentiteMembre";
import type { Utilisateur } from "@/lib/auth";
import { formatJourFr } from "@/lib/dates";
import styles from "./EnTeteAccueil.module.css";

/** « Salut Caroline » si le prénom est connu, sinon « Salut ! ». */
export const salutation = (prenom: string | null) => (prenom ? `Salut ${prenom}` : "Salut !");

/** En-tête de l'accueil, comme la maquette : bandeau rose, logo, pastille, salutation et date. */
export function EnTeteAccueil({ utilisateur, aujourdhui }: { utilisateur: Utilisateur; aujourdhui: Date }) {
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
          {/* La phase du plan (« · Bloc M ») s'ajoutera avec « Ma saison ». */}
          <p className={styles.date}>{formatJourFr(aujourdhui)}</p>
        </div>
      </header>
      <BandeauVisite utilisateur={utilisateur} />
    </>
  );
}
