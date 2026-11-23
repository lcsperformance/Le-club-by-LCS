/**
 * Agenda du Club : événements (FAQ en visio, webinaires…), règles testables, sans base.
 * Les heures sont enregistrées en UTC et toujours saisies et affichées à l'heure de Paris,
 * y compris aux changements d'heure (dernier dimanche de mars et d'octobre).
 */
import { dateDuJourParis, FUSEAU, formatHeureFr } from "./dates";

export const TYPES_EVENEMENT = ["faq", "webinaire", "stage", "autre"] as const;
export type TypeEvenement = (typeof TYPES_EVENEMENT)[number];

export const NOMS_TYPES: Record<TypeEvenement, string> = {
  faq: "FAQ en visio",
  webinaire: "Webinaire",
  stage: "Stage",
  autre: "Événement",
};

export type Evenement = {
  id: string;
  titre: string;
  type: TypeEvenement;
  /** Instants ISO (UTC). */
  debut: string;
  fin: string | null;
  lieu: string | null;
  lien: string | null;
  description: string | null;
  dates_a_confirmer: boolean;
  periode: string | null;
};

// ---------------------------------------------------------------------------
// Heure de Paris
// ---------------------------------------------------------------------------

/** Date (AAAA-MM-JJ) et heure (HH:MM) d'un instant, à Paris. */
export function enHeureDeParis(iso: string): { date: string; heure: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, heure: `${p.hour}:${p.minute}` };
}

/** Instant ISO (UTC) d'une date et d'une heure saisies à Paris. null si la saisie est invalide. */
export function depuisHeureDeParis(date: string, heure: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(heure)) return null;
  const naif = Date.parse(`${date}T${heure}:00Z`);
  if (Number.isNaN(naif)) return null;
  // Paris est à UTC+1 ou UTC+2 : on essaie les deux et on garde celui qui redonne la même heure à Paris.
  for (const decalage of [1, 2]) {
    const iso = new Date(naif - decalage * 3600_000).toISOString();
    const lu = enHeureDeParis(iso);
    if (lu.date === date && lu.heure === heure) return iso;
  }
  // Heure inexistante (passage à l'heure d'été, ex. 2 h 30) : on prend l'heure d'hiver.
  return new Date(naif - 3600_000).toISOString();
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const jourEnLettres = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  const n = +date.slice(8, 10);
  return `${JOURS[d.getUTCDay()]} ${n === 1 ? "1er" : n} ${MOIS[+date.slice(5, 7) - 1]}`;
};
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Quand a lieu l'événement, à la française :
 * « Jeudi 14 janvier · 19 h 30 – 20 h 30 », « Du samedi 3 au mardi 6 avril », « Printemps · dates à venir ».
 */
export function quandEvenement(e: Pick<Evenement, "debut" | "fin" | "dates_a_confirmer" | "periode">): string {
  if (e.dates_a_confirmer) return `${e.periode ?? "Bientôt"} · dates à venir`;
  const d = enHeureDeParis(e.debut);
  const heureD = formatHeureFr(new Date(e.debut));
  if (!e.fin) return `${majuscule(jourEnLettres(d.date))} · ${heureD}`;
  const f = enHeureDeParis(e.fin);
  if (f.date === d.date) return `${majuscule(jourEnLettres(d.date))} · ${heureD} – ${formatHeureFr(new Date(e.fin))}`;
  return `Du ${jourEnLettres(d.date)} au ${jourEnLettres(f.date)}`;
}

