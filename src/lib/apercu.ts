import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { LigneJournal, MembreAdmin } from "@/lib/admin/membres";
import type { Utilisateur } from "@/lib/auth";
import type { PointHistorique } from "@/lib/historique";
import type { SeancePrevue, Seance } from "@/lib/programme";
import type { Records } from "@/lib/records";
import type { CommentaireAdmin, ContenuAdmin } from "@/lib/admin/ressources-serveur";
import type { Evenement } from "@/lib/agenda";
import type { AthleteCoach, SeanceCoach } from "@/lib/coach";
import type { Canal, Message } from "@/lib/club";
import type { Question } from "@/lib/questions";
import type { Commentaire, Ressource, Suivi, Theme } from "@/lib/ressources";
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
  nom: "Dupont",
  role: "membre",
  niveau: null,
  profil: null,
  dateInscription: "2026-11-02T10:00:00.000Z",
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

const ressourceFictive = (n: number, theme: string, sous_rubrique: string, titre: string, type: Ressource["type"], semaine_deblocage: number): Ressource => ({
  id: `00000000-0000-0000-0001-0000000000${String(n).padStart(2, "0")}`,
  theme,
  sous_rubrique,
  titre,
  type,
  semaine_deblocage,
  ordre: n,
});

/** Catalogue fictif (membre en semaine 3) : contenus ouverts et verrouillés, un titre très long. */
export const SEMAINE_RESSOURCES_FICTIVE = 3;
export const RESSOURCES_FICTIVES: Ressource[] = [
  ressourceFictive(1, "nutrition", "bases", "Les macronutriments en 5 minutes", "video", 1),
  ressourceFictive(2, "nutrition", "bases", "Guide : composer ses repas de la semaine quand on s'entraîne deux fois par jour", "pdf", 1),
  ressourceFictive(3, "nutrition", "effort", "Que manger pendant une sortie longue", "video", 3),
  ressourceFictive(4, "nutrition", "effort", "Tableau des apports en glucides", "pdf", 4),
  ressourceFictive(5, "natation", "technique", "Technique de nage : les bases", "video", 3),
  ressourceFictive(6, "velo", "puissance", "Comprendre sa puissance seuil (FTP)", "video", 2),
  ressourceFictive(7, "preparation", "chaleur_transitions", "Transitions vélo–course : le guide", "pdf", 6),
];

export const SUIVIS_FICTIFS: Record<string, Suivi> = {
  [RESSOURCES_FICTIVES[0].id]: { favori: true, consulte_le: "2027-01-08T18:00:00.000Z" },
  [RESSOURCES_FICTIVES[1].id]: { favori: false, consulte_le: "2027-01-09T07:30:00.000Z" },
  [RESSOURCES_FICTIVES[5].id]: { favori: true, consulte_le: null },
};

export const COMMENTAIRES_FICTIFS: Commentaire[] = [
  { id: "c1", auteur: "Hugo", auteur_role: "membre", texte: "Super clair, merci ! J'avais tendance à oublier les lipides.", cree_le: "2027-01-08T18:42:00.000Z", mien: false },
  { id: "c2", auteur: "Martin", auteur_role: "coach", texte: "Gardez ce repère en tête pour vos sorties longues du week-end.", cree_le: "2027-01-09T07:15:00.000Z", mien: false },
  { id: "c3", auteur: "Caroline", auteur_role: "membre", texte: "Je la regarde avant chaque bloc 💪", cree_le: "2027-01-10T20:05:00.000Z", mien: true },
];

const sous = (cle: string, nom: string, ordre: number) => ({ cle, nom, ordre });

/** Thèmes fictifs : les 5 thèmes du Club, comme dans la base. */
export const THEMES_FICTIFS: Theme[] = [
  { cle: "nutrition", nom: "Nutrition", icone: "nutrition", ordre: 1, sous_rubriques: [sous("bases", "Les bases de la nutrition", 1), sous("effort", "Nutrition à l'effort", 2)] },
  { cle: "natation", nom: "Natation", icone: "natation", ordre: 2, sous_rubriques: [sous("technique", "Technique", 1), sous("eau_libre", "Eau libre", 2)] },
  { cle: "velo", nom: "Vélo", icone: "velo", ordre: 3, sous_rubriques: [sous("position_materiel", "Position et matériel", 1), sous("puissance", "Travail de puissance", 2)] },
  { cle: "course", nom: "Course à pied", icone: "course", ordre: 4, sous_rubriques: [sous("technique", "Technique de course", 1), sous("sorties_longues", "Sorties longues", 2)] },
  {
    cle: "preparation",
    nom: "Préparation",
    icone: "preparation",
    ordre: 5,
    sous_rubriques: [sous("tests_zones", "Tests et zones", 1), sous("chaleur_transitions", "Chaleur et transitions", 2)],
  },
];

