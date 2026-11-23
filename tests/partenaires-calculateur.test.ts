import { describe, expect, it } from "vitest";
import { integrationAutorisee } from "@/lib/calculateur";
import { formatRemise, initialePartenaire, lirePartenaire, trierPartenaires, type Partenaire } from "@/lib/partenaires";

const APP = "https://le-club-by-lcs.vercel.app";

describe("partenaires", () => {
  it("remise à la française : signe moins et espace insécable", () => {
    expect(formatRemise(15)).toBe("−15 %");
    expect(initialePartenaire("onatera")).toBe("O");
  });

  it("formulaire de l'admin : valeurs lues, erreurs rattachées à leur champ", () => {
    expect(lirePartenaire({ nom: " Pyrène ", remise: "15", description: "sur les produits Pyrène", code: "LECLUB15", lien: "", ordre: "1", affiche: true })).toEqual({
      partenaire: { nom: "Pyrène", remise: 15, description: "sur les produits Pyrène", code: "LECLUB15", lien: null, ordre: 1, affiche: true },
    });
    expect(lirePartenaire({ nom: "", remise: "95", description: "", code: "le club 15", lien: "http://x.fr", ordre: "0" })).toEqual({
      erreurs: {
        nom: "Le nom fait entre 1 et 40 caractères.",
        remise: "La remise est un nombre entier de 1 à 90 (en %).",
        description: "La description fait entre 1 et 80 caractères (ex. « sur les produits Pyrène »).",
        code: "Le code fait 3 à 30 caractères : lettres, chiffres, tirets (sans espace ni accent).",
        lien: "Le lien doit commencer par https://",
        ordre: "L'ordre est un nombre entier entre 1 et 99.",
      },
    });
  });

  it("dans l'ordre, puis par nom", () => {
    const p = (nom: string, ordre: number) => ({ nom, ordre }) as Partenaire;
    expect(trierPartenaires([p("Onatera", 2), p("Zeste", 1), p("Pyrène", 1)]).map((x) => x.nom)).toEqual(["Pyrène", "Zeste", "Onatera"]);
  });
});

describe("calculateur : le site autorise-t-il l'affichage dans l'app ?", () => {
  it("aucune interdiction : oui", () => {
    expect(integrationAutorisee({}, APP)).toBe(true);
    expect(integrationAutorisee({ csp: "default-src 'self'; img-src *" }, APP)).toBe(true);
  });

  it("X-Frame-Options DENY ou SAMEORIGIN : non", () => {
    expect(integrationAutorisee({ xFrameOptions: "DENY" }, APP)).toBe(false);
    expect(integrationAutorisee({ xFrameOptions: "sameorigin" }, APP)).toBe(false);
  });

  it("frame-ancestors : suit la liste, et prime sur X-Frame-Options", () => {
    expect(integrationAutorisee({ csp: "frame-ancestors 'none'" }, APP)).toBe(false);
    expect(integrationAutorisee({ csp: "frame-ancestors 'self'" }, APP)).toBe(false);
    expect(integrationAutorisee({ csp: "default-src 'self'; frame-ancestors 'self' https://le-club-by-lcs.vercel.app" }, APP)).toBe(true);
    expect(integrationAutorisee({ csp: "frame-ancestors https://*.vercel.app" }, APP)).toBe(true);
    expect(integrationAutorisee({ csp: "frame-ancestors *" }, APP)).toBe(true);
    expect(integrationAutorisee({ csp: "frame-ancestors https://autre-site.fr" }, APP)).toBe(false);
    expect(integrationAutorisee({ csp: "frame-ancestors http://le-club-by-lcs.vercel.app" }, APP)).toBe(false);
    expect(integrationAutorisee({ csp: "frame-ancestors *", xFrameOptions: "DENY" }, APP)).toBe(true);
  });
});
