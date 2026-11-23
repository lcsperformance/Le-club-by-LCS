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

describe("nom de famille", () => {
  it("tiré du nom saisi chez Stripe : tout ce qui suit le prénom", async () => {
    const { nomDepuisNomComplet } = await import("@/lib/prenom");
    expect(nomDepuisNomComplet("caroline DUPONT")).toBe("Dupont");
    expect(nomDepuisNomComplet("anne de LA FONTAINE")).toBe("De La Fontaine");
    expect(nomDepuisNomComplet("Jean-Pierre  martin-moreau ")).toBe("Martin-Moreau");
    expect(nomDepuisNomComplet("Caroline")).toBeNull();
    expect(nomDepuisNomComplet(null)).toBeNull();
  });

  it("saisi par le membre : lettres, espaces, tirets et apostrophes, 60 caractères au plus", async () => {
    const { lireNomSaisi } = await import("@/lib/prenom");
    expect(lireNomSaisi("  d'Artagnan  ")).toEqual({ nom: "d'Artagnan" });
    expect(lireNomSaisi("")).toEqual({ nom: null });
    expect(lireNomSaisi("Dupont 2")).toHaveProperty("erreur");
    expect(lireNomSaisi("x".repeat(61))).toHaveProperty("erreur");
  });
});
