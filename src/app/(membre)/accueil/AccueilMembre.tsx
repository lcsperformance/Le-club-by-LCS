import { BoutonPrincipal, Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import { dateDuJourParis } from "@/lib/dates";
import { carteAccueil, organiserSaison, phaseCourte, type Objectif } from "@/lib/saison";
import { EnTeteAccueil } from "./EnTeteAccueil";
import styles from "./EnTeteAccueil.module.css";

type Props = { utilisateur: Utilisateur; testsFaits: boolean; objectifs: Objectif[]; aujourdhui: Date };

/** Contenu de l'accueil membre. */
export function AccueilMembre({ utilisateur, testsFaits, objectifs, aujourdhui }: Props) {
  const saison = organiserSaison(objectifs, dateDuJourParis(aujourdhui));
  const bloc = carteAccueil(saison);
  return (
    <>
      <EnTeteAccueil utilisateur={utilisateur} aujourdhui={aujourdhui} phase={phaseCourte(saison)} />

      {testsFaits ? (
        <Carte href="/zones" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", flex: "none" }} />
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>Tes zones sont à jour</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Voir</span>
        </Carte>
      ) : (
        <section
          aria-labelledby="etape-tests"
          style={{
            background: "var(--aurore)",
            color: "var(--fond)",
            borderRadius: 20,
            padding: 18,
            display: "grid",
            gap: 10,
            boxShadow: "0 14px 34px rgba(250, 148, 255, 0.3)",
          }}
        >
          <span
            style={{
              justifySelf: "start",
              background: "var(--accent)",
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            Étape 1
          </span>
          <h2 id="etape-tests" className="titre-carte" style={{ fontSize: 19, lineHeight: 1.2 }}>
            Définis tes zones pour débloquer tes allures
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.4 }}>Quatre mesures à faire en autonomie : course, vélo, natation et cardio.</p>
          <BoutonPrincipal href="/tests" style={{ minHeight: 48, fontSize: 16, boxShadow: "none" }}>
            Faire mes tests
          </BoutonPrincipal>
        </section>
      )}

      <Carte href="/saison" className={styles.carteBloc}>
        <span className={styles.carteBlocHaut}>
          <span className={styles.surtitre}>{bloc.surtitre}</span>
          <span className={styles.lienSaison}>Ma saison</span>
        </span>
        <span className={styles.carteBlocTitre}>{bloc.titre}</span>
        <span className={styles.carteBlocSous}>{bloc.sous}</span>
        {bloc.progression !== null && (
          <span
            className={styles.jauge}
            role="progressbar"
            aria-label="Avancement du bloc"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(bloc.progression * 100)}
          >
            <span style={{ width: `${Math.round(bloc.progression * 100)}%` }} />
          </span>
        )}
      </Carte>

      <Carte as="section">
        <p className="message-info">Ton programme arrive bientôt. Lancement le 1er janvier 2027.</p>
      </Carte>
    </>
  );
}
