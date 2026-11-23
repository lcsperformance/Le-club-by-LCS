"use client";

import { useState } from "react";
import { Carte, Champ } from "@/components/ui";
import { filtrerAthletes, initialeAthlete, nomAthlete, type AthleteCoach } from "@/lib/coach";
import { CONFIG_PROFILS } from "@/lib/profils";
import styles from "./coach.module.css";

/** Liste des athlètes (maquette Coach) : recherche par prénom ou nom, accès en cours (ou anciens membres). */
export function ListeAthletes({ athletes, choisi }: { athletes: AthleteCoach[]; choisi?: string }) {
  const [recherche, setRecherche] = useState("");
  const [anciens, setAnciens] = useState(false);
  const trouves = filtrerAthletes(athletes, recherche, anciens);
  return (
    <section className={styles.liste} aria-labelledby="titre-athletes">
      <h2 id="titre-athletes" className={`titre ${styles.titreListe}`}>
        Athlètes
      </h2>
      <Champ libelle="Rechercher un athlète" name="recherche" value={recherche} placeholder="Prénom ou nom" onChange={(e) => setRecherche(e.target.value)} />
      <label className={styles.anciens}>
        <input type="checkbox" checked={anciens} onChange={(e) => setAnciens(e.target.checked)} />
        Voir aussi les anciens membres
      </label>
      {!trouves.length && <p className={styles.vide}>{recherche ? "Aucun athlète ne correspond." : "Aucun athlète pour l'instant."}</p>}
      <ul className={styles.athletes}>
        {trouves.map((a) => (
          <li key={a.id}>
            <Carte href={`/coach/athletes/${a.id}`} className={styles.athlete} aria-current={a.id === choisi ? "page" : undefined}>
              <span className={styles.avatar} aria-hidden>
                {initialeAthlete(a)}
              </span>
              <span className={styles.athleteTexte}>
                <span className={styles.athleteNom}>{nomAthlete(a)}</span>
                <span className={styles.athleteNiveau}>
                  {a.niveau ? CONFIG_PROFILS.niveaux[a.niveau].libelle : "Niveau pas encore choisi"}
                  {!a.acces_en_cours && " · ancien membre"}
                </span>
              </span>
            </Carte>
          </li>
        ))}
      </ul>
    </section>
  );
}
