import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { LigneJournal, MembreAdmin } from "@/lib/admin/membres";
import type { Utilisateur } from "@/lib/auth";
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
