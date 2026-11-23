"use client";

import { useState } from "react";
import { CalendrierMois, Carte } from "@/components/ui";
import { evenementsDuMois, joursEvenement, type Evenement } from "@/lib/agenda";
import { formatIsoLong } from "@/lib/saison";
import styles from "../club.module.css";
import { CarteEvenement } from "./CarteEvenement";

/**
 * Agenda (maquette) : calendrier mensuel avec les jours d'événement marqués, puis les événements du mois.
 * Toucher un jour marqué n'affiche que les événements de ce jour.
 */
export function AgendaClub({ evenements, aujourdhui, moisInitial }: { evenements: Evenement[]; aujourdhui: string; moisInitial: string }) {
  const [mois, setMois] = useState(moisInitial);
  const [jour, setJour] = useState("");
  const dates = evenements.filter((e) => !e.dates_a_confirmer);
  const marques = dates.flatMap(joursEvenement);
  const duMois = evenementsDuMois(dates, mois);
  const affiches = jour ? dates.filter((e) => joursEvenement(e).includes(jour)) : duMois;
  const aConfirmer = evenements.filter((e) => e.dates_a_confirmer);

  return (
    <>
      <Carte>
        <CalendrierMois
          valeur={jour}
          moisInitial={mois}
          aujourdhui={aujourdhui}
          marques={marques}
          onChangerMois={(m) => {
            setMois(m);
            setJour("");
          }}
          onChoisir={(j) => setJour(j === jour ? "" : j)}
        />
      </Carte>
      <h2 className={styles.compte}>{jour ? formatIsoLong(jour) : "Ce mois-ci"}</h2>
      {jour && (
        <button type="button" className={styles.supprimer} style={{ justifySelf: "start", marginTop: -8 }} onClick={() => setJour("")}>
          Voir tout le mois
        </button>
      )}
      {affiches.length ? (
        <ul className={styles.canaux}>
          {affiches.map((e) => (
            <CarteEvenement key={e.id} e={e} />
          ))}
        </ul>
      ) : (
        <p className={styles.questionMeta} style={{ fontSize: 14 }}>
          {jour ? "Aucun événement ce jour-là." : "Aucun événement ce mois-ci."}
        </p>
      )}
      {aConfirmer.map((e) => (
        <div key={e.id} className={styles.aConfirmer}>
          <p className={styles.evenementTitre} style={{ fontSize: 15 }}>
            {e.titre}
          </p>
          <p className={styles.questionMeta} style={{ marginTop: 4, fontSize: 13 }}>
            {e.periode ?? "Bientôt"} · dates à venir{e.lieu && ` · ${e.lieu}`}
          </p>
        </div>
      ))}
    </>
  );
}
