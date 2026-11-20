import Link from "next/link";
import { decompte, formatIsoCourt, titreObjectif, type ObjectifSaison } from "@/lib/saison";
import styles from "./CarteDecompte.module.css";

/**
 * « Avant ton objectif · J-63 » (maquette, haut de Ma semaine).
 * Avec href, la carte entière mène à Ma saison.
 */
export function CarteDecompte({ prochain, href }: { prochain: ObjectifSaison | null; href?: string }) {
  const contenu = (
    <>
      <span className={styles.grand}>{prochain && prochain.statut.type !== "passe" ? decompte(prochain.statut.joursAvantCourse) : "—"}</span>
      <span className={styles.texte}>
        <span className={styles.surtitre}>Avant ton objectif</span>
        <span className={styles.titre}>{prochain ? titreObjectif(prochain) : "Aucun objectif"}</span>
        <span className={styles.sous}>
          {prochain
            ? `${prochain.nom ? `Bloc ${prochain.bloc} · course` : "Course"} le ${formatIsoCourt(prochain.date_objectif)}`
            : "Ajoute ta prochaine course dans Ma saison"}
        </span>
      </span>
      {href && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={styles.carte} aria-label={libelle(prochain)}>
      {contenu}
    </Link>
  ) : (
    <section className={styles.carte} aria-label={libelle(prochain)}>
      {contenu}
    </section>
  );
}

function libelle(prochain: ObjectifSaison | null): string {
  if (!prochain || prochain.statut.type === "passe") return "Aucun objectif : ouvrir Ma saison";
  const j = prochain.statut.joursAvantCourse;
  const reste = j === 0 ? "C'est le jour de ta course" : `Encore ${j} jour${j > 1 ? "s" : ""}`;
  return `${reste} avant ton objectif ${titreObjectif(prochain)}, le ${formatIsoCourt(prochain.date_objectif)}`;
}
