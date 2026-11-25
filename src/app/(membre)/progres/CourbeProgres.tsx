import type { PointHistorique, SportHistorique } from "@/lib/historique";
import { type Cadre, CADRE, courbe } from "@/lib/progres";
import styles from "./progres.module.css";

export const MESURE: Record<SportHistorique, string> = {
  course: "allure seuil en course",
  velo: "FTP à vélo",
  natation: "vitesse critique en natation",
  cardio: "FC seuil",
};

const pourcent = (v: number, total: number) => `${Math.round((v / total) * 1000) / 10}%`;

/**
 * Courbe lumineuse des progrès (un point par série de tests, plus haut = meilleur).
 * cadre : CADRE (téléphone, maquette) ou CADRE_LARGE (ordinateur) ; la courbe garde ses proportions.
 * id : distingue les dégradés quand plusieurs courbes sont dans la page.
 */
export function CourbeProgres({
  sport,
  points,
  cadre = CADRE,
  id,
}: {
  sport: SportHistorique;
  points: PointHistorique[];
  cadre?: Cadre;
  id: string;
}) {
  const c = courbe(sport, points, cadre);
  return (
    <div className={styles.courbe} style={{ aspectRatio: `${cadre.largeur} / ${cadre.hauteur}` }}>
      <svg
        viewBox={`0 0 ${cadre.largeur} ${cadre.hauteur}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={`Courbe de ta ${MESURE[sport]} : ${c.points.map((p) => `${p.valeur} le ${p.date}`).join(", ")}`}
      >
        <defs>
          <linearGradient id={`aire-progres-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--aurore)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--aurore)" stopOpacity="0" />
          </linearGradient>
          <filter id={`lueur-progres-${id}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        {[cadre.haut, (cadre.haut + cadre.bas) / 2, cadre.bas].map((y) => (
          <line key={y} x1={cadre.gauche} y1={y} x2={cadre.droite} y2={y} stroke="rgba(244, 238, 255, 0.12)" strokeWidth="1" />
        ))}
        {c.points.length > 1 && (
          <>
            <path d={c.aire} fill={`url(#aire-progres-${id})`} />
            <polyline points={c.ligne} fill="none" stroke="var(--aurore)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" filter={`url(#lueur-progres-${id})`} opacity="0.9" />
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
            <span className={styles.valeur} style={{ left: pourcent(p.x, cadre.largeur), top: `calc(${pourcent(p.y, cadre.hauteur)} - 14px)` }}>
              {p.valeur}
            </span>
            <span className={styles.date} style={{ left: pourcent(p.x, cadre.largeur), top: pourcent(cadre.dates, cadre.hauteur) }}>
              {p.date}
            </span>
          </span>
        ))}
    </div>
  );
}
