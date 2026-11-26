/** Admin des canaux (aperçu) : un formulaire par canal ; « annonces » protégé ; suppression en retapant le nom. */
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

describe("admin des canaux", () => {
  it("annonces : lecture seule cochée et grisée, pas de bouton Supprimer", async () => {
    const page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    try {
      await page.goto(`${BASE}/apercu-espace/admin-canaux`, { waitUntil: "networkidle" });
      const annonces = page.getByRole("form", { name: "Canal # annonces" });
      const caseLecture = annonces.getByRole("checkbox");
      expect(await caseLecture.isChecked()).toBe(true);
      expect(await caseLecture.isDisabled()).toBe(true);
      expect(await annonces.getByRole("button", { name: "Supprimer" }).count()).toBe(0);
      expect(await page.getByRole("form", { name: "Nouveau canal" }).isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  });

  it("supprimer : il faut retaper le nom, le nombre de messages est annoncé", async () => {
    const page = await navigateur.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      await page.goto(`${BASE}/apercu-espace/admin-canaux`, { waitUntil: "networkidle" });
      await page.getByRole("form", { name: "Canal # général" }).getByRole("button", { name: "Supprimer" }).click();
      const fenetre = page.getByRole("dialog", { name: "Supprimer # général" });
      expect(await fenetre.innerText()).toContain("128 messages");
      const bouton = fenetre.getByRole("button", { name: "Supprimer définitivement" });
      expect(await bouton.isDisabled()).toBe(true);
      await fenetre.getByRole("textbox").fill("general");
      expect(await bouton.isDisabled()).toBe(true);
      await fenetre.getByRole("textbox").fill("général");
      expect(await bouton.isDisabled()).toBe(false);
      await page.keyboard.press("Escape");
      expect(await fenetre.count()).toBe(0);
    } finally {
      await page.close();
    }
  });
});
