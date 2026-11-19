import { describe, expect, it } from "vitest";
import { estSessionDeReinitialisation } from "@/lib/reinitialisation";

const maintenant = new Date("2026-11-19T10:00:00Z");
const ilYa = (minutes: number) => maintenant.getTime() / 1000 - minutes * 60;

describe("changement de mot de passe sans l'ancien", () => {
  it("permis juste après un lien « mot de passe oublié »", () => {
    expect(estSessionDeReinitialisation([{ method: "otp", timestamp: ilYa(2) }], maintenant)).toBe(true);
    expect(estSessionDeReinitialisation([{ method: "recovery", timestamp: ilYa(14) }], maintenant)).toBe(true);
  });

  it("refusé après 15 minutes", () => {
    expect(estSessionDeReinitialisation([{ method: "otp", timestamp: ilYa(16) }], maintenant)).toBe(false);
  });

  it("refusé pour une session ouverte avec le mot de passe", () => {
    expect(estSessionDeReinitialisation([{ method: "password", timestamp: ilYa(1) }], maintenant)).toBe(false);
  });

  it("refusé sans information de connexion", () => {
    expect(estSessionDeReinitialisation(undefined, maintenant)).toBe(false);
    expect(estSessionDeReinitialisation(["otp"], maintenant)).toBe(false);
  });
});
