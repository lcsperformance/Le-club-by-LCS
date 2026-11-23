"use client";

import { useState, useTransition } from "react";
import { changerSuivi } from "../../actions";
import styles from "../../ressources.module.css";

/** « Marquer comme vue » / « Vue ✓ » pour une vidéo ; change tout de suite, annule si refus. */
export function BoutonVue({ id, vue: initiale }: { id: string; vue: boolean }) {
  const [vue, setVue] = useState(initiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  return (
    <button
      type="button"
      className={`${styles.bouton} ${styles.boutonSuivi}`}
      aria-pressed={vue}
      disabled={enCours}
      title={erreur ?? undefined}
      onClick={() => {
        const voulu = !vue;
        setVue(voulu);
        setErreur(null);
        demarrer(async () => {
          const r = await changerSuivi(id, { consulte: voulu });
          if (r.erreur) {
            setVue(!voulu);
            setErreur(r.erreur);
          }
        });
      }}
    >
      {vue ? "Vue ✓" : "Marquer comme vue"}
    </button>
  );
}
