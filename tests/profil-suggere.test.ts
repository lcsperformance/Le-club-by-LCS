import { describe, expect, it } from "vitest";
import { validerConfigProfils } from "@/lib/config-profils";
import { profilSuggere } from "@/lib/profil-suggere";
import { CONFIG_PROFILS } from "@/lib/profils";

const seuils = { extensif_a_partir_de: 85, intensif_en_dessous_de: 80 };

describe("profil suggéré d'après les tests vélo (FTP ÷ puissance max 5 min)", () => {
  it("FTP proche de la puissance max : plutôt extensif", () => {
    // 220 / 250 = 88 %
    expect(profilSuggere({ ftp: 220, pma_5min: 250 }, seuils)).toEqual({ type: "suggere", profil: "extensif", pourcentage: 88 });
  });

  it("85 % pile : extensif", () => {
    expect(profilSuggere({ ftp: 170, pma_5min: 200 }, seuils)).toMatchObject({ profil: "extensif", pourcentage: 85 });
  });

  it("FTP loin de la puissance max : plutôt intensif", () => {
    // 220 / 300 = 73 %
    expect(profilSuggere({ ftp: 220, pma_5min: 300 }, seuils)).toEqual({ type: "suggere", profil: "intensif", pourcentage: 73 });
  });

  it("entre les deux seuils : profil équilibré (aucun profil suggéré)", () => {
    // 220 / 268 = 82 %
    expect(profilSuggere({ ftp: 220, pma_5min: 268 }, seuils)).toEqual({ type: "suggere", profil: null, pourcentage: 82 });
    // 80 % pile : pas encore intensif
    expect(profilSuggere({ ftp: 200, pma_5min: 250 }, seuils)).toMatchObject({ profil: null, pourcentage: 80 });
  });

  it("sans FTP ou sans puissance max : pas de suggestion", () => {
    expect(profilSuggere({ ftp: 220, pma_5min: null }, seuils)).toEqual({ type: "sans-test" });
    expect(profilSuggere({ ftp: null, pma_5min: 260 }, seuils)).toEqual({ type: "sans-test" });
    expect(profilSuggere(null, seuils)).toEqual({ type: "sans-test" });
  });

  it("utilise les seuils de config/profils.json par défaut", () => {
    expect(CONFIG_PROFILS.suggestion).toMatchObject(seuils);
    expect(profilSuggere({ ftp: 220, pma_5min: 250 })).toMatchObject({ profil: "extensif" });
  });
});

describe("seuils dans config/profils.json", () => {
  const base = structuredClone(CONFIG_PROFILS);
  const avec = (suggestion: unknown) => ({ ...base, suggestion });

  it("acceptent des pourcentages entiers entre 50 et 100", () => {
    expect(() => validerConfigProfils(avec({ extensif_a_partir_de: 90, intensif_en_dessous_de: 75 }))).not.toThrow();
  });

  it.each([
    ["manquants", undefined],
    ["à virgule", { extensif_a_partir_de: 85.5, intensif_en_dessous_de: 80 }],
    ["hors limites", { extensif_a_partir_de: 120, intensif_en_dessous_de: 80 }],
    ["inversés", { extensif_a_partir_de: 80, intensif_en_dessous_de: 85 }],
  ])("refusent des seuils %s", (_, suggestion) => {
    expect(() => validerConfigProfils(avec(suggestion))).toThrow(/suggestion/);
  });
});
