/**
 * Mes records (maquette) : 10 km, semi, marathon, triathlon S, M, L, XL. Tous facultatifs.
 * Saisie « 41:32 » (minutes:secondes) ou « 1:32:10 » (heures:minutes:secondes),
 * enregistrée en secondes dans la table `records` (une ligne par membre et par épreuve).
 * Pas de ligne = pas de record ; vider le champ efface le record.
 */

export const EPREUVES = [
  { cle: "10km", libelle: "10 km", groupe: "course", exemple: "41:32", min: 25 * 60, max: 3 * 3600 },
  { cle: "semi", libelle: "Semi-marathon", groupe: "course", exemple: "1:32:10", min: 55 * 60, max: 5 * 3600 },
  { cle: "marathon", libelle: "Marathon", groupe: "course", exemple: "3:20:00", min: 2 * 3600, max: 8 * 3600 },
  { cle: "tri_s", libelle: "Triathlon S", groupe: "triathlon", exemple: "1:10:00", min: 40 * 60, max: 4 * 3600 },
  { cle: "tri_m", libelle: "Triathlon M", groupe: "triathlon", exemple: "2:30:00", min: 90 * 60, max: 6 * 3600 },
  { cle: "tri_l", libelle: "Triathlon L", groupe: "triathlon", exemple: "5:15:00", min: 3 * 3600, max: 12 * 3600 },
  { cle: "tri_xl", libelle: "Triathlon XL", groupe: "triathlon", exemple: "11:00:00", min: 7 * 3600, max: 17 * 3600 },
] as const;

export type Epreuve = (typeof EPREUVES)[number]["cle"];
export type Records = Partial<Record<Epreuve, number>>;

export const estEpreuve = (v: unknown): v is Epreuve => EPREUVES.some((e) => e.cle === v);

/** « 41:32 » sous l'heure, « 1:32:10 » au-delà. */
export function formatTemps(secondes: number): string {
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  const s = secondes % 60;
  const deux = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${deux(m)}:${deux(s)}` : `${m}:${deux(s)}`;
}

/**
 * Lit une durée saisie : « 41:32 », « 1:32:10 » (les séparateurs h, ', " et les espaces sont aussi acceptés).
 * null = champ vide (pas de record) ; { erreur } si la saisie n'est pas une durée valable pour l'épreuve.
 */
export function lireTemps(saisie: unknown, epreuve: Epreuve): { secondes: number | null } | { erreur: string } {
  const def = EPREUVES.find((e) => e.cle === epreuve)!;
  const texte = typeof saisie === "string" ? saisie.trim().replace(/\s*s$/i, "") : "";
  if (!texte) return { secondes: null };
  const morceaux = texte.split(/\s*(?::|h|'|’|"|\s)\s*/i).filter(Boolean);
  const format = `Écris le temps sous la forme ${def.exemple}.`;
  if (morceaux.length < 2 || morceaux.length > 3 || morceaux.some((m) => !/^\d{1,2}$/.test(m))) return { erreur: format };
  const [h, m, s] = (morceaux.length === 3 ? morceaux : ["0", ...morceaux]).map(Number);
  if (m > 59 || s > 59) return { erreur: `Minutes et secondes vont de 00 à 59. ${format}` };
  const secondes = h * 3600 + m * 60 + s;
  if (secondes < def.min || secondes > def.max) {
    return { erreur: `Ce temps semble improbable pour un ${def.libelle.toLowerCase()} (entre ${formatTemps(def.min)} et ${formatTemps(def.max)}).` };
  }
  return { secondes };
}

/** Lit le formulaire entier : les records à enregistrer (null = à effacer), ou les erreurs par épreuve. */
export function lireRecords(saisies: unknown): { records: Record<Epreuve, number | null> } | { erreurs: Partial<Record<Epreuve, string>> } {
  const valeurs = saisies && typeof saisies === "object" ? (saisies as Record<string, unknown>) : {};
  const records = {} as Record<Epreuve, number | null>;
  const erreurs: Partial<Record<Epreuve, string>> = {};
  for (const e of EPREUVES) {
    const lu = lireTemps(valeurs[e.cle], e.cle);
    if ("erreur" in lu) erreurs[e.cle] = lu.erreur;
    else records[e.cle] = lu.secondes;
  }
  return Object.keys(erreurs).length ? { erreurs } : { records };
}
