/**
 * Programme d'entraînement (tables seances, blocs_seance, programme) : règles testables, sans base.
 *
 * - Pendant un bloc (S, M, L, XL), le membre suit la semaine du bloc où il en est (« semaine 3/12 »).
 * - Sinon il suit le fil rouge, qui n'a pas de fin : ses semaines tournent en boucle
 *   (1, 2, … N, puis 1), calées sur le calendrier à partir du lundi de la semaine du lancement.
 * - Le programme reste dans l'app : jamais d'export ni de PDF.
 */
import { BLOCS, ecartJours, type Bloc, type Saison } from "./saison";
import { calculerZones, type Bornes, type Sport, type Tests } from "./zones";

export const SPORTS_SEANCE = ["natation", "velo", "course", "renfo"] as const;
export type SportSeance = (typeof SPORTS_SEANCE)[number];

export const NOMS_SPORTS: Record<SportSeance, string> = {
  natation: "Natation",
  velo: "Vélo",
  course: "Course à pied",
  renfo: "Renforcement",
};

export type Phase = "fil_rouge" | Bloc;

/** Semaine du programme suivie par le membre. */
export type SemaineProgramme = { phase: Phase; semaine: number };

export type BlocSeance = { libelle: string; detail: string; zone: 1 | 2 | 3 | 4 | 5 | null };

export type Seance = { id: string; sport: SportSeance; titre: string; dureeMinutes: number; blocs: BlocSeance[] };

/** Séance prévue un jour de la semaine (1 = lundi … 7 = dimanche). */
export type SeancePrevue = { jour: number; ordre: number; seance: Seance };

/** Lundi de la semaine du lancement (1er janvier 2027) : semaine 1 du fil rouge. */
export const DEPART_FIL_ROUGE = "2026-12-28";

/** Semaine du programme pour la semaine qui commence ce lundi. */
export function semaineDuProgramme(saison: Saison, lundi: string, semainesFilRouge: number): SemaineProgramme {
  const o = saison.enCours;
  if (o && o.statut.type === "en-cours") return { phase: o.bloc, semaine: o.statut.semaine };
  const n = Math.max(1, Math.floor(semainesFilRouge));
  const rang = Math.floor(ecartJours(DEPART_FIL_ROUGE, lundi) / 7);
  return { phase: "fil_rouge", semaine: (((rang % n) + n) % n) + 1 };
}

/** « 45 min », « 1 h », « 1 h 05 », « 2 h 30 ». */
export function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

const estSport = (v: unknown): v is SportSeance => (SPORTS_SEANCE as readonly unknown[]).includes(v);
export const estPhase = (v: unknown): v is Phase => v === "fil_rouge" || (BLOCS as readonly unknown[]).includes(v);
const estZone = (v: unknown): v is 1 | 2 | 3 | 4 | 5 => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
const entier = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

type Brut = Record<string, unknown>;
const objet = (v: unknown): Brut | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Brut) : null);

/** Séance lue en base (avec ses blocs, dans l'ordre) ; null si la ligne est incohérente. */
export function lireSeance(brute: unknown): Seance | null {
  const s = objet(brute);
  if (!s || typeof s.id !== "string" || !estSport(s.sport) || typeof s.titre !== "string" || !entier(s.duree_minutes, 1, 600)) return null;
  const blocs = (Array.isArray(s.blocs_seance) ? s.blocs_seance : [])
    .map(objet)
    .filter((b): b is Brut => !!b && typeof b.libelle === "string" && typeof b.ordre === "number")
    .sort((a, b) => (a.ordre as number) - (b.ordre as number))
    .map((b) => ({ libelle: b.libelle as string, detail: typeof b.detail === "string" ? b.detail : "", zone: estZone(b.zone) ? b.zone : null }));
  return { id: s.id, sport: s.sport, titre: s.titre, dureeMinutes: s.duree_minutes as number, blocs };
}

/** Lignes du programme lues en base (avec leur séance), triées par jour puis par ordre. */
export function lireSemaine(lignes: unknown): SeancePrevue[] {
  if (!Array.isArray(lignes)) return [];
  return lignes
    .flatMap((l): SeancePrevue[] => {
      const o = objet(l);
      const seance = o && lireSeance(o.seances);
      return o && seance && entier(o.jour, 1, 7) && entier(o.ordre, 1, 5)
        ? [{ jour: o.jour as number, ordre: o.ordre as number, seance }]
        : [];
    })
    .sort((a, b) => a.jour - b.jour || a.ordre - b.ordre);
}

/** Séances d'un jour (1 = lundi … 7 = dimanche). */
export const seancesDuJour = (semaine: SeancePrevue[], jour: number) => semaine.filter((s) => s.jour === jour).map((s) => s.seance);

export type CibleBloc =
  | { type: "sans-zone" }
  /** Allure ou puissance (et FC) calculées à partir des tests du membre. */
  | { type: "cible"; cible: string; frequenceCardiaque: string | null }
  /** Test manquant : allure verrouillée. */
  | { type: "verrouillee" };

/** Allure, puissance et FC d'une zone pour ce sport, à partir des tests (et des zones personnalisées). */
export function cibleDuBloc(sport: SportSeance, zone: BlocSeance["zone"], tests: Tests | null, bornesPerso?: Bornes | null): CibleBloc {
  if (!zone || sport === "renfo") return { type: "sans-zone" };
  if (!tests) return { type: "verrouillee" };
  const ligne = calculerZones(sport as Sport, tests, undefined, bornesPerso)[zone - 1];
  return ligne.cible ? { type: "cible", cible: ligne.cible, frequenceCardiaque: ligne.frequenceCardiaque } : { type: "verrouillee" };
}
