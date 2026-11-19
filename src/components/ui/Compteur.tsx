"use client";

import { useState } from "react";
import styles from "./ui.module.css";

type Props = {
  /** Nom du champ envoyé avec le formulaire. */
  name: string;
  valeurInitiale: number;
  pas: number;
  min: number;
  max: number;
  /** Valeur affichée (unité comprise). Par défaut, le nombre seul. */
  afficher?: (valeur: number) => string;
  libelleMoins: string;
  libellePlus: string;
  /** Nom de la mesure, lu par les lecteurs d'écran avec la valeur. */
  intitule: string;
};

/** Valeur suivante après un appui sur − (sens -1) ou + (sens 1), bornée entre min et max. */
export function pasSuivant(r: { pas: number; min: number; max: number }, valeur: number, sens: -1 | 1): number {
  return Math.min(r.max, Math.max(r.min, valeur + sens * r.pas));
}

/** Réglage « − valeur + », borné, qui envoie sa valeur avec le formulaire. */
export function Compteur({
  name,
  valeurInitiale,
  pas,
  min,
  max,
  afficher = String,
  libelleMoins,
  libellePlus,
  intitule,
}: Props) {
  const [valeur, setValeur] = useState(valeurInitiale);
  const changer = (sens: -1 | 1) => setValeur((v) => pasSuivant({ pas, min, max }, v, sens));

  return (
    <div className={styles.compteur}>
      <button
        type="button"
        className={styles.compteurBouton}
        aria-label={libelleMoins}
        onClick={() => changer(-1)}
        disabled={valeur <= min}
      >
        −
      </button>
      <output className={styles.compteurValeur} aria-live="polite" aria-label={`${intitule} : ${afficher(valeur)}`}>
        {afficher(valeur)}
      </output>
      <button
        type="button"
        className={styles.compteurBouton}
        aria-label={libellePlus}
        onClick={() => changer(1)}
        disabled={valeur >= max}
      >
        +
      </button>
      <input type="hidden" name={name} value={valeur} />
    </div>
  );
}
