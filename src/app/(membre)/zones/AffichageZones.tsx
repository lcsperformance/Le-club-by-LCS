import Link from "next/link";
import type { Bornes } from "@/lib/config-zones";
import { formatDateFr } from "@/lib/dates";
import { SPORTS, type Sport, type Tests } from "@/lib/zones";
import { ListeZones } from "./ListeZones";
import styles from "./zones.module.css";

/** Sélecteur de sport et cartes des 5 zones, calculées à partir d'un test. */
export function AffichageZones({
  sport,
  test,
  bornesEnregistrees = null,
  personnalisationOuverte = false,
}: {
  sport: Sport;
  test: Tests & { date_test: string };
  bornesEnregistrees?: Bornes | null;
  personnalisationOuverte?: boolean;
}) {
  return (
    <>
      <nav className={styles.selecteur} aria-label="Choix du sport">
        {SPORTS.map((s) => (
          <Link
            key={s.cle}
            href={s.cle === "course" ? "/zones" : `/zones?sport=${s.cle}`}
            className={styles.onglet}
            aria-current={s.cle === sport ? "page" : undefined}
            scroll={false}
          >
            {s.libelle}
          </Link>
        ))}
      </nav>

      <ListeZones
        key={sport}
        sport={sport}
        test={test}
        bornesEnregistrees={bornesEnregistrees}
        personnalisationOuverte={personnalisationOuverte}
      />

      <p style={{ fontSize: 13, color: "#a9a4c9", textAlign: "center", lineHeight: 1.5 }}>
        D&apos;après tes tests du {formatDateFr(new Date(`${test.date_test}T12:00:00`))}.{" "}
        <Link href="/tests" className="lien">
          Refaire mes tests
        </Link>
      </p>
    </>
  );
}
