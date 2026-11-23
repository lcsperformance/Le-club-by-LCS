import Link from "next/link";
import { BoutonPrincipal, Carte } from "@/components/ui";
import type { PointHistorique, SportHistorique } from "@/lib/historique";
import { CADRE, courbe, gainDepuisPremier, lignesHistorique, ONGLETS_PROGRES } from "@/lib/progres";
import styles from "./progres.module.css";

const MESURE: Record<SportHistorique, string> = {
  course: "allure seuil en course",
  velo: "FTP à vélo",
  natation: "vitesse critique en natation",
  cardio: "FC seuil",
};

const pourcent = (v: number, total: number) => `${Math.round((v / total) * 1000) / 10}%`;

/**
 * Mes progrès (maquette) : un onglet par sport, gain depuis le premier test, courbe lumineuse
 * (un point par série de tests) et historique.
 * points : historique du sport choisi ; testsFaits : le membre a déjà fait au moins une série de tests.
 */
export function EcranProgres({ sport, points, testsFaits }: { sport: SportHistorique; points: PointHistorique[]; testsFaits: boolean }) {
  const gain = gainDepuisPremier(sport, points);
  const c = courbe(sport, points);
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

          {points.length === 0 ? (
            <Carte>
              <p className="message-info">Pas encore de mesure de ta {MESURE[sport]}. Ajoute-la lors de ta prochaine série de tests.</p>
            </Carte>
          ) : (
            <>
              <Carte className={styles.carteCourbe}>
                <p className={styles.gain}>
                  <span className={styles.gainGrand}>{gain ? gain.grand : "Premier test"}</span>
                  <span className={styles.gainSous}>{gain ? gain.sous : `ta ${MESURE[sport]} de départ`}</span>
                </p>
                <p className={styles.depuis}>{gain ? "depuis ton premier test" : "refais tes tests pour voir ta progression"}</p>
                <div className={styles.courbe}>
                  <svg
                    viewBox={`0 0 ${CADRE.largeur} ${CADRE.hauteur}`}
                    width="100%"
                    height="100%"
                    role="img"
                    aria-label={`Courbe de ta ${MESURE[sport]} : ${c.points.map((p) => `${p.valeur} le ${p.date}`).join(", ")}`}
                  >
                    <defs>
                      <linearGradient id="aire-progres" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--aurore)" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="var(--aurore)" stopOpacity="0" />
                      </linearGradient>
                      <filter id="lueur-progres" x="-20%" y="-50%" width="140%" height="200%">
                        <feGaussianBlur stdDeviation="5" />
                      </filter>
                    </defs>
                    {[CADRE.haut, (CADRE.haut + CADRE.bas) / 2, CADRE.bas].map((y) => (
                      <line key={y} x1={CADRE.gauche} y1={y} x2={CADRE.droite} y2={y} stroke="rgba(244, 238, 255, 0.12)" strokeWidth="1" />
                    ))}
                    {c.points.length > 1 && (
                      <>
                        <path d={c.aire} fill="url(#aire-progres)" />
                        <polyline points={c.ligne} fill="none" stroke="var(--aurore)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" filter="url(#lueur-progres)" opacity="0.9" />
                        <polyline points={c.ligne} fill="none" stroke="var(--texte)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                      </>
                    )}
                    {c.points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={p.dernier ? 8 : 5.5}
                        fill={p.dernier ? "var(--accent)" : "var(--texte)"}
                        stroke="var(--aurore)"
                        strokeWidth="2.5"
                        style={p.dernier ? { filter: "drop-shadow(0 0 6px rgba(222, 253, 98, 0.8))" } : undefined}
                      />
                    ))}
                  </svg>
                  {c.points
                    .filter((p) => p.etiquette)
                    .map((p, i) => (
                      <span key={i} aria-hidden>
                        <span className={styles.valeur} style={{ left: pourcent(p.x, CADRE.largeur), top: `calc(${pourcent(p.y, CADRE.hauteur)} - 14px)` }}>
                          {p.valeur}
                        </span>
                        <span className={styles.date} style={{ left: pourcent(p.x, CADRE.largeur), top: pourcent(CADRE.dates, CADRE.hauteur) }}>
                          {p.date}
                        </span>
                      </span>
                    ))}
                </div>
              </Carte>

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
      )}
      <div style={{ height: 12 }} />
    </>
  );
}
