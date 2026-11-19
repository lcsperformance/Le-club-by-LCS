"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ONGLETS, ongletActif, type CleOnglet } from "@/lib/onglets";
import styles from "./BarreOnglets.module.css";

const ICONES: Record<CleOnglet, ReactNode> = {
  accueil: <path d="M4 11l8-7 8 7v9H4z" />,
  semaine: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  ressources: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5 3.5-5 3.5z" />
    </>
  ),
  club: <path d="M4 5h16v11H9l-5 4z" />,
  avantages: (
    <path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7c-3-4-6-3-5 0 .6 1.5 5 0 5 0zM12 7c3-4 6-3 5 0-.6 1.5-5 0-5 0z" />
  ),
};

/** Barre d'onglets flottante en verre, en bas de l'écran. */
export function BarreOnglets() {
  const actif = ongletActif(usePathname());

  return (
    <>
      <div className={styles.reserve} aria-hidden />
      <nav className={styles.barre} aria-label="Navigation principale">
        {ONGLETS.map((o) => {
          const estActif = o.cle === actif;
          return (
            <Link
              key={o.cle}
              href={o.chemin}
              className={`${styles.onglet} ${estActif ? styles.actif : ""}`}
              aria-current={estActif ? "page" : undefined}
            >
              <span className={styles.icone}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONES[o.cle]}
                </svg>
              </span>
              {o.libelle}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
