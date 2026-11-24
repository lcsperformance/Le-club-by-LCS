"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NOMS_TYPES, type Evenement } from "@/lib/agenda";
import { barreVisible } from "@/lib/onglets";
import styles from "./BandeauEvenement.module.css";

/**
 * Bandeau toujours visible en haut de l'espace membre : prochain événement de l'agenda
 * (« FAQ en visio · Demain · 19 h 30 »), lien vers l'agenda. Masqué sur les écrans plein écran
 * (tests, abonnement), comme la barre d'onglets.
 */
export function BandeauEvenement({
  evenement,
  quand,
  toujours = false,
}: {
  evenement: Pick<Evenement, "type" | "titre">;
  /** Calculé par le serveur (quandCourt), à l'heure de Paris. */
  quand: string;
  /** Aperçus : afficher sans regarder l'adresse. */
  toujours?: boolean;
}) {
  const chemin = usePathname();
  if (!toujours && !barreVisible(chemin)) return null;
  // Le titre saisi par l'admin (« FAQ en visio », « Webinaire : bien démarrer sa saison »), sinon le type.
  const titre = evenement.titre.trim() || NOMS_TYPES[evenement.type];

  return (
    <div className={styles.bandeau}>
      <Link href="/club/agenda" className={styles.lien} aria-label={`Prochain événement : ${titre}, ${quand}. Voir l'agenda`}>
        <span className={styles.point} aria-hidden />
        <span className={styles.titre}>{titre}</span>
        <span className={styles.quand}>{quand}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.fleche}>
          <path d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
