import Link from "next/link";
import { Cadenas } from "@/components/Cadenas";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import { badgeNonLus, type Canal } from "@/lib/club";
import { ActualiserEnDirect } from "./ActualiserEnDirect";
import styles from "./club.module.css";

/** Onglets du Club (maquette) : Discussion, Questions, Agenda. */
export function OngletsClub({ actif }: { actif: "discussion" | "questions" | "agenda" }) {
  const onglets = [
    { cle: "discussion", libelle: "Discussion", href: "/club" },
    { cle: "questions", libelle: "Questions", href: "/club/questions" },
    { cle: "agenda", libelle: "Agenda", href: "/club/agenda" },
  ] as const;
  return (
    <nav className={styles.onglets} aria-label="Rubriques du Club">
      {onglets.map((o) => (
        <Link key={o.cle} href={o.href} className={styles.onglet} aria-current={o.cle === actif ? "page" : undefined}>
          {o.libelle}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Le Club (maquette) : la liste des canaux collectifs, avec le badge de non-lus et « Mon bloc ».
 * direct : met à jour les badges dès qu'un message arrive (désactivé dans les aperçus).
 */
export function EcranClub({
  utilisateur,
  canaux,
  nonLus,
  monBloc,
  direct = true,
}: {
  utilisateur: Utilisateur;
  canaux: Canal[];
  nonLus: Record<string, number>;
  monBloc: string | null;
  direct?: boolean;
}) {
  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Le Club" />
      <OngletsClub actif="discussion" />
      <ul className={styles.canaux}>
        {canaux.map((c) => {
          const badge = badgeNonLus(nonLus[c.cle] ?? 0);
          return (
            <li key={c.cle}>
              <Carte href={`/club/${c.cle}`} className={styles.canal}>
                <span className={`${styles.diese} ${c.lecture_seule ? styles.dieseAnnonces : ""}`} aria-hidden>
                  #
                </span>
                <span className={styles.canalTexte}>
                  <span className={styles.canalNom}>
                    {c.nom}
                    {monBloc === c.cle && <span className={styles.monBloc}>Mon bloc</span>}
                  </span>
                  <span className={styles.canalDescription}>{c.description}</span>
                </span>
                {c.lecture_seule && (
                  <span className={styles.cadenas} role="img" aria-label="Lecture seule">
                    <Cadenas />
                  </span>
                )}
                {badge && (
                  <span className={styles.nonLus} aria-label={`${badge} message${badge === "1" ? "" : "s"} non lu${badge === "1" ? "" : "s"}`}>
                    {badge}
                  </span>
                )}
              </Carte>
            </li>
          );
        })}
      </ul>
      {direct && <ActualiserEnDirect />}
    </>
  );
}
