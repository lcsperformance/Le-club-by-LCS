/**
 * Ma saison : objectifs de course et blocs de préparation (maquette/Main-neon.dc.html).
 *
 * - Le bloc d'un objectif commence « durée × 7 jours » avant la date de course
 *   (durées dans config/blocs.json, jamais écrites en dur ici).
 * - En dehors des blocs, le membre suit le fil rouge.
 * - Si la course est trop proche, le bloc démarre en cours de route (ex. semaine 5 sur 12).
 * - Si deux blocs se chevauchent, celui de la course la plus proche mène.
 *
 * Toutes les dates sont des jours du calendrier au format AAAA-MM-JJ (colonne « date »),
 * comparées sans heure ni fuseau ; « aujourd'hui » vient de dateDuJourParis().
 */
import configBrute from "../../config/blocs.json";
import { BLOCS, validerConfigBlocs, type Bloc } from "./config-blocs";

export { BLOCS, type Bloc } from "./config-blocs";

/** Configuration validée au chargement : une erreur bloque la compilation. */
export const CONFIG_BLOCS = validerConfigBlocs(configBrute).blocs;

/** Nombre maximal d'objectifs par membre (protection, largement au-dessus d'une vraie saison). */
export const OBJECTIFS_MAX = 20;

/** Une course ne se programme pas plus de 3 ans à l'avance. */
export const ANNEES_MAX = 3;

export type Objectif = { id: string; bloc: Bloc; date_objectif: string; nom?: string | null };

/** Longueur maximale du nom de course (vérifiée aussi par la base). */
export const LONGUEUR_MAX_NOM = 60;

/** Nom de course saisi : espaces nettoyés ; vide = pas de nom (null). */
export function lireNomCourse(valeur: unknown): { nom: string | null } | { erreur: string } {
  if (valeur === null || valeur === undefined) return { nom: null };
  if (typeof valeur !== "string") return { erreur: "Ce nom n'est pas valable." };
  const nom = valeur.replace(/\s+/g, " ").trim();
  if (!nom) return { nom: null };
  if (nom.length > LONGUEUR_MAX_NOM) return { erreur: `${LONGUEUR_MAX_NOM} caractères maximum pour le nom de ta course.` };
  return { nom };
}

/** « Triathlon de Nice » si le membre l'a nommée, sinon « Triathlon M ». */
export const titreObjectif = (o: Pick<Objectif, "bloc" | "nom">) => o.nom || `Triathlon ${o.bloc}`;

export const estBloc = (v: unknown): v is Bloc => (BLOCS as readonly unknown[]).includes(v);

export const semainesBloc = (bloc: Bloc) => CONFIG_BLOCS[bloc].semaines;

/** « 12 semaines », ou « 6 semaines (provisoire) ». */
export function dureeBloc(bloc: Bloc): string {
  const { semaines, provisoire } = CONFIG_BLOCS[bloc];
  return `${semaines} semaine${semaines > 1 ? "s" : ""}${provisoire ? " (provisoire)" : ""}`;
}

// ---------- calendrier (jours sans heure) ----------

const JOUR = 86_400_000;
const enJours = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / JOUR;
const depuisJours = (n: number) => new Date(n * JOUR).toISOString().slice(0, 10);

/** Vrai pour une date AAAA-MM-JJ qui existe vraiment (pas de 31/02). */
export function estDateIso(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && depuisJours(enJours(v)) === v;
}

export const ajouterJours = (iso: string, n: number) => depuisJours(enJours(iso) + n);
export const ecartJours = (de: string, a: string) => enJours(a) - enJours(de);

/** « 30/05/2027 ». */
export const formatIsoCourt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** « dimanche 30 mai 2027 ». */
export function formatIsoLong(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(enJours(iso) * JOUR));
}

// ---------- règles ----------

/** Premier jour du bloc : date de course moins sa durée en semaines. */
export const debutBloc = (bloc: Bloc, dateCourse: string) => ajouterJours(dateCourse, -semainesBloc(bloc) * 7);

export type Statut =
  | { type: "passe" }
  | { type: "a-venir"; debut: string; semaines: number; joursAvantCourse: number }
  | { type: "en-cours"; semaine: number; semaines: number; joursAvantCourse: number };

/** Où en est un objectif aujourd'hui (le jour de la course compte encore dans le bloc). */
export function statut(bloc: Bloc, dateCourse: string, aujourdhui: string): Statut {
  const semaines = semainesBloc(bloc);
  const debut = debutBloc(bloc, dateCourse);
  const joursAvantCourse = ecartJours(aujourdhui, dateCourse);
  if (joursAvantCourse < 0) return { type: "passe" };
  if (aujourdhui < debut) return { type: "a-venir", debut, semaines, joursAvantCourse };
  const semaine = Math.min(semaines, Math.floor(ecartJours(debut, aujourdhui) / 7) + 1);
  return { type: "en-cours", semaine, semaines, joursAvantCourse };
}

/** « J-63 », ou « Jour J » le jour de la course. */
export const decompte = (jours: number) => (jours === 0 ? "Jour J" : `J-${jours}`);

/** Vérifie une date de course choisie par le membre ; renvoie un message d'erreur ou null. */
export function erreurDateCourse(date: unknown, aujourdhui: string): string | null {
  if (!estDateIso(date)) return "Choisis une date valide.";
  if (date < aujourdhui) return "Choisis une date à venir.";
  if (date > ajouterJours(aujourdhui, 365 * ANNEES_MAX)) return `Choisis une date dans les ${ANNEES_MAX} ans qui viennent.`;
  return null;
}