/** Contenus fictifs vus par l'admin : avec et sans lien, avec et sans PDF, une miniature. */
export const CONTENUS_ADMIN_FICTIFS: ContenuAdmin[] = RESSOURCES_FICTIVES.map((r, i) => ({
  ...r,
  youtube_id: r.type === "video" && i % 2 === 0 ? "dQw4w9WgXcQ" : null,
  fichier: r.type === "pdf" && i === 1 ? `${r.theme}/00000000-0000-0000-0000-000000000001.pdf` : null,
  miniature: null,
}));

export const COMMENTAIRES_ADMIN_FICTIFS: CommentaireAdmin[] = COMMENTAIRES_FICTIFS.map((c) => ({
  id: c.id,
  ressource_id: RESSOURCES_FICTIVES[0].id,
  titre: RESSOURCES_FICTIVES[0].titre,
  auteur: c.auteur,
  auteur_role: c.auteur_role,
  texte: c.texte,
  cree_le: c.cree_le,
}));

/** Canaux du Club, comme dans la base. */
export const CANAUX_FICTIFS: Canal[] = [
  { cle: "annonces", nom: "annonces", description: "Rappels, nouveaux contenus, événements", lecture_seule: true, ordre: 1 },
  { cle: "general", nom: "général", description: "La discussion libre du Club", lecture_seule: false, ordre: 2 },
  { cle: "presentations", nom: "présentations", description: "Dis-nous qui tu es et ce que tu prépares", lecture_seule: false, ordre: 3 },
  { cle: "bloc-m", nom: "bloc-m", description: "Préparation triathlon M", lecture_seule: false, ordre: 4 },
  { cle: "bloc-l", nom: "bloc-l", description: "Préparation triathlon L", lecture_seule: false, ordre: 5 },
  { cle: "nutrition-matos", nom: "nutrition-matos", description: "Nutrition, matériel, bons plans", lecture_seule: false, ordre: 6 },
  { cle: "courses", nom: "courses", description: "Calendrier, résultats, retours de course", lecture_seule: false, ordre: 7 },
];

export const NON_LUS_FICTIFS: Record<string, number> = { annonces: 2, general: 3, "bloc-m": 1, courses: 128 };

const message = (n: number, canal: string, membre_id: string, auteur: string, auteur_role: string, texte: string, cree_le: string): Message => ({
  id: `00000000-0000-0000-0002-0000000000${String(n).padStart(2, "0")}`,
  canal,
  membre_id,
  auteur,
  auteur_role,
  texte,
  cree_le,
});

const HUGO = "00000000-0000-0000-0000-0000000000a2";
const MARTIN = "00000000-0000-0000-0000-0000000000c0";

/** Fil fictif de # général : hier et aujourd'hui (AUJOURDHUI_FICTIF), un message de Caroline (UTILISATEUR_FICTIF). */
export const MESSAGES_FICTIFS: Message[] = [
  message(1, "general", HUGO, "Hugo", "membre", "Quelqu'un fait la sortie longue vélo samedi du côté de Rambouillet ?", "2027-01-10T17:20:00.000Z"),
  message(2, "general", MARTIN, "Martin", "coach", "Pensez à bien vous hydrater, il va faire froid mais sec.", "2027-01-10T18:02:00.000Z"),
  message(3, "general", "00000000-0000-0000-0000-000000000000", "Caroline", "membre", "Partante ! Départ 9 h ?", "2027-01-11T07:45:00.000Z"),
  message(
    4,
    "general",
    HUGO,
    "Hugo",
    "membre",
    "Parfait, 9 h au parking de la gare. Prévoyez des gels et une couche coupe-vent : on annonce du vent de face sur le retour vers la vallée de Chevreuse.",
    "2027-01-11T08:10:00.000Z",
  ),
];

export const ANNONCES_FICTIVES: Message[] = [
  message(5, "annonces", MARTIN, "Martin", "coach", "Nouvelle vidéo dans Ressources › Nutrition : que manger pendant une sortie longue.", "2027-01-11T06:30:00.000Z"),
];

