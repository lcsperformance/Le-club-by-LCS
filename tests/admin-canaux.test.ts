import { describe, expect, it } from "vitest";
import { adresseCanal, lireCanal } from "@/lib/admin/canaux";

describe("canaux gérés par l'admin", () => {
  it("adresse tirée du nom : minuscules sans accents, mots reliés par des tirets", () => {
    expect(adresseCanal("Sorties longues", [])).toBe("sorties-longues");
    expect(adresseCanal("Nutrition & matos !", [])).toBe("nutrition-matos");
    expect(adresseCanal("Été 2027 : stages", [])).toBe("ete-stages");
    expect(adresseCanal("Cœur", [])).toBe("coeur");
  });

  it("refuse une adresse prise, réservée (questions, agenda) ou vide", () => {
    expect(adresseCanal("Général", ["general"])).toBeNull();
    expect(adresseCanal("Questions", [])).toBeNull();
    expect(adresseCanal("Agenda", [])).toBeNull();
    expect(adresseCanal("2027 !", [])).toBeNull();
  });

  it("adresse de 30 caractères au plus, sans tiret final", () => {
    const a = adresseCanal("Un nom de canal vraiment beaucoup trop long", [])!;
    expect(a.length).toBeLessThanOrEqual(30);
    expect(a).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("saisie : nom 1-30, description 1-80, ordre 1-99, espaces nettoyés", () => {
    expect(lireCanal({ nom: "  sorties   longues ", description: "Le dimanche", lecture_seule: false, ordre: "8" })).toEqual({
      canal: { nom: "sorties longues", description: "Le dimanche", lecture_seule: false, ordre: 8 },
    });
    expect(lireCanal({ nom: "", description: "x", ordre: 1 })).toHaveProperty("erreur");
    expect(lireCanal({ nom: "x".repeat(31), description: "x", ordre: 1 })).toHaveProperty("erreur");
    expect(lireCanal({ nom: "x", description: "", ordre: 1 })).toHaveProperty("erreur");
    expect(lireCanal({ nom: "x", description: "x", ordre: 0 })).toHaveProperty("erreur");
    expect(lireCanal({ nom: "x", description: "x", ordre: 1, lecture_seule: true })).toMatchObject({ canal: { lecture_seule: true } });
  });
});
