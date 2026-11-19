/** Fuseau de référence de toute l'application. */
export const FUSEAU = "Europe/Paris";

/** Date au format français, ex. « 1 janvier 2027 ». */
export function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSEAU,
  }).format(date);
}

/** Heure au format français, ex. « 14 h 30 ». */
export function formatHeureFr(date: Date): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSEAU,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value ?? "";
  const m = parts.find((p) => p.type === "minute")?.value ?? "";
  return `${h} h ${m}`;
}

/** Jour au format français, ex. « Lundi 16 novembre ». */
export function formatJourFr(date: Date): string {
  const texte = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: FUSEAU,
  }).format(date);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Date du jour à Paris au format AAAA-MM-JJ (pour les colonnes « date »). */
export function dateDuJourParis(maintenant: Date = new Date()): string {
  // Le format suédois donne directement AAAA-MM-JJ.
  return new Intl.DateTimeFormat("sv-SE", { timeZone: FUSEAU }).format(maintenant);
}

/** Date courte au format français, ex. « 18/11/2026 ». */
export function formatDateCourteFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: FUSEAU }).format(
    date,
  );
}
