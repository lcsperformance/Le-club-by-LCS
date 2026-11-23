/**
 * Accueil (maquette) : cartes « Aujourd'hui », « FAQ en visio » et « Nouveau cette semaine ».
 * Règles testables, sans base ; les données viennent du programme, de l'agenda, de la boîte à questions
 * et des Ressources.
 */
import { seancesDuJour, type Seance, type SeancePrevue } from "./programme";
import { sousRubriques, type Ressource, type Theme } from "./ressources";

/** Ce que montre la carte « Aujourd'hui ». */
export type CarteAujourdhui =
  | { etat: "seance"; seance: Pick<Seance, "id" | "sport" | "titre" | "dureeMinutes">; faite: boolean; autres: number; jour: string }
  | { etat: "repos" }
  /** Semaine du programme pas encore écrite. */
  | { etat: "a-venir" }
  /** Niveau ou profil pas encore choisi. */
  | { etat: "niveau" };

/**
 * Séance du jour : la première du jour (dans l'ordre du programme), cochée si elle est déjà faite, avec le
 * nombre d'autres séances ce jour-là.
 * semaine : séances de la semaine (null : niveau ou profil pas choisi) ; jour : 1 = lundi … 7 = dimanche ;
 * faites : identifiants des séances déjà marquées faites aujourd'hui.
 */
export function carteAujourdhui(semaine: SeancePrevue[] | null, jour: number, aujourdhui: string, faites: string[]): CarteAujourdhui {
  if (semaine === null) return { etat: "niveau" };
  if (!semaine.length) return { etat: "a-venir" };
  const duJour = seancesDuJour(semaine, jour);
  if (!duJour.length) return { etat: "repos" };
  // D'abord la première séance pas encore faite : c'est celle qui reste à faire.
  const premiere = duJour.find((s) => !faites.includes(s.id)) ?? duJour[0];
  const { id, sport, titre, dureeMinutes } = premiere;
  return { etat: "seance", seance: { id, sport, titre, dureeMinutes }, faite: faites.includes(premiere.id), autres: duJour.length - 1, jour: aujourdhui };
}

/** « 1 question déposée », « 3 questions déposées », « Aucune question pour l'instant ». */
export function texteQuestionsFaq(n: number): string {
  if (n <= 0) return "Aucune question pour l'instant : pose la première !";
  return `${n} question${n > 1 ? "s" : ""} déposée${n > 1 ? "s" : ""} pour la prochaine FAQ.`;
}

/**
 * Contenu des Ressources débloqué cette semaine pour le membre (semaine de déblocage = semaine d'ancienneté),
 * le premier dans l'ordre des thèmes et des sous-rubriques. null s'il n'y en a pas (la carte est alors masquée),
 * et pour l'équipe du Club (semaine null : tout est déjà ouvert).
 */
export function nouveauCetteSemaine(themes: Theme[], ressources: Ressource[], semaine: number | null): Pick<Ressource, "id" | "titre" | "type"> | null {
  if (semaine === null) return null;
  for (const t of themes) {
    for (const s of sousRubriques(t, ressources)) {
      const r = s.contenus.find((c) => c.semaine_deblocage === semaine);
      if (r) return { id: r.id, titre: r.titre, type: r.type };
    }
  }
  return null;
}
