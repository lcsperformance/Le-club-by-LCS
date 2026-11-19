import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Utilisateur } from "@/lib/auth";
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
  role: "membre",
  niveau: null,
  profil: null,
  abonnement: { statut: "actif", fin: "2027-02-10T10:00:00.000Z", annulationPrevue: false, clientStripe: true },
};

export const TEST_FICTIF = {
  date_test: "2026-11-19",
  allure_seuil_course: 270,
  ftp: 220,
  vitesse_critique_natation: 105,
  fc_seuil: 168,
};
