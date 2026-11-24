import { describe, expect, it } from "vitest";
import configFichier from "../config/zones.json";
import { allureA, calculerZones, CONFIG_ZONES, frequenceA, sportDepuisAdresse, validerConfig, wattsA } from "@/lib/zones";

const tests = { allure_seuil_course: 270, ftp: 220, vitesse_critique_natation: 105, fc_seuil: 168 };

describe("fichier de configuration", () => {
  it("contient les pourcentages de la maquette", () => {
    expect(CONFIG_ZONES.course).toEqual([65, 78, 88, 95, 102, 110]);
    expect(CONFIG_ZONES.velo).toEqual([45, 56, 76, 91, 106, 120]);
    expect(CONFIG_ZONES.natation).toEqual([80, 87, 93, 97, 102, 108]);
    expect(CONFIG_ZONES.frequence_cardiaque).toEqual([65, 81, 89, 94, 100, 106]);
    expect(CONFIG_ZONES.noms).toEqual(["Récupération", "Endurance", "Tempo", "Seuil", "Haute intensité"]);
  });

  const casse = (modif: Record<string, unknown>) => () => validerConfig({ ...configFichier, ...modif });

  it("refuse des bornes qui ne montent pas, avec un message clair", () => {
    expect(casse({ velo: [45, 56, 50, 91, 106, 120] })).toThrow(/« velo » : les nombres doivent monter \(56 puis 50/);
  });
  it("refuse un nombre de bornes différent de 6", () => {
    expect(casse({ course: [65, 78, 88, 95, 102] })).toThrow(/exactement 6 nombres/);
  });
  it("refuse du texte à la place d'un nombre", () => {
    expect(casse({ natation: [80, "87", 93, 97, 102, 108] })).toThrow(/que des nombres/);
  });
  it("refuse un nom de zone manquant", () => {
    expect(casse({ noms: ["A", "B", "C", "D"] })).toThrow(/5 noms/);
  });
});

describe("formules", () => {
  it("allure = allure seuil × 100 / %", () => {
    expect(allureA(270, 100)).toBe(270);
    expect(allureA(270, 90)).toBe(300);
  });
  it("watts = FTP × % / 100", () => {
    expect(wattsA(220, 50)).toBe(110);
  });
  it("FC = FC seuil × % / 100", () => {
    expect(frequenceA(168, 100)).toBe(168);
    expect(frequenceA(200, 81)).toBe(162);
  });
});

describe("zones calculées avec les valeurs par défaut de la maquette", () => {
  it("course : allures de la plus rapide à la plus lente, avec FC", () => {
    const z = calculerZones("course", tests);
    // Z2 : 270×100/88 = 306,8 s → 5:07 ; 270×100/78 = 346,2 s → 5:46
    expect(z[1]).toEqual({
      zone: 2,
      nom: "Endurance",
      pourcentages: "78 – 88 %",
      cible: "5:07–5:46 /km",
      // 168×81/100 = 136,1 → 136 ; 168×89/100 = 149,5 → 150
      frequenceCardiaque: "FC 136–150 bpm",
    });
    // Z1 : 270×100/78 = 346,2 → 5:46 ; 270×100/65 = 415,4 → 6:55
    expect(z[0].cible).toBe("5:46–6:55 /km");
    expect(z[4].cible).toBe("4:05–4:25 /km");
  });

  it("vélo : watts croissants, avec FC", () => {
    const z = calculerZones("velo", tests);
    expect(z.map((l) => l.cible)).toEqual(["99–123 W", "123–167 W", "167–200 W", "200–233 W", "233–264 W"]);
    expect(z[4].frequenceCardiaque).toBe("FC 168–178 bpm");
  });

  it("natation : allures /100 m, sans FC", () => {
    const z = calculerZones("natation", tests);
    // Z4 : 105×100/102 = 102,9 → 1:43 ; 105×100/97 = 108,2 → 1:48
    expect(z[3].cible).toBe("1:43–1:48 /100 m");
    expect(z.every((l) => l.frequenceCardiaque === null)).toBe(true);
  });

  it("cardio : zones en bpm d'après la FC seuil, sans ligne FC en plus", () => {
    const z = calculerZones("cardio", tests);
    // 168 × [65, 81, 89, 94, 100, 106] % → 109, 136, 150, 158, 168, 178
    expect(z.map((l) => l.cible)).toEqual(["109–136 bpm", "136–150 bpm", "150–158 bpm", "158–168 bpm", "168–178 bpm"]);
    expect(z[1].pourcentages).toBe("81 – 89 %");
    expect(z.every((l) => l.frequenceCardiaque === null)).toBe(true);
  });

  it("cardio sans FC seuil : pas de cible", () => {
    expect(calculerZones("cardio", { ...tests, fc_seuil: null }).every((l) => l.cible === null)).toBe(true);
  });

  it("sans test pour un sport, pas de cible (mais les autres restent)", () => {
    const z = calculerZones("velo", { ...tests, ftp: null });
    expect(z[0].cible).toBeNull();
    expect(z[0].frequenceCardiaque).toBe("FC 109–136 bpm");
  });
});

describe("onglet dans l'adresse", () => {
  it("accepte course, velo, natation, cardio et revient à course sinon", () => {
    expect(sportDepuisAdresse("velo")).toBe("velo");
    expect(sportDepuisAdresse("cardio")).toBe("cardio");
    expect(sportDepuisAdresse("natation")).toBe("natation");
    expect(sportDepuisAdresse("ski")).toBe("course");
    expect(sportDepuisAdresse(undefined)).toBe("course");
  });
});

describe("exemples de référence", () => {
  it("seuil course 4:30 /km → zone 3 environ 4:44 à 5:07 /km", () => {
    const z3 = calculerZones("course", { ...tests, allure_seuil_course: 4 * 60 + 30 })[2];
    expect(z3.zone).toBe(3);
    expect(z3.cible).toBe("4:44–5:07 /km");
  });

  it("FTP 220 W → zone 3 environ 167 à 200 W", () => {
    const z3 = calculerZones("velo", { ...tests, ftp: 220 })[2];
    expect(z3.zone).toBe(3);
    expect(z3.cible).toBe("167–200 W");
  });
});
