/** Champs de mot de passe : masqués par défaut, l'œil les affiche puis les masque à nouveau. */
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

describe("afficher le mot de passe", () => {
  it.each([
    ["/connexion", "Mot de passe"],
    ["/apercu-mot-de-passe", "Nouveau mot de passe"],
    ["/apercu-mot-de-passe", "Confirme le mot de passe"],
  ])("%s · %s", async (ecran, libelle) => {
    const page = await navigateur.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      await page.goto(BASE + ecran, { waitUntil: "networkidle" });
      const champ = page.getByLabel(libelle, { exact: true });
      await champ.fill("secret-123");
      expect(await champ.getAttribute("type")).toBe("password");
      const oeil = champ.locator("xpath=..").getByRole("button", { name: "Afficher le mot de passe" });
      await oeil.click();
      expect(await champ.getAttribute("type")).toBe("text");
      expect(await champ.inputValue()).toBe("secret-123");
      await champ.locator("xpath=..").getByRole("button", { name: "Masquer le mot de passe" }).click();
      expect(await champ.getAttribute("type")).toBe("password");
    } finally {
      await page.close();
    }
  });
});
