/**
 * Calcul des zones d'entraînement à partir des tests de départ.
 * Les pourcentages viennent de config/zones.json (modifiable par le coach sans toucher au code).
 */
import configBrute from "../../config/zones.json";
import { validerConfig, type Bornes, type ConfigZones } from "./config-zones";
import { formatMinSec } from "./tests-depart";

export { validerConfig, type Bornes, type ConfigZones } from "./config-zones";

export const SPORTS = [
  { cle: "course", libelle: "Course" },
  { cle: "velo", libelle: "Vélo" },
  { cle: "natation", libelle: "Natation" },
  { cle: "cardio", libelle: "Cardio" },
] as const;
export type Sport = (typeof SPORTS)[number]["cle"];

/** Bornes du Club pour un sport (« cardio » = ligne frequence_cardiaque de config/zones.json). */
export const bornesDuClub = (sport: Sport, config: ConfigZones = CONFIG_ZONES): Bornes =>
  sport === "cardio" ? config.frequence_cardiaque : config[sport];

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
  /** Fréquence cardiaque sous l'allure ou la puissance (course et vélo), ou null. */
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
    case "cardio": {
      const fc = tests.fc_seuil;
      return fc ? `${Math.round(frequenceA(fc, bas))}–${Math.round(frequenceA(fc, haut))} bpm` : null;
    }
  }
}

/** Les 5 zones d'un sport, calculées à partir des tests. */
export function calculerZones(
  sport: Sport,
  tests: Tests,
  config: ConfigZones = CONFIG_ZONES,
  /** Bornes personnalisées par le membre ; sinon celles du Club. */
  bornesPerso?: Bornes | null,
  /** Zones cardio personnalisées par le membre (ligne FC sous la course et le vélo) ; sinon celles du Club. */
  bornesFcPerso?: Bornes | null,
): LigneZone[] {
  const bornes = bornesPerso ?? bornesDuClub(sport, config);
  const bornesFc = bornesFcPerso ?? config.frequence_cardiaque;
  const fc = tests.fc_seuil;

  return ([1, 2, 3, 4, 5] as const).map((zone) => {
    const bas = bornes[zone - 1];
    const haut = bornes[zone];
    const avecFc = (sport === "course" || sport === "velo") && fc;
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
