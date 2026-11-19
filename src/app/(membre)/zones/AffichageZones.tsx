import Link from "next/link";
import { Carte, PastilleZone } from "@/components/ui";
import { formatDateFr } from "@/lib/dates";
import { calculerZones, SPORTS, type Sport, type Tests } from "@/lib/zones";
import styles from "./zones.module.css";

/** Sélecteur de sport et cartes des 5 zones, calculées à partir d'un test. */
export function AffichageZones({ sport, test }: { sport: Sport; test: Tests & { date_test: string } }) {
  const zones = calculerZones(sport, test);
  const libelleSport = SPORTS.find((s) => s.cle === sport)!.libelle;

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

      <section aria-label={`Zones ${libelleSport}`} style={{ display: "grid", gap: 10 }}>
        {zones.map((z) => (
          <Carte key={z.zone} className={styles.zone}>
            <PastilleZone zone={z.zone} />
            <div className={styles.infos}>
              <h2 className={`titre-carte ${styles.nom}`}>{z.nom}</h2>
              <p className={styles.detail}>{z.pourcentages}</p>
            </div>
            <div className={styles.valeurs}>
              <p className={styles.cible}>{z.cible ?? "—"}</p>
              {z.frequenceCardiaque && <p className={styles.fc}>{z.frequenceCardiaque}</p>}
            </div>
          </Carte>
        ))}
      </section>

      <p style={{ fontSize: 13, color: "#a9a4c9", textAlign: "center", lineHeight: 1.5 }}>
        D&apos;après tes tests du {formatDateFr(new Date(`${test.date_test}T12:00:00`))}.{" "}
        <Link href="/tests" className="lien">
          Refaire mes tests
        </Link>
      </p>
    </>
  );
}
