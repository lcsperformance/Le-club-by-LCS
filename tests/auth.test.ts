import { afterEach, describe, expect, it, vi } from "vitest";
import { cheminAccueil, estCheminPublic } from "@/lib/roles";
import { validerNouveauMotDePasse } from "@/lib/mot-de-passe";

describe("page d'arrivée selon le rôle", () => {
  it.each([
    ["membre", "/accueil"],
    ["coach", "/coach"],
    ["admin", "/admin"],
  ] as const)("%s → %s", (role, chemin) => {
    expect(cheminAccueil(role)).toBe(chemin);
  });
});

describe("pages publiques", () => {
  it("connexion, mot de passe oublié et confirmation sont publiques", () => {
    expect(estCheminPublic("/connexion")).toBe(true);
    expect(estCheminPublic("/mot-de-passe-oublie")).toBe(true);
    expect(estCheminPublic("/auth/confirm")).toBe(true);
  });

  it("les espaces et le changement de mot de passe sont protégés", () => {
    for (const p of ["/", "/accueil", "/coach", "/admin", "/mot-de-passe/nouveau", "/connexion-piege"]) {
      expect(estCheminPublic(p)).toBe(false);
    }
  });
});

describe("nouveau mot de passe", () => {
  it("refuse un mot de passe trop court", () => {
    expect(validerNouveauMotDePasse("abc123", "abc123")).toMatch(/8 caractères/);
  });
  it("exige une lettre et un chiffre", () => {
    expect(validerNouveauMotDePasse("abcdefgh", "abcdefgh")).toMatch(/lettre et un chiffre/);
    expect(validerNouveauMotDePasse("12345678", "12345678")).toMatch(/lettre et un chiffre/);
  });
  it("exige deux saisies identiques", () => {
    expect(validerNouveauMotDePasse("triathlon2027", "triathlon2026")).toMatch(/identiques/);
  });
  it("accepte un mot de passe correct", () => {
    expect(validerNouveauMotDePasse("triathlon2027", "triathlon2027")).toBeNull();
  });
});

describe("pages d'aperçu (tests d'affichage)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sont fermées par défaut", () => {
    expect(estCheminPublic("/apercu-espace/admin")).toBe(false);
  });

  it("s'ouvrent seulement avec APERCU=1", () => {
    vi.stubEnv("APERCU", "1");
    expect(estCheminPublic("/apercu-espace/admin")).toBe(true);
    expect(estCheminPublic("/apercu-membre/zones-velo")).toBe(true);
  });

  it("restent fermées en production, même avec APERCU=1", () => {
    vi.stubEnv("APERCU", "1");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(estCheminPublic("/apercu-espace/admin")).toBe(false);
  });
});
