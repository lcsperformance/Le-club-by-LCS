import type { ReactNode } from "react";
import type { IconeTheme as Icone } from "@/lib/ressources";

const TRACES: Record<Icone, ReactNode> = {
  nutrition: (
    <>
      <path d="M12 7c-2-2-7-1-7 4 0 4 3 9 5 9 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-5 5-9 0-5-5-6-7-4z" />
      <path d="M12 7c0-2 1-4 3-5" />
    </>
  ),
  natation: (
    <>
      <path d="M2 9c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 15c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
      <circle cx="16" cy="4" r="1.6" />
    </>
  ),
  velo: (
    <>
      <circle cx="6" cy="16" r="4" />
      <circle cx="18" cy="16" r="4" />
      <path d="M6 16l4-8h5l3 8M10 8L8 5H6M12 16l3-8" />
    </>
  ),
  course: (
    <>
      <circle cx="14" cy="4" r="1.8" />
      <path d="M8 21l3-6 3 2v4M11 15l1-5 4 2 3-1M12 10l-3 1-2 3" />
    </>
  ),
  preparation: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
};

/** Icône d'un thème des Ressources (maquette), dans sa pastille de verre. */
export function IconeTheme({ icone, className }: { icone: Icone; className?: string }) {
  return (
    <span className={className} aria-hidden>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--texte)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {TRACES[icone]}
      </svg>
    </span>
  );
}
