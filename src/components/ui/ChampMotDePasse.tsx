"use client";

import { useState, type ComponentProps } from "react";
import { Champ } from "./Champ";
import styles from "./ui.module.css";

/**
 * Champ de mot de passe : masqué par défaut, avec un bouton œil « Afficher » / « Masquer »
 * pour vérifier ce qu'on tape (choix du mot de passe, connexion).
 */
export function ChampMotDePasse(props: Omit<ComponentProps<typeof Champ>, "type" | "bouton">) {
  const [visible, setVisible] = useState(false);
  return (
    <Champ
      {...props}
      type={visible ? "text" : "password"}
      bouton={
        <button
          type="button"
          className={styles.oeil}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          aria-controls={props.id ?? `champ-${props.name}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M3 3l18 18" />}
          </svg>
        </button>
      }
    />
  );
}
