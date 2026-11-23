import { describe, expect, it, vi } from "vitest";
import { carteAujourdhui, nouveauCetteSemaine, texteQuestionsFaq } from "@/lib/accueil";
import { RESSOURCES_FICTIVES, SEMAINE_FICTIVE, THEMES_FICTIFS } from "@/lib/apercu";

vi.mock("server-only", () => ({}));

const LUNDI = "2027-01-11";

describe("carte « Aujourd'hui »", () => {
  it("la séance du jour, à ouvrir avec son jour", () => {
    expect(carteAujourdhui(SEMAINE_FICTIVE, 1, LUNDI, [])).toEqual({
      etat: "seance",
      seance: { id: SEMAINE_FICTIVE[0].seance.id, sport: "natation", titre: "Technique & endurance", dureeMinutes: 45 },
      faite: false,
      autres: 0,
      jour: LUNDI,
    });
  });

  it("cochée quand elle est faite", () => {
    expect(carteAujourdhui(SEMAINE_FICTIVE, 1, LUNDI, [SEMAINE_FICTIVE[0].seance.id])).toMatchObject({ etat: "seance", faite: true });
  });

  it("deux séances le même jour : la première qui reste à faire, et « + 1 autre »", () => {
    const jeudi = SEMAINE_FICTIVE.filter((s) => s.jour === 4);
    expect(carteAujourdhui(SEMAINE_FICTIVE, 4, "2027-01-14", [])).toMatchObject({ seance: { titre: "Sweet spot" }, autres: 1, faite: false });
    expect(carteAujourdhui(SEMAINE_FICTIVE, 4, "2027-01-14", [jeudi[0].seance.id])).toMatchObject({ seance: { titre: "Enchaînement" }, faite: false });
  });

  it("repos, semaine pas encore écrite, niveau à choisir", () => {
    expect(carteAujourdhui(SEMAINE_FICTIVE, 5, "2027-01-15", [])).toEqual({ etat: "repos" });
    expect(carteAujourdhui([], 1, LUNDI, [])).toEqual({ etat: "a-venir" });
    expect(carteAujourdhui(null, 1, LUNDI, [])).toEqual({ etat: "niveau" });
  });
});

describe("carte « FAQ en visio »", () => {
  it("nombre de questions déposées pour la prochaine FAQ", () => {
    expect(texteQuestionsFaq(0)).toBe("Aucune question pour l'instant : pose la première !");
    expect(texteQuestionsFaq(1)).toBe("1 question déposée pour la prochaine FAQ.");
    expect(texteQuestionsFaq(3)).toBe("3 questions déposées pour la prochaine FAQ.");
  });
});

describe("carte « Nouveau cette semaine »", () => {
  it("le contenu débloqué cette semaine, le premier dans l'ordre des thèmes", () => {
    // Semaine 3 : « Que manger pendant une sortie longue » (Nutrition) passe avant « Technique de nage » (Natation).
    expect(nouveauCetteSemaine(THEMES_FICTIFS, RESSOURCES_FICTIVES, 3)).toEqual({
      id: RESSOURCES_FICTIVES[2].id,
      titre: "Que manger pendant une sortie longue",
      type: "video",
    });
  });

  it("rien cette semaine : carte masquée ; l'équipe du Club (tout est déjà ouvert) : masquée", () => {
    expect(nouveauCetteSemaine(THEMES_FICTIFS, RESSOURCES_FICTIVES, 5)).toBeNull();
    expect(nouveauCetteSemaine(THEMES_FICTIFS, RESSOURCES_FICTIVES, null)).toBeNull();
  });
});
