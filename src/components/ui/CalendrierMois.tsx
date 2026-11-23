"use client";

import { useState } from "react";
import { ajouterJours, formatIsoLong } from "@/lib/saison";
import styles from "./ui.module.css";

type Props = {
  /** Jour choisi (AAAA-MM-JJ), ou "" si aucun. */
  valeur: string;
  /** Mois affiché au départ (AAAA-MM), sinon celui du jour choisi ou d'aujourd'hui. */
  moisInitial?: string;
  /** Jours marqués d'un point (ex. jours d'événement de l'agenda). */
  marques?: readonly string[];
  /** Appelé quand on change de mois avec les flèches. */
  onChangerMois?: (mois: string) => void;
  /** Aujourd'hui à Paris (AAAA-MM-JJ), entouré dans la grille. */
  aujourdhui: string;
  /** Premier et dernier jour possibles. */
  min?: string;
  max?: string;
  onChoisir: (jour: string) => void;
};

const JOURS = [
  ["L", "lundi"],
  ["M", "mardi"],
  ["M", "mercredi"],
  ["J", "jeudi"],
  ["V", "vendredi"],
  ["S", "samedi"],
  ["D", "dimanche"],
] as const;

/** « AAAA-MM » décalé de n mois. */
function decalerMois(mois: string, n: number): string {
  const total = +mois.slice(0, 4) * 12 + (+mois.slice(5, 7) - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function nomMois(mois: string): string {
  const texte = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${mois}-01T12:00:00Z`),
  );
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Les jours affichés pour un mois : semaines complètes, du lundi au dimanche. */
function grille(mois: string): string[] {
  const premier = `${mois}-01`;
  const decalage = (new Date(`${premier}T12:00:00Z`).getUTCDay() + 6) % 7; // lundi = 0
  const debut = ajouterJours(premier, -decalage);
  const jours: string[] = [];
  for (let i = 0; i < 42; i++) {
    const j = ajouterJours(debut, i);
    if (i % 7 === 0 && i > 0 && j.slice(0, 7) !== mois) break;
    jours.push(j);
  }
  return jours;
}

/** Calendrier d'un mois en français (semaine du lundi au dimanche), pour choisir un jour au doigt. */
export function CalendrierMois({ valeur, moisInitial, marques = [], onChangerMois, aujourdhui, min, max, onChoisir }: Props) {
  const [mois, setMoisInterne] = useState(moisInitial ?? (valeur || aujourdhui).slice(0, 7));
  const setMois = (m: string) => {
    setMoisInterne(m);
    onChangerMois?.(m);
  };
  const hors = (j: string) => (min !== undefined && j < min) || (max !== undefined && j > max);
  const moisPrecedentPossible = min === undefined || decalerMois(mois, -1) >= min.slice(0, 7);
  const moisSuivantPossible = max === undefined || decalerMois(mois, 1) <= max.slice(0, 7);

  return (
    <div className={styles.calendrier}>
      <div className={styles.calendrierEntete}>
        <button
          type="button"
          className={styles.calendrierFleche}
          aria-label="Mois précédent"
          disabled={!moisPrecedentPossible}
          onClick={() => setMois(decalerMois(mois, -1))}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <p className={styles.calendrierMois} aria-live="polite">
          {nomMois(mois)}
        </p>
        <button
          type="button"
          className={styles.calendrierFleche}
          aria-label="Mois suivant"
          disabled={!moisSuivantPossible}
          onClick={() => setMois(decalerMois(mois, 1))}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className={styles.calendrierGrille} role="group" aria-label={nomMois(mois)}>
        {JOURS.map(([court, long]) => (
          <abbr key={long} title={long} className={styles.calendrierJourSemaine}>
            {court}
          </abbr>
        ))}
        {grille(mois).map((j) => {
          const choisi = j === valeur;
          const marque = marques.includes(j);
          const classes = [
            styles.calendrierJour,
            marque ? styles.calendrierMarque : "",
            j.slice(0, 7) !== mois ? styles.calendrierAutreMois : "",
            choisi ? styles.calendrierChoisi : "",
            j === aujourdhui && !choisi ? styles.calendrierAujourdhui : "",
          ].join(" ");
          return (
            <button
              key={j}
              type="button"
              className={classes}
              disabled={hors(j)}
              aria-pressed={choisi}
              aria-current={j === aujourdhui ? "date" : undefined}
              aria-label={`${formatIsoLong(j)}${marque ? " · événement" : ""}`}
              onClick={() => onChoisir(j)}
            >
              {+j.slice(8, 10)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
