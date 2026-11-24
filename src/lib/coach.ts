/**
 * Espace coach (maquette Coach) : liste des athlètes et historique en lecture seule. Règles testables.
 * Le coach ne voit ni e-mail ni abonnement : seulement prénom, nom, niveau, profil, objectifs et séances.
 */
import type { Niveau, Profil } from "./profils";
import { formatIsoCourt, titreObjectif, type Objectif } from "./saison";

export type AthleteCoach = {
  id: string;
  prenom: string | null;
  nom: string | null;
  niveau: Niveau | null;
  profil: Profil | null;
  date_inscription: string;
  acces_en_cours: boolean;
};

/** Séance faite par l'athlète, avec son ressenti (RPE, commentaire ; lecture seule). */
export type SeanceCoach = {
  date: string;
  sport: string | null;
  titre: string | null;
  rpe: number | null;
  commentaire: string | null;
};

/** « Caroline Dupont », « Caroline », ou « Athlète sans nom ». */
export const nomAthlete = (a: Pick<AthleteCoach, "prenom" | "nom">) => [a.prenom, a.nom].filter(Boolean).join(" ") || "Athlète sans nom";

export const initialeAthlete = (a: Pick<AthleteCoach, "prenom" | "nom">) => (a.prenom || a.nom || "?").charAt(0).toLocaleUpperCase("fr-FR");

const normaliser = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Athlètes dont l'accès est en cours (ou tous avec « anciens »), filtrés par prénom ou nom, par ordre alphabétique. */
export function filtrerAthletes(athletes: AthleteCoach[], recherche: string, anciens: boolean): AthleteCoach[] {
  const mots = normaliser(recherche).split(/\s+/).filter(Boolean);
  return athletes
    .filter((a) => anciens || a.acces_en_cours)
    .filter((a) => {
      const texte = normaliser(nomAthlete(a));
      return mots.every((m) => texte.includes(m));
    })
    .sort((a, b) => nomAthlete(a).localeCompare(nomAthlete(b), "fr"));
}

const JOURS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** « Dim. 15 nov. » (et l'année si ce n'est pas celle d'aujourd'hui : « Dim. 15 nov. 2026 »). */
export function dateSeance(iso: string, aujourdhui: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const base = `${JOURS[d.getUTCDay()]} ${+iso.slice(8, 10)} ${MOIS[+iso.slice(5, 7) - 1]}`;
  return iso.slice(0, 4) === aujourdhui.slice(0, 4) ? base : `${base} ${iso.slice(0, 4)}`;
}

/** Couleur du RPE : effort léger (1-4), moyen (5-7) ou fort (8-10). */
export const niveauRpe = (rpe: number | null) => (rpe === null ? "aucun" : rpe <= 4 ? "leger" : rpe <= 7 ? "moyen" : "fort");

/** Séances de la plus récente à la plus ancienne. */
export function trierSeances(seances: SeanceCoach[]): SeanceCoach[] {
  return [...seances].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const NOMS_SPORTS: Record<string, string> = { natation: "Natation", velo: "Vélo", course: "Course", renfo: "Renfo" };
export const nomSport = (sport: string | null) => (sport ? (NOMS_SPORTS[sport] ?? sport) : "—");

/** Objectifs à venir : « Triathlon de Nice · Bloc M · 14/02/2027 » ou « Bloc L · 30/05/2027 ». */
export function objectifsAVenir(objectifs: Objectif[], aujourdhui: string): string[] {
  return objectifs
    .filter((o) => o.date_objectif >= aujourdhui)
    .sort((a, b) => (a.date_objectif < b.date_objectif ? -1 : 1))
    .map((o) => (o.nom ? `${titreObjectif(o)} · Bloc ${o.bloc} · ${formatIsoCourt(o.date_objectif)}` : `Bloc ${o.bloc} · ${formatIsoCourt(o.date_objectif)}`));
}
