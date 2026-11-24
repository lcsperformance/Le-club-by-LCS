import { describe, expect, it } from "vitest";
import { erreurJour, jourDeLaSeance, lireRessentiSaisi } from "@/lib/ressenti";

const AUJOURDHUI = "2027-01-14";

describe("jour de la séance", () => {
  it("vient de l'adresse, sinon aujourd'hui", () => {
    expect(jourDeLaSeance("2027-01-12", AUJOURDHUI)).toBe("2027-01-12");
    expect(jourDeLaSeance("2027-02-30", AUJOURDHUI)).toBe(AUJOURDHUI);
    expect(jourDeLaSeance(undefined, AUJOURDHUI)).toBe(AUJOURDHUI);
  });

  it("une séance du jour ou des 14 jours passés, jamais à venir", () => {
    expect(erreurJour(AUJOURDHUI, AUJOURDHUI)).toBeNull();
    expect(erreurJour("2026-12-31", AUJOURDHUI)).toBeNull();
    expect(erreurJour("2027-01-15", AUJOURDHUI)).toBe("Tu pourras marquer cette séance le jour J.");
    expect(erreurJour("2026-12-30", AUJOURDHUI)).toBe("On ne peut plus noter une séance de plus de 14 jours.");
    expect(erreurJour("hier", AUJOURDHUI)).toBe("Cette séance est introuvable.");
  });
});

describe("ressenti saisi", () => {
  it("RPE obligatoire de 1 à 10", () => {
    expect(lireRessentiSaisi({ rpe: null })).toEqual({ erreur: "Choisis ton RPE, de 1 à 10." });
    for (const rpe of [0, 11, 5.5, "7"]) expect(lireRessentiSaisi({ rpe }), String(rpe)).toHaveProperty("erreur");
    expect(lireRessentiSaisi({ rpe: 10 })).toEqual({ ressenti: { rpe: 10, commentaire: null } });
  });

  it("commentaire facultatif nettoyé ; plus de case « douleur »", () => {
    expect(lireRessentiSaisi({ rpe: 7, douleur: true })).toEqual({ ressenti: { rpe: 7, commentaire: null } });
    expect(lireRessentiSaisi({ rpe: 7, commentaire: "  Bonnes jambes  " })).toEqual({
      ressenti: { rpe: 7, commentaire: "Bonnes jambes" },
    });
    expect(lireRessentiSaisi({ rpe: 7, commentaire: "   " })).toEqual({ ressenti: { rpe: 7, commentaire: null } });
  });

  it("commentaire de 500 caractères au plus", () => {
    expect(lireRessentiSaisi({ rpe: 3, commentaire: "x".repeat(500) })).toHaveProperty("ressenti");
    expect(lireRessentiSaisi({ rpe: 3, commentaire: "x".repeat(501) })).toEqual({
      erreur: "Ton commentaire dépasse 500 caractères.",
    });
  });
});