/** Agenda fictif (janvier 2027, heures de Paris), avec un événement aux dates à confirmer. */
export const EVENEMENTS_FICTIFS: Evenement[] = [
  {
    id: "00000000-0000-0000-0003-000000000001",
    titre: "FAQ en visio",
    type: "faq",
    debut: "2027-01-14T18:30:00.000Z",
    fin: "2027-01-14T19:30:00.000Z",
    lieu: "En visio",
    lien: "https://visio.exemple.fr/faq-janvier",
    description: "Martin répond en direct aux questions déposées dans la boîte à questions.",
    dates_a_confirmer: false,
    periode: null,
  },
  {
    id: "00000000-0000-0000-0003-000000000002",
    titre: "Webinaire : bien démarrer sa saison avec un titre assez long",
    type: "webinaire",
    debut: "2027-01-21T19:00:00.000Z",
    fin: "2027-01-21T20:00:00.000Z",
    lieu: "En visio",
    lien: null,
    description: null,
    dates_a_confirmer: false,
    periode: null,
  },
  {
    id: "00000000-0000-0000-0003-000000000003",
    titre: "Week-end vélo",
    type: "autre",
    debut: "2027-05-01T08:00:00.000Z",
    fin: null,
    lieu: null,
    lien: null,
    description: null,
    dates_a_confirmer: true,
    periode: "Printemps 2027",
  },
];

const question = (n: number, membre_id: string, auteur: string, texte: string, cree_le: string, traitee_le: string | null = null): Question => ({
  id: `00000000-0000-0000-0004-0000000000${String(n).padStart(2, "0")}`,
  membre_id,
  auteur,
  auteur_role: "membre",
  texte,
  cree_le,
  traitee_le,
});

/** Questions fictives : une de Caroline (UTILISATEUR_FICTIF), une traitée, une très longue. */
export const QUESTIONS_FICTIVES: Question[] = [
  question(1, "00000000-0000-0000-0000-0000000000a2", "Thomas", "Comment adapter ma semaine si je rate une séance ?", "2027-01-08T19:12:00.000Z"),
  question(2, "00000000-0000-0000-0000-000000000000", "Caroline", "Faut-il refaire ses tests avant chaque bloc ?", "2027-01-10T08:40:00.000Z"),
  question(
    3,
    "00000000-0000-0000-0000-0000000000a3",
    "Élodie",
    "Quelle stratégie de nutrition adopter sur un triathlon L quand on a l'estomac fragile et qu'il fait très chaud sur le parcours vélo ?",
    "2027-01-10T21:05:00.000Z",
  ),
  question(4, "00000000-0000-0000-0000-0000000000a4", "Hugo", "Combien de séances de natation par semaine pour un Finisher ?", "2026-12-20T10:00:00.000Z", "2026-12-28T20:30:00.000Z"),
];

const athlete = (n: number, prenom: string | null, nom: string | null, niveau: AthleteCoach["niveau"], acces_en_cours = true): AthleteCoach => ({
  id: `00000000-0000-0000-0005-0000000000${String(n).padStart(2, "0")}`,
  prenom,
  nom,
  niveau,
  profil: niveau ? "extensif" : null,
  date_inscription: "2026-11-02T10:00:00.000Z",
  acces_en_cours,
});

/** Athlètes vus par le coach : niveaux variés, un nom très long, un sans nom, un ancien membre. */
export const ATHLETES_FICTIFS: AthleteCoach[] = [
  athlete(1, "Caroline", "Dupont", "challenger"),
  athlete(2, "Thomas", "Bernard", "finisher"),
  athlete(3, "Léa", "Martin-Delacroix de Saint-Exupéry", "performer"),
  athlete(4, "Hugo", null, null),
  athlete(5, "Élodie", "Moreau", "challenger", false),
];

/** Séances fictives de Caroline (aujourd'hui = 11/01/2027), dont une avec douleur et une séance retirée. */
export const SEANCES_COACH_FICTIVES: SeanceCoach[] = [
  { date: "2027-01-10", sport: "course", titre: "Sortie longue", rpe: 6, douleur: false, commentaire: "Jambes un peu lourdes sur la fin." },
  { date: "2027-01-09", sport: "velo", titre: "Sortie longue", rpe: 5, douleur: false, commentaire: null },
  { date: "2027-01-07", sport: "velo", titre: "Sweet spot", rpe: 8, douleur: false, commentaire: "Dur sur le 3e intervalle." },
  {
    date: "2027-01-05",
    sport: "course",
    titre: "Footing endurance",
    rpe: 5,
    douleur: true,
    commentaire: "Gêne au mollet droit sur les lignes droites, qui a disparu après l'étirement mais qui revient quand j'accélère.",
  },
  { date: "2026-12-28", sport: null, titre: null, rpe: 3, douleur: false, commentaire: null },
];
