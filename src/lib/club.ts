/**
 * Club (maquette) : canaux de discussion collectifs, en direct. Règles testables, sans base.
 * Pas de messages privés : seuls les canaux de la table « canaux » existent.
 */
import { ajouterJours } from "./saison";
import { dateDuJourParis, formatDateCourteFr, formatHeureFr } from "./dates";
import type { Bloc } from "./saison";

export type Canal = { cle: string; nom: string; description: string; lecture_seule: boolean; ordre: number };

export type Message = {
  id: string;
  canal: string;
  membre_id: string;
  auteur: string;
  auteur_role: string;
  texte: string;
  cree_le: string;
};

export const LONGUEUR_MAX_MESSAGE = 1000;
/** Messages chargés à l'ouverture d'un canal, puis à chaque « Voir les messages précédents ». */
export const MESSAGES_PAR_PAGE = 50;

/** Message saisi : 1 à 1 000 caractères, espaces du début et de la fin retirés. */
export function lireMessage(saisie: unknown): { texte: string } | { erreur: string } {
  const texte = typeof saisie === "string" ? saisie.trim() : "";
  if (!texte) return { erreur: "Écris ton message avant de l'envoyer." };
  if (texte.length > LONGUEUR_MAX_MESSAGE) return { erreur: `Ton message dépasse ${LONGUEUR_MAX_MESSAGE} caractères.` };
  return { texte };
}

/** Qui peut écrire dans ce canal : tout le monde, sauf « annonces » réservé à l'admin et au coach. */
export const peutEcrire = (canal: Pick<Canal, "lecture_seule">, role: string) => !canal.lecture_seule || role === "admin" || role === "coach";

/** Badge de non-lus : rien, « 3 », ou « 99+ ». */
export const badgeNonLus = (n: number) => (n <= 0 ? null : n > 99 ? "99+" : String(n));

/** Étiquette à côté du prénom : « Coach », « Équipe du Club », ou rien pour un membre. */
export const libelleRole = (role: string) => (role === "coach" ? "Coach" : role === "admin" ? "Équipe du Club" : null);

/** Canal du bloc en cours (« Mon bloc ») : bloc-s, bloc-m, bloc-l ou bloc-xl, sinon aucun (fil rouge). */
export const canalDuBloc = (bloc: Bloc | null | undefined) => (bloc ? `bloc-${bloc.toLowerCase()}` : null);

export const initialeAuteur = (auteur: string) => (auteur.trim().charAt(0) || "?").toLocaleUpperCase("fr-FR");

/** « 14 h 30 », à l'heure de Paris. */
export const heureMessage = (iso: string) => formatHeureFr(new Date(iso));

/** Séparateur de jour : « Aujourd'hui », « Hier » ou « 18/11/2026 ». */
export function jourMessage(iso: string, aujourdhui: string): string {
  const jour = dateDuJourParis(new Date(iso));
  if (jour === aujourdhui) return "Aujourd'hui";
  if (jour === ajouterJours(aujourdhui, -1)) return "Hier";
  return formatDateCourteFr(new Date(iso));
}

const parDate = (a: Message, b: Message) => (a.cree_le < b.cree_le ? -1 : a.cree_le > b.cree_le ? 1 : a.id.localeCompare(b.id));

/** Ajoute des messages (reçus en direct, envoyés ou plus anciens) sans doublon, du plus ancien au plus récent. */
export function fusionnerMessages(actuels: Message[], nouveaux: Message[]): Message[] {
  const parId = new Map(actuels.map((m) => [m.id, m]));
  for (const m of nouveaux) parId.set(m.id, m);
  return [...parId.values()].sort(parDate);
}

export const retirerMessage = (actuels: Message[], id: string) => actuels.filter((m) => m.id !== id);

/** Messages regroupés par jour, dans l'ordre. */
export function groupesParJour(messages: Message[], aujourdhui: string): { jour: string; messages: Message[] }[] {
  const groupes: { jour: string; messages: Message[] }[] = [];
  for (const m of [...messages].sort(parDate)) {
    const jour = jourMessage(m.cree_le, aujourdhui);
    const dernier = groupes[groupes.length - 1];
    if (dernier?.jour === jour) dernier.messages.push(m);
    else groupes.push({ jour, messages: [m] });
  }
  return groupes;
}

/** Message reçu en direct (ligne brute de la base), ou null s'il est incomplet. */
export function lireMessageRecu(brut: unknown): Message | null {
  const m = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : null;
  if (!m) return null;
  const champs = ["id", "canal", "membre_id", "auteur", "auteur_role", "texte", "cree_le"] as const;
  if (!champs.every((c) => typeof m[c] === "string")) return null;
  return Object.fromEntries(champs.map((c) => [c, m[c]])) as Message;
}

/**
 * Non-lus de la liste des canaux, mis à jour quand un message arrive (liste à côté d'un canal ouvert) :
 * +1 pour son canal, sauf si c'est le canal ouvert (il est lu en direct) ou si c'est son propre message.
 */
export function nonLusApresMessage(
  nonLus: Record<string, number>,
  message: Pick<Message, "canal" | "membre_id">,
  actif: string | null,
  moi: string,
): Record<string, number> {
  if (message.canal === actif || message.membre_id === moi) return nonLus;
  return { ...nonLus, [message.canal]: (nonLus[message.canal] ?? 0) + 1 };
}
