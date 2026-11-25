import Link from "next/link";
import { BoutonPrincipal, Carte, DeuxColonnes, SurOrdinateur, SurTelephone } from "@/components/ui";
import type { PointHistorique, SportHistorique } from "@/lib/historique";
import { CADRE_LARGE, gainDepuisPremier, lignesHistorique, ONGLETS_PROGRES } from "@/lib/progres";
import { CourbeProgres, MESURE } from "./CourbeProgres";
import styles from "./progres.module.css";



/**
 * Mes progrès (maquette) : un onglet par sport, gain depuis le premier test, courbe lumineuse
 * (un point par série de tests) et historique.
 * points : historique du sport choisi ; testsFaits : le membre a déjà fait au moins une série de tests.
 */
export function EcranProgres({ sport, points, testsFaits }: { sport: SportHistorique; points: PointHistorique[]; testsFaits: boolean }) {
  const gain = gainDepuisPremier(sport, points);
  const lignes = lignesHistorique(sport, points);

  return (
    <>
      <Link href="/zones" className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Mes zones
      </Link>
      <header>
        <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
          Mes progrès
        </h1>
        <p className={styles.intro}>Un point à chaque série de tests. Regarde jusqu&apos;où tu es arrivé.</p>
      </header>

      {!testsFaits ? (
        <Carte style={{ display: "grid", gap: 12 }}>
          <p className="message-info">Tes courbes apparaîtront après ta première série de tests.</p>
          <BoutonPrincipal href="/tests">Faire mes tests</BoutonPrincipal>
        </Carte>
      ) : (
        <>
          <nav className={styles.selecteur} aria-label="Choix du sport">
            {ONGLETS_PROGRES.map((o) => (
              <Link
                key={o.cle}
                href={o.cle === "course" ? "/progres" : `/progres?sport=${o.cle}`}
                className={styles.onglet}
                aria-current={o.cle === sport ? "page" : undefined}
                scroll={false}
              >
                {o.libelle}
              </Link>
            ))}
          </nav>

          <DeuxColonnes
            collante
            principale={
              points.length === 0 ? (
                <Carte>
                  <p className="message-info">Pas encore de mesure de ta {MESURE[sport]}. Ajoute-la lors de ta prochaine série de tests.</p>
                </Carte>
              ) : (
                <Carte className={styles.carteCourbe}>
                  <p className={styles.gain}>
                    <span className={styles.gainGrand}>{gain ? gain.grand : "Premier test"}</span>
                    <span className={styles.gainSous}>{gain ? gain.sous : `ta ${MESURE[sport]} de départ`}</span>
                  </p>
                  <p className={styles.depuis}>{gain ? "depuis ton premier test" : "refais tes tests pour voir ta progression"}</p>
                  <SurTelephone>
                    <CourbeProgres sport={sport} points={points} id="telephone" />
                  </SurTelephone>
                  <SurOrdinateur>
                    <CourbeProgres sport={sport} points={points} cadre={CADRE_LARGE} id="ordinateur" />
                  </SurOrdinateur>
                </Carte>
              )
            }
            laterale={
              <>
                {points.length > 0 && (
                  <>
                    <h2 className={styles.surtitre}>Historique</h2>
                    <Carte as="section" className={styles.historique} aria-label="Historique des tests">
                      <ol className={styles.lignes}>
                        {lignes.map((l) => (
                          <li key={l.date} className={styles.ligne}>
                            <span className={styles.ligneDate}>{l.date}</span>
                            <span className={styles.ligneValeur}>{l.valeur}</span>
                            <span className={styles.ligneEcart}>{l.ecart ?? ""}</span>
                          </li>
                        ))}
                      </ol>
                    </Carte>
                  </>
                )}
                <BoutonPrincipal href="/tests">Refaire mes tests</BoutonPrincipal>
              </>
            }
          />
        </>
      )}
      <div style={{ height: 12 }} />
    </>
  );
}