/** Pastille de la carte : « 14 » et « janv. ». */
export function pastilleDate(iso: string): { jour: string; mois: string } {
  const d = enHeureDeParis(iso).date;
  return { jour: String(+d.slice(8, 10)), mois: new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`)) };
}

/** Mois (AAAA-MM) d'un événement, à Paris. */
export const moisEvenement = (e: Pick<Evenement, "debut">) => enHeureDeParis(e.debut).date.slice(0, 7);

/** Jours (AAAA-MM-JJ, Paris) couverts par un événement daté, du début à la fin. */
export function joursEvenement(e: Pick<Evenement, "debut" | "fin" | "dates_a_confirmer">): string[] {
  if (e.dates_a_confirmer) return [];
  const debut = enHeureDeParis(e.debut).date;
  const fin = e.fin ? enHeureDeParis(e.fin).date : debut;
  const jours: string[] = [];
  for (let t = Date.parse(`${debut}T12:00:00Z`); t <= Date.parse(`${fin}T12:00:00Z`) && jours.length < 62; t += 86_400_000) {
    jours.push(new Date(t).toISOString().slice(0, 10));
  }
  return jours;
}

const parDebut = (a: Evenement, b: Evenement) => (a.debut < b.debut ? -1 : a.debut > b.debut ? 1 : 0);

/** Événements d'un mois (AAAA-MM), dans l'ordre, y compris ceux qui le traversent. */
export function evenementsDuMois(evenements: Evenement[], mois: string): Evenement[] {
  return evenements.filter((e) => moisEvenement(e) === mois || joursEvenement(e).some((j) => j.startsWith(mois))).sort(parDebut);
}

/** Prochaine FAQ en visio datée, pas encore terminée. */
export function prochaineFaq(evenements: Evenement[], maintenant: Date): Evenement | null {
  const t = maintenant.toISOString();
  return evenements.filter((e) => e.type === "faq" && !e.dates_a_confirmer && (e.fin ?? e.debut) >= t).sort(parDebut)[0] ?? null;
}

/** Mois du jour à Paris (AAAA-MM). */
export const moisDuJour = (maintenant = new Date()) => dateDuJourParis(maintenant).slice(0, 7);

// ---------------------------------------------------------------------------
// « Ajouter à mon agenda » : fichier .ics (iPhone, Android, Google, Outlook).
// ---------------------------------------------------------------------------

const enIcs = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const echapper = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Contenu du fichier .ics d'un événement daté (heures en UTC : chaque téléphone les affiche à son heure). */
export function fichierIcs(e: Evenement, maintenant: Date): string {
  const fin = e.fin ?? new Date(Date.parse(e.debut) + 3600_000).toISOString();
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Le Club by LCS//Agenda//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@leclub-lcs`,
    `DTSTAMP:${enIcs(maintenant.toISOString())}`,
    `DTSTART:${enIcs(e.debut)}`,
    `DTEND:${enIcs(fin)}`,
    `SUMMARY:${echapper(`${e.titre} · Le Club by LCS`)}`,
    ...(e.lieu ? [`LOCATION:${echapper(e.lieu)}`] : []),
    ...(e.description || e.lien ? [`DESCRIPTION:${echapper([e.description, e.lien].filter(Boolean).join("\n"))}`] : []),
    ...(e.lien ? [`URL:${e.lien}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lignes.join("\r\n") + "\r\n";
}

/** Nom du fichier : « faq-en-visio-2027-01-14.ics ». */
export function nomFichierIcs(e: Pick<Evenement, "titre" | "debut">): string {
  const base = e.titre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "evenement"}-${enHeureDeParis(e.debut).date}.ics`;
}

// ---------------------------------------------------------------------------
// Formulaire de l'admin
// ---------------------------------------------------------------------------

export type ChampEvenement = "titre" | "type" | "debut" | "fin" | "lieu" | "lien" | "description" | "periode";
export type EvenementSaisi = Omit<Evenement, "id">;

const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * Vérifie le formulaire d'un événement. Dates et heures saisies à Paris :
 * date_debut + heure_debut (obligatoires), date_fin + heure_fin (facultatives).
 */
export function lireEvenement(s: Record<string, unknown>): { evenement: EvenementSaisi } | { erreurs: Partial<Record<ChampEvenement, string>> } {
  const erreurs: Partial<Record<ChampEvenement, string>> = {};
  const titre = texte(s.titre);
  if (!titre || titre.length > 80) erreurs.titre = "Le titre doit faire entre 1 et 80 caractères.";
  const type = (TYPES_EVENEMENT as readonly unknown[]).includes(s.type) ? (s.type as TypeEvenement) : null;
  if (!type) erreurs.type = "Choisis le type d'événement.";
  const aConfirmer = s.dates_a_confirmer === true;
  const periode = texte(s.periode) || null;
  if (aConfirmer && (!periode || periode.length > 40)) erreurs.periode = "Indique la période (ex. « Printemps 2027 »), 40 caractères au plus.";

  const debut = depuisHeureDeParis(texte(s.date_debut), texte(s.heure_debut) || (aConfirmer ? "10:00" : ""));
  if (!debut) erreurs.debut = aConfirmer ? "Indique un jour approximatif pour ranger l'événement dans l'agenda." : "Indique la date et l'heure de début.";
  let fin: string | null = null;
  if (!aConfirmer && (texte(s.date_fin) || texte(s.heure_fin))) {
    fin = depuisHeureDeParis(texte(s.date_fin) || texte(s.date_debut), texte(s.heure_fin));
    if (!fin) erreurs.fin = "Indique l'heure de fin (et la date de fin si l'événement dure plusieurs jours).";
    else if (debut && fin <= debut) erreurs.fin = "La fin doit être après le début.";
  }
  const lieu = texte(s.lieu) || null;
  if (lieu && lieu.length > 120) erreurs.lieu = "Le lieu fait 120 caractères au plus.";
  const lien = texte(s.lien) || null;
  if (lien && (!/^https:\/\/\S+$/.test(lien) || lien.length > 300)) erreurs.lien = "Le lien doit commencer par https:// (lien de la visio, page d'inscription…).";
  const description = texte(s.description) || null;
  if (description && description.length > 500) erreurs.description = "La description fait 500 caractères au plus.";

  if (Object.keys(erreurs).length) return { erreurs };
  return {
    evenement: { titre, type: type!, debut: debut!, fin, lieu, lien, description, dates_a_confirmer: aConfirmer, periode: aConfirmer ? periode : null },
  };
}

/** Valeurs du formulaire pour un événement existant (dates et heures de Paris). */
export function valeursFormulaire(e?: Evenement) {
  const d = e ? enHeureDeParis(e.debut) : null;
  const f = e?.fin ? enHeureDeParis(e.fin) : null;
  return {
    titre: e?.titre ?? "",
    type: e?.type ?? "faq",
    date_debut: d?.date ?? "",
    heure_debut: d?.heure ?? "19:30",
    date_fin: f && f.date !== d?.date ? f.date : "",
    heure_fin: f?.heure ?? "",
    lieu: e?.lieu ?? "",
    lien: e?.lien ?? "",
    description: e?.description ?? "",
    dates_a_confirmer: e?.dates_a_confirmer ?? false,
    periode: e?.periode ?? "",
  };
}
