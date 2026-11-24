import Link from "next/link";
import type { ReactNode } from "react";
import { formatDateCourteFr } from "@/lib/dates";
import { PAGES_LEGALES, VERSION_TEXTES } from "@/lib/legal";
import styles from "./PageLegale.module.css";

/** Information encore inconnue, à remplir avant le lancement : surlignée pour la repérer. */
export function ACompleter({ children }: { children: ReactNode }) {
  return <mark className={styles.aCompleter}>[à compléter : {children}]</mark>;
}

/** Page légale : titre, date de version, sections, liens vers les autres pages légales. */
export function PageLegale({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <article className={styles.page}>
      <Link href="/accueil" className={styles.retour}>
        ← Le Club
      </Link>
      <h1 className="titre">{titre}</h1>
      <p className={styles.version}>Version du {formatDateCourteFr(new Date(`${VERSION_TEXTES}T12:00:00Z`))}</p>
      <div className={styles.texte}>{children}</div>
      <nav aria-label="Informations légales" className={styles.autres}>
        {PAGES_LEGALES.filter((p) => p.libelle !== titre).map((p) => (
          <Link key={p.href} href={p.href} className="lien">
            {p.libelle}
          </Link>
        ))}
      </nav>
    </article>
  );
}
