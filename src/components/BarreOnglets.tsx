"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { barreVisible, cheminAffiche, ONGLETS, ongletActif } from "@/lib/onglets";
import { IconeOnglet } from "./IconeOnglet";
import styles from "./BarreOnglets.module.css";

/** Barre d'onglets flottante en verre, en bas de l'écran (remplacée par le menu latéral sur ordinateur). */
export function BarreOnglets() {
  const chemin = cheminAffiche(usePathname());
  const actif = ongletActif(chemin);

  // Comme dans la maquette, pas de barre sur les écrans plein écran (tests, séance, abonnement…).
  if (!barreVisible(chemin)) return null;

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
                <IconeOnglet cle={o.cle} />
              </span>
              {o.libelle}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
