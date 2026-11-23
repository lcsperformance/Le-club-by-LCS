import Link from "next/link";
import { Cadenas } from "@/components/Cadenas";
import { Carte } from "@/components/ui";
import type { VueContenu } from "@/lib/ressources";
import { BoutonFavori } from "./BoutonFavori";
import styles from "./ressources.module.css";

/** Vignette d'un contenu : miniature de la vidéo (ou celle du Club), ou vignette PDF. */
export function Vignette({ c }: { c: Pick<VueContenu, "type" | "miniature"> }) {
  if (c.type === "pdf") {
    return (
      <span className={styles.vignettePdf} aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h8l4 4v14H6z" />
          <path d="M14 3v4h4" />
        </svg>
        PDF
      </span>
    );
  }
  return (
    <span
      className={`${styles.vignette} ${c.miniature ? styles.vignetteImage : ""}`}
      style={c.miniature ? { backgroundImage: `url(${c.miniature})` } : undefined}
      aria-hidden
    >
      <span className={styles.lecture}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--abysse)">
          <path d="M8 5l11 7-11 7z" />
        </svg>
      </span>
    </span>
  );
}

/** Carte d'un contenu (maquette) : débloqué = lien et étoile ; verrouillé = pointillés, cadenas, semaine d'ouverture. */
export function CarteContenu({ c }: { c: VueContenu }) {
  const texte = (
    <span className={styles.contenuTexte}>
      <span className={styles.contenuTitre}>{c.titre}</span>
      <span className={styles.contenuMeta}>{c.meta}</span>
      {c.badge && <span className={styles.badge}>{c.badge}</span>}
    </span>
  );
  if (!c.debloquee) {
    return (
      <Carte as="li" className={`${styles.contenu} ${styles.verrouille}`}>
        <span className={styles.contenuLien}>
          <Vignette c={c} />
          {texte}
        </span>
        <span className={styles.cadenas} role="img" aria-label="Verrouillé">
          <Cadenas />
        </span>
      </Carte>
    );
  }
  return (
    <Carte as="li" className={styles.contenu}>
      <Link href={`/ressources/contenu/${c.id}`} className={styles.contenuLien}>
        <Vignette c={c} />
        {texte}
      </Link>
      <BoutonFavori id={c.id} titre={c.titre} favori={c.favori} />
    </Carte>
  );
}
