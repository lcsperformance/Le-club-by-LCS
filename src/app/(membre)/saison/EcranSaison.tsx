"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CarteDecompte } from "@/components/CarteDecompte";
import { BoutonPrincipal, BoutonSecondaire, CalendrierMois, Carte, Champ, DeuxColonnes, SurOrdinateur } from "@/components/ui";
import {
  ANNEES_MAX,
  ajouterJours,
  apercuBloc,
  BLOCS,
  dureeBloc,
  erreurDateCourse,
  formatIsoCourt,
  formatIsoLong,
  LONGUEUR_MAX_NOM,
  organiserSaison,
  semainesBloc,
  texteStatut,
  titreObjectif,
  type Bloc,
  type Objectif,
  type ObjectifSaison,
} from "@/lib/saison";
import { ajouterObjectif, changerDateObjectif, renommerObjectif, supprimerObjectif, type ResultatSaison } from "./actions";
import styles from "./saison.module.css";

type Props = {
  objectifs: Objectif[];
  /** Aujourd'hui à Paris (AAAA-MM-JJ). */
  aujourdhui: string;
  /** Aperçus : ouvre le calendrier d'emblée. */
  calendrierOuvert?: boolean;
};

/** Calendrier ouvert pour la nouvelle course, ou pour changer la date d'un objectif. */
type Cible = { pour: "nouveau" } | { pour: "objectif"; objectif: ObjectifSaison } | null;

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Écran « Ma saison » (maquette) : objectifs, choix du bloc, date de course au calendrier. */
export function EcranSaison({ objectifs, aujourdhui, calendrierOuvert = false }: Props) {
  const router = useRouter();
  const saison = organiserSaison(objectifs, aujourdhui);
  const [bloc, setBloc] = useState<Bloc>("M");
  const [date, setDate] = useState(() => ajouterJours(aujourdhui, semainesBloc("M") * 7));
  const [nom, setNom] = useState("");
  const [cible, setCible] = useState<Cible>(calendrierOuvert ? { pour: "nouveau" } : null);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();
  // Verrou immédiat : un double toucher arrive avant que les boutons ne s'affichent désactivés.
  const occupe = useRef(false);

  function agir(action: () => Promise<ResultatSaison>, reussite: string, siReussite?: () => void) {
    if (occupe.current) return;
    occupe.current = true;
    setMessage(null);
    demarrer(async () => {
      let r: ResultatSaison;
      try {
        r = await action();
      } catch {
        r = { erreur: "Action impossible pour le moment. Recharge la page et réessaie." };
      } finally {
        occupe.current = false;
      }
      if (r.erreur) {
        setMessage({ texte: r.erreur, erreur: true });
        return;
      }
      setMessage({ texte: reussite, erreur: false });
      siReussite?.();
      router.refresh();
    });
  }

  const erreurDate = erreurDateCourse(date, aujourdhui);

  return (
    <>
      <Link href="/semaine" className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Ma semaine
      </Link>

      <header>
        <h1 className="titre" style={{ fontSize: 28, lineHeight: 1.1 }}>
          Ma saison
        </h1>
        <p className={styles.intro}>
          Le fil rouge tourne toute l&apos;année. Quand tu as un objectif, ajoute son bloc : il se branche tout seul avant ta course.
        </p>
      </header>

      <CarteDecompte prochain={saison.prochain} />

      {/* Sur ordinateur : objectifs et ajout à gauche, calendrier de la saison à droite. */}
      <DeuxColonnes
        collante
        principale={
          <>
            <section aria-labelledby="titre-objectifs" className={styles.section}>
              <h2 id="titre-objectifs" className={styles.surtitre}>
                Mes objectifs
              </h2>
              {saison.objectifs.length === 0 ? (
                <p className={styles.vide}>Aucun objectif pour l&apos;instant. Tu suis le fil rouge.</p>
              ) : (
                <ul className={styles.liste}>
                  {saison.objectifs.map((o) => (
                    <CarteObjectif
                      key={o.id}
                      objectif={o}
                      desactive={enCours}
                      changerDate={() => setCible({ pour: "objectif", objectif: o })}
                      renommer={(nouveau, fermer) =>
                        agir(
                          () => renommerObjectif(o.id, nouveau),
                          nouveau.trim() ? `Nom enregistré : ${nouveau.trim().replace(/\s+/g, " ")}.` : "Nom retiré.",
                          fermer,
                        )
                      }
                      supprimer={() => {
                        if (!window.confirm(`Supprimer l'objectif ${titreObjectif(o)} du ${formatIsoCourt(o.date_objectif)} ?`)) return;
                        agir(() => supprimerObjectif(o.id), "Objectif supprimé.");
                      }}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="titre-blocs" className={styles.section}>
              <h2 id="titre-blocs" className={styles.surtitre}>
                Tous les blocs
              </h2>
              <div className={styles.blocs} role="group" aria-label="Choisis ton bloc">
                {BLOCS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={styles.bloc}
                    aria-pressed={bloc === b}
                    onClick={() => setBloc(b)}
                  >
                    <span className={styles.blocLettre}>{b}</span>
                    <span className={styles.blocNom}>Bloc {b}</span>
                    <span className={styles.blocDuree}>{dureeBloc(b)}</span>
                  </button>
                ))}
              </div>
            </section>

            <Carte as="section" aria-labelledby="titre-date" style={{ display: "grid", gap: 12 }}>
              <h2 id="titre-date" className="titre-carte" style={{ fontSize: 16 }}>
                Date de ta course
              </h2>
              <button type="button" className={styles.choixDate} onClick={() => setCible({ pour: "nouveau" })} aria-label={`Date de ta course : ${formatIsoLong(date)}. Changer`}>
                <span>{majuscule(formatIsoLong(date))}</span>
                <IconeCalendrier />
              </button>
              <p className={styles.apercu}>{erreurDate ?? apercuBloc(bloc, date, aujourdhui)}</p>
              <Champ
                libelle="Nom de ta course (facultatif)"
                name="nom-course"
                placeholder="Ex. Triathlon de Nice"
                maxLength={LONGUEUR_MAX_NOM}
                autoComplete="off"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              <BoutonPrincipal
                disabled={!!erreurDate || enCours}
                onClick={() =>
                  agir(
                    () => ajouterObjectif(bloc, date, nom),
                    `Objectif ${titreObjectif({ bloc, nom: nom.trim().replace(/\s+/g, " ") })} ajouté à ta saison.`,
                    () => setNom(""),
                  )
                }
              >
                Ajouter à ma saison
              </BoutonPrincipal>
            </Carte>

            <p role={message?.erreur ? "alert" : "status"} className={message?.erreur ? "message-erreur" : "message-info"} hidden={!message}>
              {message?.texte}
            </p>

            <p className={styles.pied}>Après ta course, tu reprends le fil rouge ou tu enchaînes sur un autre bloc, comme tu veux.</p>
          </>
        }
        laterale={
          <SurOrdinateur>
            <Carte as="section" aria-labelledby="titre-calendrier" className={styles.calendrierSaison}>
              <h2 id="titre-calendrier" className={styles.surtitre}>
                Calendrier de ta saison
              </h2>
              <CalendrierMois
                valeur={date}
                aujourdhui={aujourdhui}
                moisInitial={(saison.objectifs.find((o) => o.date_objectif >= aujourdhui)?.date_objectif ?? aujourdhui).slice(0, 7)}
                marques={saison.objectifs.map((o) => o.date_objectif)}
                min={aujourdhui}
                max={ajouterJours(aujourdhui, 365 * ANNEES_MAX)}
                onChoisir={setDate}
              />
              <p className={styles.legende}>
                <span className={styles.legendePoint} aria-hidden /> Tes courses. Touche un jour pour choisir la date d&apos;une nouvelle course.
              </p>
            </Carte>
          </SurOrdinateur>
        }
      />

      {cible && (
        <FeuilleCalendrier
          titre={cible.pour === "nouveau" ? "Date de ta course" : "Changer la date de ton objectif"}
          bloc={cible.pour === "nouveau" ? bloc : cible.objectif.bloc}
          dateInitiale={cible.pour === "nouveau" ? date : cible.objectif.date_objectif}
          aujourdhui={aujourdhui}
          enCours={enCours}
          fermer={() => setCible(null)}
          valider={(jour) => {
            if (cible.pour === "nouveau") {
              setDate(jour);
              setCible(null);
              return;
            }
            const o = cible.objectif;
            agir(() => changerDateObjectif(o.id, jour), `Date changée : course le ${formatIsoCourt(jour)}.`);
            setCible(null);
          }}
        />
      )}
    </>
  );
}

function CarteObjectif({
  objectif: o,
  desactive,
  changerDate,
  renommer,
  supprimer,
}: {
  objectif: ObjectifSaison;
  desactive: boolean;
  changerDate: () => void;
  /** Enregistre le nom saisi (vide = retirer le nom) ; « fermer » est appelé si c'est réussi. */
  renommer: (nom: string, fermer: () => void) => void;
  supprimer: () => void;
}) {
  const termine = o.statut.type === "passe";
  const [edition, setEdition] = useState<string | null>(null);
  return (
    <Carte as="li" className={`${styles.objectif} ${o.mene ? styles.objectifMene : ""} ${termine ? styles.objectifTermine : ""}`}>
      <span className={styles.badge} aria-hidden>
        {o.bloc}
      </span>
      <div className={styles.objectifTexte}>
        <p className={styles.objectifTitre}>
          {titreObjectif(o)} · {formatIsoCourt(o.date_objectif)}
        </p>
        {o.nom && <p className={styles.objectifBloc}>Bloc {o.bloc}</p>}
        <p className={styles.objectifStatut}>{texteStatut(o)}</p>
        {o.chevauche.length > 0 && (
          <p className={styles.avertissement}>
            Ce bloc chevauche celui du {o.chevauche.map(formatIsoCourt).join(" et du ")}.
          </p>
        )}
        {edition === null && (
          <div className={styles.liens}>
            {!termine && (
              <button type="button" className={styles.lienDate} onClick={changerDate} disabled={desactive}>
                Changer la date
              </button>
            )}
            <button type="button" className={styles.lienDate} onClick={() => setEdition(o.nom ?? "")} disabled={desactive}>
              {o.nom ? "Changer le nom" : "Nommer la course"}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        className={styles.supprimer}
        aria-label={`Supprimer l'objectif ${titreObjectif(o)} du ${formatIsoCourt(o.date_objectif)}`}
        onClick={supprimer}
        disabled={desactive}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {edition !== null && (
        <form
          className={styles.edition}
          onSubmit={(e) => {
            e.preventDefault();
            renommer(edition, () => setEdition(null));
          }}
        >
          <Champ
            libelle="Nom de ta course (facultatif)"
            name={`nom-${o.id}`}
            placeholder="Ex. Triathlon de Nice"
            maxLength={LONGUEUR_MAX_NOM}
            autoComplete="off"
            autoFocus
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
          />
          <div className={styles.editionBoutons}>
            <BoutonSecondaire type="button" onClick={() => setEdition(null)}>
              Annuler
            </BoutonSecondaire>
            <BoutonSecondaire type="submit" disabled={desactive}>
              Enregistrer
            </BoutonSecondaire>
          </div>
        </form>
      )}
    </Carte>
  );
}

/** Feuille du bas avec le calendrier ; l'aperçu du bloc suit le jour touché. */
function FeuilleCalendrier({
  titre,
  bloc,
  dateInitiale,
  aujourdhui,
  enCours,
  fermer,
  valider,
}: {
  titre: string;
  bloc: Bloc;
  dateInitiale: string;
  aujourdhui: string;
  enCours: boolean;
  fermer: () => void;
  valider: (jour: string) => void;
}) {
  const [jour, setJour] = useState(dateInitiale < aujourdhui ? aujourdhui : dateInitiale);
  const boutonFermer = useRef<HTMLButtonElement>(null);
  const erreur = erreurDateCourse(jour, aujourdhui);

  useEffect(() => {
    boutonFermer.current?.focus();
    const touche = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [fermer]);

  return (
    <div className={styles.voile} onClick={(e) => e.target === e.currentTarget && fermer()}>
      <div role="dialog" aria-modal="true" aria-labelledby="titre-feuille" className={styles.feuille}>
        <div className={styles.feuilleEntete}>
          <h2 id="titre-feuille" className="titre-carte" style={{ fontSize: 18 }}>
            {titre}
          </h2>
          <button ref={boutonFermer} type="button" className={styles.fermer} aria-label="Fermer" onClick={fermer}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <CalendrierMois
          valeur={jour}
          aujourdhui={aujourdhui}
          min={aujourdhui}
          max={ajouterJours(aujourdhui, 365 * ANNEES_MAX)}
          onChoisir={setJour}
        />
        <p className={styles.apercu} aria-live="polite">
          {erreur ?? apercuBloc(bloc, jour, aujourdhui)}
        </p>
        <BoutonPrincipal disabled={!!erreur || enCours} onClick={() => valider(jour)}>
          Valider le {formatIsoCourt(jour)}
        </BoutonPrincipal>
      </div>
    </div>
  );
}

function IconeCalendrier() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  );
}
