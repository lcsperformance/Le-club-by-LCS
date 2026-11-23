"use client";

import { useState, useTransition } from "react";
import { changerSuivi } from "./actions";
import styles from "./ressources.module.css";

const Etoile = ({ pleine, couleur }: { pleine: boolean; couleur: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={pleine ? couleur : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
  </svg>
);

/** Étoile (carte) ou bouton « Ajouter aux favoris » (page du contenu) ; change tout de suite, annule si refus. */
export function BoutonFavori({ id, titre, favori: initial, grand = false }: { id: string; titre: string; favori: boolean; grand?: boolean }) {
  const [favori, setFavori] = useState(initial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function basculer() {
    const voulu = !favori;
    setFavori(voulu);
    setErreur(null);
    demarrer(async () => {
      const r = await changerSuivi(id, { favori: voulu });
      if (r.erreur) {
        setFavori(!voulu);
        setErreur(r.erreur);
      }
    });
  }

  if (grand) {
    return (
      <button type="button" className={`${styles.bouton} ${styles.boutonFavori}`} aria-pressed={favori} onClick={basculer} disabled={enCours} title={erreur ?? undefined}>
        <Etoile pleine={favori} couleur="var(--abysse)" />
        {favori ? "Dans mes favoris" : "Ajouter aux favoris"}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={styles.etoile}
      aria-pressed={favori}
      aria-label={`${favori ? "Retirer des favoris" : "Ajouter aux favoris"} : ${titre}`}
      onClick={basculer}
      disabled={enCours}
      title={erreur ?? undefined}
      style={{ color: "var(--texte)" }}
    >
      <Etoile pleine={favori} couleur="var(--aurore)" />
    </button>
  );
}
