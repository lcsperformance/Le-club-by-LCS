import { describe, expect, it } from "vitest";
import { EPREUVES, formatTemps, lireRecords, lireTemps } from "@/lib/records";

describe("Mes records : épreuves", () => {
  it("10 km, semi, marathon, puis triathlon S, M, L, XL", () => {
    expect(EPREUVES.map((e) => e.libelle)).toEqual([
      "10 km",
      "Semi-marathon",
      "Marathon",
      "Triathlon S",
      "Triathlon M",
      "Triathlon L",
      "Triathlon XL",
    ]);
  });
});

describe("saisie d'un temps", () => {
  it("minutes:secondes ou heures:minutes:secondes", () => {
    expect(lireTemps("41:32", "10km")).toEqual({ secondes: 41 * 60 + 32 });
    expect(lireTemps("1:32:10", "semi")).toEqual({ secondes: 3600 + 32 * 60 + 10 });
    expect(lireTemps(" 11:04:59 ", "tri_xl")).toEqual({ secondes: 11 * 3600 + 4 * 60 + 59 });
  });

  it("accepte aussi 1h32'10, 41'32\" ou des espaces", () => {
    expect(lireTemps("1h32'10", "semi")).toEqual({ secondes: 5530 });
    expect(lireTemps("41'32\"", "10km")).toEqual({ secondes: 2492 });
    expect(lireTemps("3 20 00", "marathon")).toEqual({ secondes: 12000 });
  });

  it("vide = pas de record", () => {
    expect(lireTemps("", "marathon")).toEqual({ secondes: null });
    expect(lireTemps("   ", "tri_m")).toEqual({ secondes: null });
    expect(lireTemps(undefined, "tri_m")).toEqual({ secondes: null });
  });

  it("refuse ce qui n'est pas une durée", () => {
    for (const s of ["41", "abc", "1:2:3:4", "1,5", "-41:32", "1:32:100"]) {
      expect(lireTemps(s, "10km"), s).toEqual({ erreur: "Écris le temps sous la forme 41:32." });
    }
    expect(lireTemps("41:75", "10km")).toEqual({ erreur: "Minutes et secondes vont de 00 à 59. Écris le temps sous la forme 41:32." });
    expect(lireTemps("1:60:00", "semi")).toHaveProperty("erreur");
  });

  it("refuse un temps improbable pour l'épreuve", () => {
    expect(lireTemps("12:00", "10km")).toEqual({ erreur: "Ce temps semble improbable pour un 10 km (entre 25:00 et 3:00:00)." });
    expect(lireTemps("41:32", "marathon")).toHaveProperty("erreur");
    expect(lireTemps("18:00:00", "tri_xl")).toHaveProperty("erreur");
  });
});

describe("affichage", () => {
  it("41:32 sous l'heure, 1:32:10 au-delà", () => {
    expect(formatTemps(2492)).toBe("41:32");
    expect(formatTemps(5530)).toBe("1:32:10");
    expect(formatTemps(39600)).toBe("11:00:00");
  });
});

describe("formulaire entier", () => {
  it("tous facultatifs : rien saisi = rien à garder", () => {
    const lu = lireRecords({});
    expect("records" in lu && Object.values(lu.records).every((v) => v === null)).toBe(true);
  });

  it("garde les temps valables, efface les vides", () => {
    const lu = lireRecords({ "10km": "41:32", semi: "", tri_m: "2:30:00" });
    expect(lu).toEqual({
      records: { "10km": 2492, semi: null, marathon: null, tri_s: null, tri_m: 9000, tri_l: null, tri_xl: null },
    });
  });

  it("une seule erreur bloque l'enregistrement et est rattachée à son épreuve", () => {
    expect(lireRecords({ "10km": "41:32", marathon: "vite" })).toEqual({
      erreurs: { marathon: "Écris le temps sous la forme 3:20:00." },
    });
  });
});
