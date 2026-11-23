/**
 * Mes progrès (maquette) : courbe, gain depuis le premier test et historique, sport par sport.
 * Les points viennent de l'historique des tests (historiqueSport), du plus ancien au plus récent.
 * Allures (course, natation) : plus la valeur baisse, plus le membre va vite.
 */
import type { PointHistorique, SportHistorique } from "./historique";
import { formatIsoCourt } from "./saison";
import { formatMinSec } from "./tests-depart";

export const ONGLETS_PROGRES: { cle: SportHistorique; libelle: string }[] = [
  { cle: "course", libelle: "Course" },
  { cle: "velo", libelle: "Vélo" },
  { cle: "natation", libelle: "Natation" },
  { cle: "cardio", libelle: "Cardio" },
];

/** Sport demandé dans l'adresse (?sport=velo), course par défaut. */
export function sportProgres(valeur: unknown): SportHistorique {
  return ONGLETS_PROGRES.some((o) => o.cle === valeur) ? (valeur as SportHistorique) : "course";
}

const MOINS = "−";
const estAllure = (sport: SportHistorique) => sport === "course" || sport === "natation";
const signe = (n: number) => (n > 0 ? "+" : n < 0 ? MOINS : "");

/** « 4:30 /km », « 1:45 /100 m », « 220 W », « 168 bpm ». */
export function formatValeur(sport: SportHistorique, v: number): string {
  switch (sport) {
    case "course":
      return `${formatMinSec(v)} /km`;
    case "natation":
      return `${formatMinSec(v)} /100 m`;
    case "velo":
      return `${v} W`;
    case "cardio":
      return `${v} bpm`;
  }
}

const UNITE_ECART: Record<SportHistorique, string> = { course: "s", natation: "s", velo: "W", cardio: "bpm" };

/** Écart avec le test précédent : « −5 s », « +8 W », « +2 bpm », « = ». */
export function ecart(sport: SportHistorique, avant: number, apres: number): string {
  const d = apres - avant;
  return d === 0 ? "=" : `${signe(d)}${Math.abs(d)} ${UNITE_ECART[sport]}`;
}

/** Gain depuis le premier test (grand chiffre et phrase dessous), ou null avec un seul test. */
export function gainDepuisPremier(sport: SportHistorique, points: PointHistorique[]): { grand: string; sous: string } | null {
  if (points.length < 2) return null;
  const premier = points[0].valeur;
  const dernier = points[points.length - 1].valeur;
  const d = dernier - premier;
  switch (sport) {
    case "course":
    case "natation": {
      const unite = sport === "course" ? "s/km" : "s/100 m";
      const quoi = sport === "course" ? "ton allure seuil" : "ta vitesse critique";
      if (d === 0) return { grand: `0 ${unite}`, sous: `même allure qu'au premier test sur ${quoi}` };
      return { grand: `${signe(d)}${Math.abs(d)} ${unite}`, sous: `${d < 0 ? "plus vite" : "plus lent"} sur ${quoi}` };
    }
    case "velo":
      return { grand: d === 0 ? "0 W" : `${signe(d)}${Math.abs(d)} W`, sous: "sur ta puissance seuil (FTP)" };
    case "cardio":
      return { grand: d === 0 ? "0 bpm" : `${signe(d)}${Math.abs(d)} bpm`, sous: "sur ta FC seuil" };
  }
}

/** Lignes de l'historique, du test le plus récent au plus ancien. */
export function lignesHistorique(sport: SportHistorique, points: PointHistorique[]) {
  return points
    .map((p, i) => ({
      date: formatIsoCourt(p.date),
      valeur: formatValeur(sport, p.valeur),
      ecart: i > 0 ? ecart(sport, points[i - 1].valeur, p.valeur) : null,
    }))
    .reverse();
}

/** Repère de la courbe (même cadre que la maquette : 330 × 190). */
export const CADRE = { largeur: 330, hauteur: 190, gauche: 30, droite: 300, haut: 44, bas: 150, dates: 176 } as const;

export type PointCourbe = {
  x: number;
  y: number;
  valeur: string;
  /** « 18/11 » */
  date: string;
  dernier: boolean;
  /** Avec beaucoup de points, seuls le premier et le dernier portent leur valeur et leur date. */
  etiquette: boolean;
};

const arrondi = (n: number) => Math.round(n * 10) / 10;

/**
 * Courbe : un point par série de tests, réparti de gauche à droite.
 * Plus haut = meilleur (allure plus rapide, puissance ou FC plus élevée).
 */
export function courbe(sport: SportHistorique, points: PointHistorique[]): { points: PointCourbe[]; ligne: string; aire: string } {
  if (!points.length) return { points: [], ligne: "", aire: "" };
  const { gauche: G, droite: D, haut: H, bas: B } = CADRE;
  const valeurs = points.map((p) => p.valeur);
  const etendue = Math.max(Math.max(...valeurs) - Math.min(...valeurs), 1);
  const mini = Math.min(...valeurs) - etendue * 0.4;
  const maxi = Math.max(...valeurs) + etendue * 0.4;
  const n = points.length;
  const x = (i: number) => (n === 1 ? (G + D) / 2 : G + ((D - G) * i) / (n - 1));
  const y = (v: number) => (estAllure(sport) ? H + ((B - H) * (v - mini)) / (maxi - mini) : B - ((B - H) * (v - mini)) / (maxi - mini));
  const pc = points.map((p, i) => ({
    x: arrondi(x(i)),
    y: arrondi(y(p.valeur)),
    valeur: formatValeur(sport, p.valeur),
    date: `${p.date.slice(8, 10)}/${p.date.slice(5, 7)}`,
    dernier: i === n - 1,
    etiquette: n <= 4 || i === 0 || i === n - 1,
  }));
  const ligne = pc.map((p) => `${p.x},${p.y}`).join(" ");
  const aire = `M${pc[0].x},${B} L${pc.map((p) => `${p.x},${p.y}`).join(" L")} L${pc[n - 1].x},${B} Z`;
  return { points: pc, ligne, aire };
}
