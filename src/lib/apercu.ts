import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { LigneJournal, MembreAdmin } from "@/lib/admin/membres";
import type { Utilisateur } from "@/lib/auth";
import type { PointHistorique } from "@/lib/historique";
import type { SeancePrevue, Seance } from "@/lib/programme";
import type { Records } from "@/lib/records";
import type { Objectif } from "@/lib/saison";
import { apercuActif } from "@/lib/roles";

/** Bloque les pages d'aperçu hors du mode test (404). */
export async function exigerApercu() {
  await connection();
  if (!apercuActif()) notFound();
}

/** Données fictives des aperçus. */
export const UTILISATEUR_FICTIF: Utilisateur = {
  id: "00000000-0000-0000-0000-000000000000",
  email: "prenom.nom-tres-long@exemple-de-domaine.fr",
  prenom: "Caroline",
  role: "membre",
  niveau: null,
  profil: null,
  abonnement: { statut: "actif", fin: "2027-02-10T10:00:00.000Z", annulationPrevue: false, formule: "mensuelle", clientStripe: true, offertJusqua: null, coupe: false },
};

export const TEST_FICTIF = {
  date_test: "2026-11-19",
  allure_seuil_course: 270,
  ftp: 220,
  vitesse_critique_natation: 105,
  fc_seuil: 168,
};

/** Membres fictifs de l'espace admin : un cas par situation. */
const membreFictif = (m: Partial<MembreAdmin> & Pick<MembreAdmin, "id" | "email">): MembreAdmin => ({
  prenom: null,
  niveau: null,
  statut_abonnement: "actif",
  abonnement_fin: "2027-02-10T10:00:00.000Z",
  annulation_prevue: false,
  formule: "mensuelle",
  date_inscription: "2026-11-02T10:00:00.000Z",
  acces_offert_jusqua: null,
  acces_coupe: false,
  ...m,
});

export const MEMBRES_FICTIFS: MembreAdmin[] = [
  membreFictif({ id: "m1", email: "caroline.dupont@exemple.fr", prenom: "Caroline", niveau: "challenger" }),
  membreFictif({
    id: "m2",
    email: "elodie.martin-tres-long-nom@exemple-de-domaine.fr",
    prenom: "Élodie",
    niveau: "performer",
    statut_abonnement: "impaye",
    abonnement_fin: "2027-01-20T10:00:00.000Z",
    date_inscription: "2025-09-01T10:00:00.000Z",
  }),
  membreFictif({ id: "m3", email: "thomas@exemple.fr", prenom: "Thomas", niveau: "finisher", annulation_prevue: true }),
  membreFictif({
    id: "m4",
    email: "ambassadeur@exemple.fr",
    prenom: "Léa",
    statut_abonnement: "inactif",
    abonnement_fin: null,
    formule: null,
    acces_offert_jusqua: "2027-06-30T21:59:59.000Z",
    date_inscription: "2027-01-08T10:00:00.000Z",
  }),
  membreFictif({ id: "m5", email: "bloque@exemple.fr", prenom: "Marc", acces_coupe: true, niveau: "challenger" }),
  membreFictif({
    id: "m6",
    email: "ancien@exemple.fr",
    statut_abonnement: "resilie",
    abonnement_fin: "2026-12-01T10:00:00.000Z",
    date_inscription: "2026-06-01T10:00:00.000Z",
  }),
];

export const JOURNAL_FICTIF: LigneJournal[] = [
  { membre_id: "m5", action: "acces_coupe", detail: null, fait_le: "2027-01-09T15:30:00.000Z" },
  { membre_id: "m4", action: "acces_offert", detail: "30/06/2027", fait_le: "2027-01-08T11:00:00.000Z" },
  { membre_id: "m4", action: "email_acces_renvoye", detail: "Invitation", fait_le: "2027-01-08T11:02:00.000Z" },
];

/** « Aujourd'hui » des aperçus de saison (un lundi), pour des écrans toujours identiques. */
export const AUJOURDHUI_FICTIF = "2027-01-11";

const objectifFictif = (n: number, bloc: Objectif["bloc"], date_objectif: string, nom: string | null = null): Objectif => ({
  id: `00000000-0000-0000-0000-0000000000${String(n).padStart(2, "0")}`,
  bloc,
  date_objectif,
  nom,
});

/** Saison avec un bloc à venir (nom très long), un bloc qui le chevauche et une course terminée. */
export const OBJECTIFS_FICTIFS: Objectif[] = [
  objectifFictif(1, "M", "2027-05-30", "Triathlon international de Saint-Jean-de-Luz Côte Basque"),
  objectifFictif(2, "S", "2027-06-20"),
  objectifFictif(3, "S", "2026-12-20"),
];

