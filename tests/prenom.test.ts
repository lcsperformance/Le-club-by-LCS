import { describe, expect, it } from "vitest";
import { lirePrenomSaisi, prenomDepuisNom } from "@/lib/prenom";

describe("prénom tiré du nom Stripe", () => {
  it.each([
    ["caroline DUPONT", "Caroline"],
    ["  JEAN-PIERRE  martin ", "Jean-Pierre"],
    ["éLODIE Durand", "Élodie"],
    ["d'artagnan", "D'Artagnan"],
    ["Zoë", "Zoë"],
  ])("« %s » → « %s »", (nom, prenom) => {
    expect(prenomDepuisNom(nom)).toBe(prenom);
  });

  it.each([null, undefined, "", "   ", "1234 5678"])("rien d'utilisable (%s) → pas de prénom", (nom) => {
    expect(prenomDepuisNom(nom)).toBeNull();
  });
});

describe("prénom saisi par le membre", () => {
  it("accepte un prénom composé, nettoie les espaces", () => {
    expect(lirePrenomSaisi("  Marie   Claire ")).toEqual({ prenom: "Marie Claire" });
    expect(lirePrenomSaisi("Anne-Sophie")).toEqual({ prenom: "Anne-Sophie" });
  });
  it("vide = pas de prénom", () => {
    expect(lirePrenomSaisi("   ")).toEqual({ prenom: null });
  });
  it("refuse chiffres, symboles et prénoms trop longs", () => {
    expect(lirePrenomSaisi("Caro123")).toHaveProperty("erreur");
    expect(lirePrenomSaisi("<script>")).toHaveProperty("erreur");
    expect(lirePrenomSaisi("a".repeat(41))).toHaveProperty("erreur");
  });
});

describe("salutation de l'accueil", async () => {
  const { salutation } = await import("@/app/(membre)/accueil/EnTeteAccueil");
  it("avec ou sans prénom", () => {
    expect(salutation("Caroline")).toBe("Salut Caroline");
    expect(salutation(null)).toBe("Salut !");
  });
});
