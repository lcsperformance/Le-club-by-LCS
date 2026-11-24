/**
 * Droits du membre sur ses données : export (fichier JSON) et suppression du compte.
 * Règles testables, sans base. Lecture : route /profil/donnees ; suppression : action supprimerMonCompte.
 */

/**
 * Ce que contient l'export : chaque table personnelle et ses colonnes, lues avec la session du membre
 * (la sécurité par ligne ne rend que les siennes). Jamais le programme d'entraînement de Martin
 * (il reste dans l'app), ni les clés techniques des appareils.
 */
export const TABLES_EXPORT = [
  { cle: "tests", table: "tests", colonnes: "date_test, allure_seuil_course, ftp, pma_5min, vitesse_critique_natation, fc_seuil" },
  { cle: "zones_personnalisees", table: "zones", colonnes: "sport, bornes, mis_a_jour" },
  { cle: "objectifs", table: "objectifs", colonnes: "bloc, date_objectif, nom" },
  { cle: "records", table: "records", colonnes: "epreuve, duree_secondes" },
  { cle: "seances_faites", table: "ressentis", colonnes: "date_seance, rpe, commentaire, seances(sport, titre)" },
  { cle: "ressources_suivies", table: "suivi_ressources", colonnes: "favori, consulte_le, ressources(titre)" },
  { cle: "commentaires", table: "commentaires_ressources", colonnes: "texte, cree_le, ressources(titre)" },
  { cle: "messages_club", table: "messages_club", colonnes: "canal, texte, cree_le" },
  { cle: "questions_faq", table: "questions_faq", colonnes: "texte, cree_le, traitee_le" },
  { cle: "appareils_notifications", table: "appareils_notifications", colonnes: "cree_le" },
] as const;

/** Colonnes de la fiche du membre dans l'export. */
export const COLONNES_FICHE =
  "email, prenom, nom, niveau, profil, date_inscription, formule, statut_abonnement, abonnement_fin, annulation_prevue, acces_offert_jusqua, notif_annonces, notif_faq, notif_evenements, conditions_version, conditions_acceptees_le";

/** « le-club-mes-donnees-2026-11-24.json ». */
export const nomFichierExport = (jour: string) => `le-club-mes-donnees-${jour}.json`;

/** Mot à taper pour confirmer la suppression du compte. */
export const MOT_DE_CONFIRMATION = "SUPPRIMER";

export const confirmationValide = (saisie: unknown) =>
  typeof saisie === "string" && saisie.trim().toUpperCase() === MOT_DE_CONFIRMATION;

/** L'abonnement Stripe est-il encore à résilier (sinon le membre continuerait d'être prélevé) ? */
export const abonnementEnCours = (statutStripe: string) => ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(statutStripe);
