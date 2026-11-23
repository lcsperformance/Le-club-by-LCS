import { CarteInstallation } from "@/components/CarteInstallation";
import { IconeSport } from "@/components/IconeSport";
import { BoutonPrincipal, Carte } from "@/components/ui";
import { texteQuestionsFaq, type CarteAujourdhui } from "@/lib/accueil";
import { quandEvenement, type Evenement } from "@/lib/agenda";
import type { Utilisateur } from "@/lib/auth";
import { formatDuree, NOMS_SPORTS } from "@/lib/programme";
import type { Ressource } from "@/lib/ressources";
import { dateDuJourParis } from "@/lib/dates";
import { carteAccueil, organiserSaison, phaseCourte, type Objectif } from "@/lib/saison";
import { EnTeteAccueil } from "./EnTeteAccueil";
import styles from "./EnTeteAccueil.module.css";
import a from "./accueil.module.css";

type Props = {
  utilisateur: Utilisateur;
  testsFaits: boolean;
  objectifs: Objectif[];
  aujourdhui: Date;
  /** Carte « Aujourd'hui » : la séance du jour (ou repos, semaine à venir, niveau à choisir). */
  seanceDuJour: CarteAujourdhui;
  /** Prochaine FAQ en visio (null : pas encore datée) et nombre de questions pas encore traitées. */
  faq: { evenement: Evenement | null; questions: number };
  /** Contenu des Ressources débloqué cette semaine ; null : la carte est masquée. */
  nouveau: Pick<Ressource, "id" | "titre" | "type"> | null;
  /** Aperçus seulement : force la carte « Installer l'app » (sinon le téléphone décide). */
  installation?: "android" | "iphone";
};

/** Contenu de l'accueil membre (maquette) : tests ou zones, aujourd'hui, bloc, FAQ en visio, nouveau cette semaine. */
export function AccueilMembre({ utilisateur, testsFaits, objectifs, aujourdhui, seanceDuJour, faq, nouveau, installation }: Props) {
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

      <CarteDuJour carte={seanceDuJour} />

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

      <Carte as="section" className={a.carte} aria-labelledby="titre-faq">
          <span className={a.faqEntete}>
            <span className={a.point} aria-hidden />
            <span id="titre-faq" className={a.surtitre}>
              FAQ en visio
            </span>
          </span>
          <span className={a.faqQuand}>{faq.evenement ? quandEvenement(faq.evenement) : "Date bientôt annoncée"}</span>
          <span className={a.meta}>{texteQuestionsFaq(faq.questions)}</span>
          <BoutonPrincipal href="/club/questions" style={{ minHeight: 46, fontSize: 15 }}>
            Poser une question
          </BoutonPrincipal>
      </Carte>

      {nouveau && (
        <Carte href={`/ressources/contenu/${nouveau.id}`} className={a.nouveau}>
          <span className={a.nouveauIcone} aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {nouveau.type === "video" ? (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M10 8.5l5 3.5-5 3.5z" />
                </>
              ) : (
                <>
                  <path d="M6 3h8l4 4v14H6z" />
                  <path d="M14 3v4h4" />
                </>
              )}
            </svg>
          </span>
          <span className={a.texte}>
            <span className={a.surtitre}>Nouveau cette semaine</span>
            <span className={a.nouveauTitre}>{nouveau.titre}</span>
          </span>
        </Carte>
      )}

      <CarteInstallation apercu={installation} />
    </>
  );
}

/** Carte « Aujourd'hui » (maquette) : la séance du jour, sinon repos, semaine à venir ou niveau à choisir. */
function CarteDuJour({ carte }: { carte: CarteAujourdhui }) {
  const surtitre = (
    <span id="titre-aujourdhui" className={a.surtitre}>
      Aujourd&apos;hui
    </span>
  );
  if (carte.etat === "seance") {
    const s = carte.seance;
    return (
      <Carte href={`/seance/${s.id}?jour=${carte.jour}`} className={a.carte} aria-labelledby="titre-aujourdhui">
        {surtitre}
        <span className={a.ligne}>
          <IconeSport sport={s.sport} />
          <span className={a.texte}>
            <span className={a.sport}>{NOMS_SPORTS[s.sport]}</span>
            <span className={a.meta}>
              {s.titre} · {formatDuree(s.dureeMinutes)}
              {carte.autres > 0 && ` · + ${carte.autres} autre${carte.autres > 1 ? "s" : ""} séance${carte.autres > 1 ? "s" : ""}`}
            </span>
          </span>
          {carte.faite ? (
            <span className={a.coche} role="img" aria-label="Séance faite">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fond)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12l5 5 9-10" />
              </svg>
            </span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 5l7 7-7 7" />
            </svg>
          )}
        </span>
      </Carte>
    );
  }
  const textes = {
    repos: { titre: "Jour de repos", sous: "Rien au programme. Récupère, mange bien, dors.", href: "/semaine" },
    "a-venir": { titre: "Ta semaine arrive", sous: "Les séances de cette semaine ne sont pas encore en ligne.", href: "/semaine" },
    niveau: { titre: "Choisis ton niveau et ton profil", sous: "Pour recevoir les séances qui te correspondent.", href: "/profil" },
  } as const;
  const t = textes[carte.etat];
  return (
    <Carte href={t.href} className={a.carte}>
      {surtitre}
      <span className={a.repos}>{t.titre}</span>
      <span className={a.meta}>{t.sous}</span>
    </Carte>
  );
}
