import { describe, expect, it } from "vitest";
import {
  bornesSemaines,
  dernierJourPaye,
  joursDeLaSemaine,
  libelleJour,
  lundiDe,
  semaineDemandee,
  semainesVoisines,
  titreSemaine,
} from "@/lib/semaine";

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

describe("Ma semaine : naviguer entre les semaines", () => {
  const AUJOURDHUI = "2026-11-25"; // mercredi ; semaine du lundi 23/11

  it("lundi d'un jour quelconque", () => {
    expect(lundiDe("2026-11-25")).toBe("2026-11-23");
    expect(lundiDe("2026-11-29")).toBe("2026-11-23");
    expect(lundiDe("2027-01-01")).toBe("2026-12-28");
  });

  it("de la semaine d'inscription à la semaine du dernier jour payé", () => {
    expect(bornesSemaines(AUJOURDHUI, "2026-11-04", "2026-12-18")).toEqual({ premier: "2026-11-02", dernier: "2026-12-14" });
  });

  it("jamais avant la semaine en cours pour la fin, jamais après pour l'inscription", () => {
    expect(bornesSemaines(AUJOURDHUI, "2026-11-25", "2026-11-25")).toEqual({ premier: "2026-11-23", dernier: "2026-11-23" });
    expect(bornesSemaines(AUJOURDHUI, null, "2026-11-20")).toEqual({ premier: "2026-11-23", dernier: "2026-11-23" });
  });

  it("équipe du Club, sans abonnement : 4 semaines à l'avance", () => {
    expect(bornesSemaines(AUJOURDHUI, "2026-11-01", null).dernier).toBe("2026-12-21");
  });

  it("dernier jour payé : abonnement ou accès offert, le plus tardif, à l'heure de Paris", () => {
    const membre = (fin: string | null, offertJusqua: string | null = null) => ({ role: "membre", abonnement: { fin, offertJusqua } });
    // 23 h 30 UTC le 18/12 = 0 h 30 le 19/12 à Paris.
    expect(dernierJourPaye(membre("2026-12-18T23:30:00Z"), AUJOURDHUI)).toBe("2026-12-19");
    expect(dernierJourPaye(membre("2026-12-18T10:00:00Z", "2027-03-31T21:59:59Z"), AUJOURDHUI)).toBe("2027-03-31");
    expect(dernierJourPaye(membre(null), AUJOURDHUI)).toBe(AUJOURDHUI);
    expect(dernierJourPaye({ role: "admin", abonnement: { fin: null, offertJusqua: null } }, AUJOURDHUI)).toBeNull();
  });

  it("semaine demandée dans l'adresse, ramenée à son lundi, sinon la semaine en cours", () => {
    const bornes = { premier: "2026-11-02", dernier: "2026-12-14" };
    expect(semaineDemandee("2026-11-12", AUJOURDHUI, bornes)).toBe("2026-11-09");
    expect(semaineDemandee("2026-12-20", AUJOURDHUI, bornes)).toBe("2026-12-14");
    expect(semaineDemandee("2026-12-21", AUJOURDHUI, bornes)).toBe("2026-11-23"); // après la période payée
    expect(semaineDemandee("2026-10-26", AUJOURDHUI, bornes)).toBe("2026-11-23"); // avant l'inscription
    expect(semaineDemandee("n'importe quoi", AUJOURDHUI, bornes)).toBe("2026-11-23");
    expect(semaineDemandee(undefined, AUJOURDHUI, bornes)).toBe("2026-11-23");
  });

  it("semaines voisines, ou rien en bout de course", () => {
    const bornes = { premier: "2026-11-02", dernier: "2026-12-14" };
    expect(semainesVoisines("2026-11-23", bornes)).toEqual({ precedente: "2026-11-16", suivante: "2026-11-30" });
    expect(semainesVoisines("2026-11-02", bornes)).toEqual({ precedente: null, suivante: "2026-11-09" });
    expect(semainesVoisines("2026-12-14", bornes)).toEqual({ precedente: "2026-12-07", suivante: null });
  });
});
