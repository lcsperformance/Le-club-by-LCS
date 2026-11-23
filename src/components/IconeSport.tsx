import type { ReactNode } from "react";
import type { SportSeance } from "@/lib/programme";
import styles from "./IconeSport.module.css";

const TRACES: Record<SportSeance, ReactNode> = {
  natation: (
    <>
      <path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5S16 16 18 16s2-1.5 4-1.5" />
      <path d="M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5S16 20 18 20s2-1.5 4-1.5" />
      <circle cx="16" cy="6" r="2" />
      <path d="M6 12l4-3 3 2 3-1" />
    </>
  ),
  velo: (
    <>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16l4-8h5l3 8M10 8l5 8M13 6h3" />
    </>
  ),
  course: (
    <>
      <circle cx="14" cy="5" r="2" />
      <path d="M10 21l2-5-3-3 2-5 4 2 3 2M8 10l-3 3M12 16l4 1 1 4" />
    </>
  ),
  renfo: <path d="M6 7v10M3 10v4M18 7v10M21 10v4M6 12h12" />,
};

/** Pastille du sport (maquette) : icône vert accent sur fond rose translucide. */
export function IconeSport({ sport, grande = false }: { sport: SportSeance; grande?: boolean }) {
  const taille = grande ? 28 : 24;
  return (
    <span className={`${styles.badge} ${grande ? styles.grande : ""}`} aria-hidden>
      <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {TRACES[sport]}
      </svg>
    </span>
  );
}
