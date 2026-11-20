import { describe, expect, it } from "vitest";
import { joursDeLaSemaine, libelleJour, titreSemaine } from "@/lib/semaine";

describe("Ma semaine : les 7 jours", () => {
  it("va du lundi au dimanche, quel que soit le jour", () => {
    for (const jour of ["2026-11-16", "2026-11-19", "2026-11-22"]) {
      const s = joursDeLaSemaine(jour);
      expect(s.map((j) => j.court)).toEqual(["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]);
      expect(s.map((j) => j.numero)).toEqual([16, 17, 18, 19, 20, 21, 22]);
    }
  });

  it("titre en français, y compris à cheval sur deux mois ou deux années", () => {
    expect(titreSemaine(joursDeLaSemaine("2026-11-18"))).toBe("16 – 22 novembre");
    expect(titreSemaine(joursDeLaSemaine("2026-12-02"))).toBe("30 novembre – 6 décembre");
    expect(titreSemaine(joursDeLaSemaine("2026-12-31"))).toBe("28 décembre – 3 janvier");
  });

  it("jour en toutes lettres", () => {
    expect(libelleJour("2026-11-16")).toBe("Lundi 16 novembre");
  });
});
