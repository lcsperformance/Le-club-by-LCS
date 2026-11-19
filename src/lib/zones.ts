/**
 * Calcul des zones d'entraînement à partir des tests de départ.
 * Les pourcentages viennent de config/zones.json (modifiable par le coach sans toucher au code).
 */
import configBrute from "../../config/zones.json";
import { formatMinSec } from "./tests-depart";

export const SPORTS = [
  { cle: "course", libelle: "Course" },
  { cle: "velo", libelle: "Vélo" },
  { cle: "natation", libelle: "Natation" },
] as const;
export type Sport = (typeof SPORTS)[number]["cle"];

/** 6 bornes en pourcentage : Z1 = [b0, b1], Z2 = [b1, b2]… Z5 = [b4, b5]. */
export type Bornes = [number, number, number, number, number, number];

export type ConfigZones = {
  noms: [string, string, string, string, string];
  course: Bornes;
  velo: Bornes;
  natation: Bornes;
  frequence_cardiaque: Bornes;
};

const LIGNES = ["course", "velo", "natation", "frequence_cardiaque"] as const;

/**
 * Vérifie le fichier de configuration. En cas d'erreur, le message dit quoi corriger :
 * la mise en ligne échoue alors, et le site en place reste intact.
 */
export function validerConfig(c: unknown): ConfigZones {
  const erreur = (m: string) => new Error(`config/zones.json : ${m}`);
  if (!c || typeof c !== "object") throw erreur("le fichier est vide ou illisible.");
  const o = c as Record<string, unknown>;

  const noms = o.noms;
  if (!Array.isArray(noms) || noms.length !== 5 || noms.some((n) => typeof n !== "string" || !n.trim())) {
    throw erreur("« noms » doit contenir exactement 5 noms de zones.");
  }

  for (const ligne of LIGNES) {
    const b = o[ligne];
    if (!Array.isArray(b) || b.length !== 6) {
      throw erreur(`« ${ligne} » doit contenir exactement 6 nombres (les bornes de Z1 à Z5).`);
    }
    if (b.some((x) => typeof x !== "number" || !Number.isFinite(x) || x <= 0 || x > 300)) {
      throw erreur(`« ${ligne} » ne doit contenir que des nombres entre 1 et 300.`);
    }
    for (let i = 1; i < 6; i++) {
      if (b[i] <= b[i - 1]) {
        throw erreur(`« ${ligne} » : les nombres doivent monter (${b[i - 1]} puis ${b[i]} n'est pas possible).`);
      }
    }
  }
  return o as unknown as ConfigZones;
}

/** Configuration validée au chargement : une erreur bloque la compilation. */
export const CONFIG_ZONES = validerConfig(configBrute);

export type Tests = {
  allure_seuil_course: number | null;
  ftp: number | null;
  vitesse_critique_natation: number | null;
  fc_seuil: number | null;
};

export type LigneZone = {
  zone: 1 | 2 | 3 | 4 | 5;
  nom: string;
  /** « 78 – 88 % » */
  pourcentages: string;
  /** Allure ou puissance cible, ou null si le test manque. */
  cible: string | null;
  /** Fréquence cardiaque (course et vélo), ou null. */
  frequenceCardiaque: string | null;
};

/** Allure (s par km ou par 100 m) à un pourcentage de la vitesse seuil : allure × 100 / %. */
export const allureA = (allureSeuil: number, pourcentage: number) => (allureSeuil * 100) / pourcentage;
/** Watts à un pourcentage de la FTP : FTP × % / 100. */
export const wattsA = (ftp: number, pourcentage: number) => (ftp * pourcentage) / 100;
/** Fréquence cardiaque à un pourcentage de la FC seuil : FC × % / 100. */
export const frequenceA = (fcSeuil: number, pourcentage: number) => (fcSeuil * pourcentage) / 100;

function cible(sport: Sport, tests: Tests, bas: number, haut: number): string | null {
  switch (sport) {
    case "course": {
      const s = tests.allure_seuil_course;
      // Plus le pourcentage est haut, plus l'allure est rapide : on affiche « rapide–lente ».
      return s ? `${formatMinSec(allureA(s, haut))}–${formatMinSec(allureA(s, bas))} /km` : null;
    }
    case "natation": {
      const s = tests.vitesse_critique_natation;
      return s ? `${formatMinSec(allureA(s, haut))}–${formatMinSec(allureA(s, bas))} /100 m` : null;
    }
    case "velo": {
      const f = tests.ftp;
      return f ? `${Math.round(wattsA(f, bas))}–${Math.round(wattsA(f, haut))} W` : null;
    }
  }
}

/** Les 5 zones d'un sport, calculées à partir des tests. */
export function calculerZones(sport: Sport, tests: Tests, config: ConfigZones = CONFIG_ZONES): LigneZone[] {
  const bornes = config[sport];
  const bornesFc = config.frequence_cardiaque;
  const fc = tests.fc_seuil;

  return ([1, 2, 3, 4, 5] as const).map((zone) => {
    const bas = bornes[zone - 1];
    const haut = bornes[zone];
    const avecFc = sport !== "natation" && fc;
    return {
      zone,
      nom: config.noms[zone - 1],
      pourcentages: `${bas} – ${haut} %`,
      cible: cible(sport, tests, bas, haut),
      frequenceCardiaque: avecFc
        ? `FC ${Math.round(frequenceA(fc, bornesFc[zone - 1]))}–${Math.round(frequenceA(fc, bornesFc[zone]))} bpm`
        : null,
    };
  });
}

/** Sport demandé dans l'adresse (?sport=velo), course par défaut. */
export function sportDepuisAdresse(valeur: unknown): Sport {
  return SPORTS.some((s) => s.cle === valeur) ? (valeur as Sport) : "course";
}