/** Saison avec un bloc en cours (démarré en cours de route) et un bloc plus tard. */
export const OBJECTIFS_EN_COURS_FICTIFS: Objectif[] = [
  objectifFictif(4, "M", "2027-02-14", "Triathlon de Nice"),
  objectifFictif(5, "XL", "2027-09-05"),
];

const seanceFictive = (n: number, sport: Seance["sport"], titre: string, dureeMinutes: number, blocs: Seance["blocs"]): Seance => ({
  id: `00000000-0000-0000-0000-0000000001${String(n).padStart(2, "0")}`,
  sport,
  titre,
  dureeMinutes,
  blocs,
});

export const SEANCE_COURSE_FICTIVE = seanceFictive(2, "course", "Footing endurance avec un titre de séance assez long", 50, [
  { libelle: "Échauffement", detail: "10 min en douceur", zone: 1 },
  { libelle: "Footing", detail: "30 min régulier", zone: 2 },
  { libelle: "Lignes droites", detail: "5 × 20 s, récupération en marchant entre chaque ligne droite", zone: 4 },
  { libelle: "Retour au calme", detail: "5 min", zone: 1 },
]);

export const SEANCE_RENFO_FICTIVE = seanceFictive(3, "renfo", "Gainage & stabilité", 30, [
  { libelle: "Mobilité hanches", detail: "5 min", zone: null },
  { libelle: "Circuit gainage", detail: "3 tours · 40 s par exercice", zone: null },
  { libelle: "Fentes & montées de banc", detail: "3 × 10 par jambe", zone: null },
]);

/** Semaine fictive (Challenger, comme la maquette) : vendredi au repos, deux séances le jeudi. */
export const SEMAINE_FICTIVE: SeancePrevue[] = [
  {
    jour: 1,
    ordre: 1,
    seance: seanceFictive(1, "natation", "Technique & endurance", 45, [
      { libelle: "Échauffement", detail: "300 m souple", zone: 1 },
      { libelle: "Corps de séance", detail: "5 × 200 m, récup 20 s", zone: 3 },
    ]),
  },
  { jour: 2, ordre: 1, seance: SEANCE_COURSE_FICTIVE },
  { jour: 3, ordre: 1, seance: SEANCE_RENFO_FICTIVE },
  {
    jour: 4,
    ordre: 1,
    seance: seanceFictive(4, "velo", "Sweet spot", 75, [{ libelle: "Corps de séance", detail: "3 × 10 min, récup 5 min", zone: 3 }]),
  },
  {
    jour: 4,
    ordre: 2,
    seance: seanceFictive(5, "course", "Enchaînement", 15, [{ libelle: "Course", detail: "15 min", zone: 3 }]),
  },
  {
    jour: 6,
    ordre: 1,
    seance: seanceFictive(6, "velo", "Sortie longue", 150, [{ libelle: "Endurance", detail: "2 h 30 régulier", zone: 2 }]),
  },
  {
    jour: 7,
    ordre: 1,
    seance: seanceFictive(7, "course", "Sortie longue", 80, [{ libelle: "Endurance", detail: "1 h 20", zone: 2 }]),
  },
];

/** Historique fictif de l'allure seuil en course : 4 séries de tests, de plus en plus rapides. */
export const HISTORIQUE_COURSE_FICTIF: PointHistorique[] = [
  { date: "2026-09-14", valeur: 292 },
  { date: "2026-10-12", valeur: 284 },
  { date: "2026-11-16", valeur: 286 },
  { date: "2027-01-11", valeur: 270 },
];

/** Historique fictif de la FTP : 7 séries (seuls le premier et le dernier point portent leur valeur). */
export const HISTORIQUE_VELO_FICTIF: PointHistorique[] = [180, 186, 185, 194, 201, 208, 220].map((valeur, i) => ({
  date: `2026-${String(i + 3).padStart(2, "0")}-15`,
  valeur,
}));

export const RECORDS_FICTIFS: Records = { "10km": 41 * 60 + 32, semi: 3600 + 32 * 60 + 10, tri_xl: 11 * 3600 + 4 * 60 + 59 };

/** Séances fictives faites cette semaine-là (lundi et mardi), comme sur la maquette. */
export const SEANCES_FAITES_FICTIVES = ["2027-01-11|00000000-0000-0000-0000-000000000101", "2027-01-12|00000000-0000-0000-0000-000000000102"];
