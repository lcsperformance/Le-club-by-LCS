/**
 * Notifications du Club : annonces, rappel la veille d'une FAQ en visio, nouvel événement ou date modifiée (hors FAQ). Règles testables, sans navigateur ni base.
 *
 * - La demande d'autorisation n'est JAMAIS faite à l'ouverture d'une page : une carte sur l'accueil
 *   (après la connexion) propose « Activer » ; la fenêtre du téléphone ne s'ouvre qu'au toucher du bouton.
 * - iPhone et iPad : les notifications n'existent que dans l'app installée sur l'écran d'accueil (iOS 16.4+).
 * - Réglages du membre dans le Profil (membres.notif_annonces, membres.notif_faq).
 * - Envoi : src/lib/notifications-serveur.ts ; rappels : route /api/rappels-faq (tâche Vercel du soir).
 */
import { aAcces } from "./abonnement/etat";
import { enHeureDeParis, quandCourt, quandEvenement, type Evenement } from "./agenda";
import { dateDuJourParis, formatHeureFr } from "./dates";

export type TypeNotification = "annonces" | "faq" | "evenements";

/** Ce qu'affiche le téléphone, et la page ouverte quand on touche la notification. */
export type Notification = { titre: string; corps: string; url: string; etiquette: string };

/** Clé du navigateur qui retient que le membre a fermé la carte « Activer les notifications ». */
export const CLE_CARTE_NOTIF_FERMEE = "le-club:notifications-fermee";

/** Ce que propose la carte de l'accueil. */
export type CarteNotifications = "activer" | "installer-d-abord" | null;

export function carteNotifications(etat: {
  /** Le navigateur sait recevoir des notifications (Notification, PushManager, petit programme). */
  priseEnCharge: boolean;
  /** "default" (jamais demandé), "granted" (accepté) ou "denied" (refusé). */
  permission: NotificationPermission | null;
  /** Cet appareil est déjà enregistré pour recevoir les notifications. */
  abonne: boolean;
  apple: boolean;
  /** L'app est ouverte depuis son icône. */
  installee: boolean;
  fermee: boolean;
}): CarteNotifications {
  if (etat.fermee) return null;
  // iPhone / iPad dans Safari : il faut d'abord installer l'app.
  if (etat.apple && !etat.installee) return "installer-d-abord";
  if (!etat.priseEnCharge || etat.permission === "denied") return null;
  if (etat.permission === "granted" && etat.abonne) return null;
  return "activer";
}

/** Appareil envoyé par le navigateur (PushSubscription en JSON), vérifié avant enregistrement. */
export type AppareilSaisi = { endpoint: string; p256dh: string; auth: string };

export function lireAppareil(v: unknown): AppareilSaisi | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const texte = (x: unknown, max: number): x is string => typeof x === "string" && x.length > 0 && x.length <= max;
  if (!texte(o.endpoint, 1000) || !/^https:\/\//.test(o.endpoint)) return null;
  if (!texte(o.keys?.p256dh, 200) || !texte(o.keys?.auth, 100)) return null;
  return { endpoint: o.endpoint, p256dh: o.keys.p256dh, auth: o.keys.auth };
}

const raccourcir = (t: string, max: number) => {
  const net = t.replace(/\s+/g, " ").trim();
  return net.length <= max ? net : `${net.slice(0, max - 1).trimEnd()}…`;
};

/** Nouvelle annonce : « Annonce de Martin » + début du message ; ouvre le canal annonces. */
export function notificationAnnonce(message: { id: string; texte: string; auteur: string | null }): Notification {
  return {
    titre: message.auteur ? `Annonce de ${message.auteur}` : "Annonce du Club",
    corps: raccourcir(message.texte, 140),
    url: "/club/annonces",
    etiquette: `annonce-${message.id}`,
  };
}

/** Rappel la veille : « FAQ en visio demain à 19 h 30 » ; ouvre la boîte à questions. */
export function notificationRappelFaq(e: Pick<Evenement, "id" | "titre" | "debut">): Notification {
  return {
    titre: `${e.titre || "FAQ en visio"} demain`,
    corps: `Rendez-vous demain à ${formatHeureFr(new Date(e.debut))}. Il est encore temps de poser ta question.`,
    url: "/club/questions",
    etiquette: `faq-${e.id}`,
  };
}

/** FAQ en visio de demain (date de Paris), pas encore rappelées. */
export function faqARappeler(evenements: Evenement[], maintenant: Date, dejaRappelees: ReadonlySet<string>): Evenement[] {
  const aujourdhui = dateDuJourParis(maintenant);
  const demain = new Date(Date.parse(`${aujourdhui}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  return evenements.filter(
    (e) => e.type === "faq" && !e.dates_a_confirmer && enHeureDeParis(e.debut).date === demain && !dejaRappelees.has(e.id),
  );
}

/** Fiche d'un membre, telle que lue par le serveur pour choisir les destinataires. */
export type MembreNotifiable = {
  id: string;
  role: "membre" | "coach" | "admin";
  abonnement_fin: string | null;
  acces_offert_jusqua: string | null;
  acces_coupe: boolean;
  notif_annonces: boolean;
  notif_faq: boolean;
  notif_evenements: boolean;
};

/**
 * Qui reçoit : les membres dont l'accès est ouvert (et l'équipe du Club), qui n'ont pas coupé
 * ce type de notification dans leur Profil ; jamais l'auteur de l'annonce.
 */
export function destinataires(membres: MembreNotifiable[], type: TypeNotification, maintenant: Date, auteurId?: string): string[] {
  return membres
    .filter((m) => m.id !== auteurId)
    .filter((m) => (type === "annonces" ? m.notif_annonces : type === "faq" ? m.notif_faq : m.notif_evenements))
    .filter((m) => aAcces(m, maintenant))
    .map((m) => m.id);
}

// ---------------------------------------------------------------------------
// Agenda : nouvel événement, ou date modifiée (jamais pour les FAQ : elles reviennent chaque semaine
// et ont déjà leur rappel la veille).
// ---------------------------------------------------------------------------

type DatesEvenement = Pick<Evenement, "type" | "debut" | "fin" | "dates_a_confirmer" | "periode">;

/** Faut-il prévenir les membres ? « nouveau » à la création, « date » si la date change, sinon rien. */
export function changementAgenda(avant: DatesEvenement | null, apres: DatesEvenement): "nouveau" | "date" | null {
  if (apres.type === "faq") return null;
  if (!avant) return "nouveau";
  const memeInstant = (a: string | null, b: string | null) => (a && b ? Date.parse(a) === Date.parse(b) : a === b);
  const inchange =
    memeInstant(avant.debut, apres.debut) &&
    memeInstant(avant.fin, apres.fin) &&
    avant.dates_a_confirmer === apres.dates_a_confirmer &&
    (avant.periode ?? null) === (apres.periode ?? null);
  return inchange ? null : "date";
}

/** « Nouvel événement : Webinaire » / « Date modifiée : Stage » + quand ; ouvre l'agenda. */
export function notificationEvenement(
  e: Pick<Evenement, "id" | "titre" | "debut" | "fin" | "dates_a_confirmer" | "periode">,
  nature: "nouveau" | "date",
  maintenant: Date,
): Notification {
  return {
    titre: `${nature === "nouveau" ? "Nouvel événement" : "Date modifiée"} : ${raccourcir(e.titre, 60)}`,
    corps: e.dates_a_confirmer ? quandEvenement(e) : quandCourt(e, maintenant),
    url: "/club/agenda",
    etiquette: `evenement-${e.id}`,
  };
}