/** Ce que le membre va suivre s'il choisit ce bloc et cette date (aperçu avant d'ajouter). */
export function apercuBloc(bloc: Bloc, dateCourse: string, aujourdhui: string): string {
  const s = statut(bloc, dateCourse, aujourdhui);
  if (s.type === "passe") return "Choisis une date à venir.";
  if (s.type === "en-cours") {
    if (debutBloc(bloc, dateCourse) === aujourdhui) return `Ton bloc de ${s.semaines} semaines démarre aujourd'hui.`;
    return `Ton bloc démarre en cours de route : tu seras en semaine ${s.semaine} sur ${s.semaines}.`;
  }
  return `Tu suis le fil rouge jusqu'au ${formatIsoCourt(ajouterJours(s.debut, -1))}, puis ton bloc de ${s.semaines} semaines démarre le ${formatIsoCourt(s.debut)}.`;
}

export type ObjectifSaison = Objectif & {
  statut: Statut;
  debut: string;
  /** Vrai pour le bloc qui mène aujourd'hui (au plus un). */
  mene: boolean;
  /** Date de course de l'objectif qui mène quand ce bloc est en attente, sinon null. */
  enAttenteDe: string | null;
  /** Dates de course des autres objectifs à venir dont le bloc chevauche celui-ci. */
  chevauche: string[];
};

export type Saison = {
  /** Objectifs à venir (course la plus proche d'abord), puis terminés (le plus récent d'abord). */
  objectifs: ObjectifSaison[];
  /** Prochaine course à venir (ou du jour), pour le décompte. */
  prochain: ObjectifSaison | null;
  /** Bloc qui mène aujourd'hui ; null = fil rouge. */
  enCours: ObjectifSaison | null;
};

export function organiserSaison(objectifs: Objectif[], aujourdhui: string): Saison {
  const tous = objectifs.map((o) => ({
    ...o,
    statut: statut(o.bloc, o.date_objectif, aujourdhui),
    debut: debutBloc(o.bloc, o.date_objectif),
    mene: false,
    enAttenteDe: null as string | null,
    chevauche: [] as string[],
  }));
  const parDate = (a: Objectif, b: Objectif) => (a.date_objectif < b.date_objectif ? -1 : a.date_objectif > b.date_objectif ? 1 : 0);
  const aVenir = tous.filter((o) => o.statut.type !== "passe").sort(parDate);
  const passes = tous.filter((o) => o.statut.type === "passe").sort((a, b) => parDate(b, a));

  // Le bloc de la course la plus proche mène ; les autres blocs déjà commencés attendent.
  const enCours = aVenir.find((o) => o.statut.type === "en-cours") ?? null;
  if (enCours) {
    enCours.mene = true;
    for (const o of aVenir) if (o !== enCours && o.statut.type === "en-cours") o.enAttenteDe = enCours.date_objectif;
  }
  for (const o of aVenir) {
    o.chevauche = aVenir
      .filter((x) => x !== o && x.debut <= o.date_objectif && o.debut <= x.date_objectif)
      .map((x) => x.date_objectif);
  }
  return { objectifs: [...aVenir, ...passes], prochain: aVenir[0] ?? null, enCours };
}

/** Texte du statut sous un objectif. */
export function texteStatut(o: ObjectifSaison): string {
  const s = o.statut;
  if (s.type === "passe") return "Terminé";
  if (o.enAttenteDe) return `Bloc en attente : celui du ${formatIsoCourt(o.enAttenteDe)} passe d'abord · ${decompte(s.joursAvantCourse)}`;
  if (s.type === "en-cours") return `Bloc en cours · semaine ${s.semaine}/${s.semaines} · ${decompte(s.joursAvantCourse)}`;
  return `Fil rouge jusqu'au ${formatIsoCourt(ajouterJours(s.debut, -1))}, puis bloc de ${s.semaines} semaines · ${decompte(s.joursAvantCourse)}`;
}

/** Phase du moment : « Bloc M, semaine 3/12 » ou « Fil rouge ». */
export function phaseDuMoment(saison: Saison): string {
  const o = saison.enCours;
  if (!o || o.statut.type !== "en-cours") return "Fil rouge";
  return `Bloc ${o.bloc}, semaine ${o.statut.semaine}/${o.statut.semaines}`;
}

/** Phase courte pour la date de l'accueil : « semaine 2 du bloc S » ou « fil rouge ». */
export function phaseCourte(saison: Saison): string {
  const o = saison.enCours;
  if (!o || o.statut.type !== "en-cours") return "fil rouge";
  return `semaine ${o.statut.semaine} du bloc ${o.bloc}`;
}

/** Carte de l'accueil (maquette) : bloc en cours, ou fil rouge avec le prochain bloc. */
export function carteAccueil(saison: Saison): { surtitre: string; titre: string; sous: string; progression: number | null } {
  const o = saison.enCours;
  if (o && o.statut.type === "en-cours") {
    const s = o.statut;
    return {
      surtitre: "Bloc en cours",
      titre: `${titreObjectif(o)} · semaine ${s.semaine}/${s.semaines}`,
      sous: `${decompte(s.joursAvantCourse)} · course le ${formatIsoCourt(o.date_objectif)}`,
      progression: s.semaine / s.semaines,
    };
  }
  const p = saison.prochain;
  return {
    surtitre: "Fil rouge",
    titre: "Ton entraînement de fond",
    sous:
      p && p.statut.type === "a-venir"
        ? `Ton bloc ${p.bloc} démarre le ${formatIsoCourt(p.debut)}.`
        : "Ajoute un objectif quand tu veux : son bloc se branche tout seul.",
    progression: null,
  };
}
