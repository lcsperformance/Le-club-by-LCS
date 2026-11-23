/** Boîte à questions du Club (FAQ en visio) : règles testables. Pas de votes. */
import { formatDateCourteFr } from "./dates";

export type Question = {
  id: string;
  membre_id: string;
  auteur: string;
  auteur_role: string;
  texte: string;
  cree_le: string;
  traitee_le: string | null;
};

export const LONGUEUR_MAX_QUESTION = 300;

/** Question saisie : 1 à 300 caractères. */
export function lireQuestion(saisie: unknown): { texte: string } | { erreur: string } {
  const texte = typeof saisie === "string" ? saisie.trim() : "";
  if (!texte) return { erreur: "Écris ta question avant de l'envoyer." };
  if (texte.length > LONGUEUR_MAX_QUESTION) return { erreur: `Ta question dépasse ${LONGUEUR_MAX_QUESTION} caractères : va à l'essentiel.` };
  return { texte };
}

/** « Posée par Thomas le 18/11/2026 », « Posée par toi… », et « · Traitée en FAQ » le cas échéant. */
export function sousTitreQuestion(q: Question, moi: string): string {
  const qui = q.membre_id === moi ? "toi" : q.auteur;
  return `Posée par ${qui} le ${formatDateCourteFr(new Date(q.cree_le))}${q.traitee_le ? " · Traitée en FAQ" : ""}`;
}

/** Les questions à traiter d'abord (de la plus ancienne à la plus récente), puis les traitées (récentes d'abord). */
export function trierQuestions(questions: Question[]): Question[] {
  const aTraiter = questions.filter((q) => !q.traitee_le).sort((a, b) => (a.cree_le < b.cree_le ? -1 : 1));
  const traitees = questions.filter((q) => q.traitee_le).sort((a, b) => (a.traitee_le! > b.traitee_le! ? -1 : 1));
  return [...aTraiter, ...traitees];
}
