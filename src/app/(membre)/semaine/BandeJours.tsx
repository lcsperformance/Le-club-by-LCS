"use client";

import { useState } from "react";
import { Carte } from "@/components/ui";
import { libelleJour, type Jour } from "@/lib/semaine";
import styles from "./semaine.module.css";

/** Bande des 7 jours (maquette) : le jour touché est mis en valeur, ses séances s'affichent dessous. */
export function BandeJours({ jours, aujourdhui }: { jours: Jour[]; aujourdhui: string }) {
  const [choisi, setChoisi] = useState(jours.some((j) => j.iso === aujourdhui) ? aujourdhui : jours[0].iso);
  return (
    <>
      <div className={styles.jours} role="group" aria-label="Jours de la semaine">
        {jours.map((j) => (
          <button
            key={j.iso}
            type="button"
            className={styles.jour}
            aria-pressed={j.iso === choisi}
            aria-current={j.iso === aujourdhui ? "date" : undefined}
            aria-label={libelleJour(j.iso)}
            onClick={() => setChoisi(j.iso)}
          >
            <span className={styles.jourCourt}>{j.court}</span>
            <span className={styles.jourNumero}>{j.numero}</span>
            <span className={styles.point} aria-hidden />
          </button>
        ))}
      </div>
      <h2 className={styles.jourTitre}>{libelleJour(choisi)}</h2>
      <Carte as="section">
        <p className="message-info">Tes séances apparaîtront ici dès le lancement du programme, le 1er janvier 2027.</p>
      </Carte>
    </>
  );
}
