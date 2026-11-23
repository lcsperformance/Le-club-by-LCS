import { describe, expect, it } from "vitest";
import { lireQuestion, sousTitreQuestion, trierQuestions, type Question } from "@/lib/questions";

const q = (id: string, membre_id: string, cree_le: string, traitee_le: string | null = null): Question => ({
  id,
  membre_id,
  auteur: "Thomas",
  auteur_role: "membre",
  texte: `Question ${id}`,
  cree_le,
  traitee_le,
});

describe("boîte à questions", () => {
  it("une question de 1 à 300 caractères", () => {
    expect(lireQuestion("  Comment gérer ma nutrition ?  ")).toEqual({ texte: "Comment gérer ma nutrition ?" });
    expect(lireQuestion("")).toEqual({ erreur: "Écris ta question avant de l'envoyer." });
    expect(lireQuestion("x".repeat(301))).toHaveProperty("erreur");
  });

  it("« Posée par » avec la date française, « toi » pour les siennes, « Traitée en FAQ »", () => {
    expect(sousTitreQuestion(q("1", "t", "2027-01-08T19:12:00Z"), "moi")).toBe("Posée par Thomas le 08/01/2027");
    expect(sousTitreQuestion(q("1", "moi", "2027-01-08T23:30:00Z"), "moi")).toBe("Posée par toi le 09/01/2027");
    expect(sousTitreQuestion(q("1", "t", "2027-01-08T10:00:00Z", "2027-01-14T19:30:00Z"), "moi")).toBe("Posée par Thomas le 08/01/2027 · Traitée en FAQ");
  });

  it("à traiter d'abord (plus anciennes en premier), puis traitées (plus récentes en premier)", () => {
    const tri = trierQuestions([
      q("t1", "a", "2027-01-01T10:00:00Z", "2027-01-10T10:00:00Z"),
      q("b", "a", "2027-01-09T10:00:00Z"),
      q("t2", "a", "2027-01-02T10:00:00Z", "2027-01-12T10:00:00Z"),
      q("a", "a", "2027-01-05T10:00:00Z"),
    ]);
    expect(tri.map((x) => x.id)).toEqual(["a", "b", "t2", "t1"]);
  });
});
