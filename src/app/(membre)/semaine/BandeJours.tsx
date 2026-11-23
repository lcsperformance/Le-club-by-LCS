"use client";

import Link from "next/link";
import { useState } from "react";
import { IconeSport } from "@/components/IconeSport";
import { Carte } from "@/components/ui";
import { formatDuree, NOMS_SPORTS, type Seance } from "@/lib/programme";
import { libelleJour, type Jour } from "@/lib/semaine";
import styles from "./semaine.module.css";

export type SeanceCarte = Pick<Seance, "id" | "sport" | "titre" | "dureeMinutes">;

/**
 * Bande des 7 jours (maquette) : le jour touché est mis en valeur, ses séances s'affichent dessous.
 * seances : séances par jour (AAAA-MM-JJ) ; null tant que le membre n'a pas choisi niveau et profil.
 */
export function BandeJours({ jours, aujourdhui, seances }: { jours: Jour[]; aujourdhui: string; seances: Record<string, SeanceCarte[]> | null }) {
  const [choisi, setChoisi] = useState(jours.some((j) => j.iso === aujourdhui) ? aujourdhui : jours[0].iso);
  const duJour = seances?.[choisi] ?? [];
  const semaineVide = seances !== null && jours.every((j) => !seances[j.iso]?.length);
  return (
    <>
      <div className={styles.jours} role="group" aria-label="Jours de la semaine">
        {jours.map((j) => {
          const nb = seances?.[j.iso]?.length ?? 0;
          return (
            <button
              key={j.iso}
              type="button"
              className={styles.jour}
              aria-pressed={j.iso === choisi}
              aria-current={j.iso === aujourdhui ? "date" : undefined}
              aria-label={`${libelleJour(j.iso)}${nb ? ` · ${nb} séance${nb > 1 ? "s" : ""}` : ""}`}
              onClick={() => setChoisi(j.iso)}
            >
              <span className={styles.jourCourt}>{j.court}</span>
              <span className={styles.jourNumero}>{j.numero}</span>
              <span className={styles.point} data-seance={nb > 0 || undefined} aria-hidden />
            </button>
          );
        })}
      </div>
      <h2 className={styles.jourTitre}>{libelleJour(choisi)}</h2>
      {seances === null ? (
        <Carte as="section" style={{ display: "grid", gap: 10 }}>
          <p className="message-info">Choisis ton niveau et ton profil pour voir tes séances.</p>
          <Link href="/profil" className="lien">
            Choisir mon niveau
          </Link>
        </Carte>
      ) : semaineVide ? (
        <Carte as="section">
          <p className="message-info">Les séances de cette semaine ne sont pas encore en ligne. Reviens un peu plus tard.</p>
        </Carte>
      ) : duJour.length ? (
        <ul className={styles.seances}>
          {duJour.map((s) => (
            <li key={s.id}>
              <Carte href={`/seance/${s.id}`} className={styles.seance}>
                <IconeSport sport={s.sport} />
                <span className={styles.seanceTexte}>
                  <span className={styles.seanceSport}>{NOMS_SPORTS[s.sport]}</span>
                  <span className={styles.seanceMeta}>
                    {s.titre} · {formatDuree(s.dureeMinutes)}
                  </span>
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--texte)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Carte>
            </li>
          ))}
        </ul>
      ) : (
        <Carte as="section" className={styles.repos}>
          <p className={styles.reposTitre}>Jour de repos</p>
          <p className={styles.reposTexte}>Rien au programme. Récupère, mange bien, dors.</p>
        </Carte>
      )}
    </>
  );
}
