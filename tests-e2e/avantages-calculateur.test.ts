/** Avantages, Calculateur et admin des partenaires (aperçus, données fictives). */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

async function ouvrir(ecran: string): Promise<Page> {
  const contexte = await navigateur.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  await contexte.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const page = await contexte.newPage();
  await page.goto(`${BASE}${ecran}`, { waitUntil: "networkidle" });
  return page;
}

describe("Avantages", () => {
  it("une carte par partenaire : nom, remise, code, « Copier le code »", async () => {
    const page = await ouvrir("/apercu-membre/avantages");
    const cartes = page.getByRole("listitem");
    expect(await cartes.count()).toBe(2);
    expect(await page.getByRole("listitem", { name: "Pyrène" }).innerText()).toMatch(/P\s*Pyrène\s*sur les produits Pyrène\s*−15\s%\s*LECLUB15\s*Copier le code/);
    expect(await page.getByRole("link", { name: "Aller sur le site Pyrène" }).getAttribute("href")).toBe("https://pyrene.exemple.fr");
    expect(await page.getByText("Atelier Vélo du Sud-Ouest").count()).toBe(0); // masqué aux membres
    await page.getByRole("button", { name: "Copier le code Onatera" }).click();
    // La copie est asynchrone : on attend que le bouton change.
    await expect.poll(() => page.getByRole("button", { name: "Copier le code Onatera" }).innerText(), { timeout: 5000 }).toBe("Code copié ✓");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("LECLUB10");
    expect(await page.getByText(/D'autres partenaires arrivent bientôt/).isVisible()).toBe(true);
    await page.context().close();
  });
});

describe("Calculateur", () => {
  it("le site l'autorise : la page dans un cadre, et « Ouvrir dans le navigateur »", async () => {
    const page = await ouvrir("/apercu-membre/calculateur");
    expect(await page.getByTitle("Calculateur LCS Performance").count()).toBe(1);
    expect(await page.getByText("lcsperformance.fr").isVisible()).toBe(true);
    const lien = page.getByRole("link", { name: "Ouvrir dans le navigateur" });
    expect(await lien.getAttribute("href")).toBe("https://lcsperformance.fr/outils/calculateur-ttzv9zrg.html");
    expect(await lien.getAttribute("target")).toBe("_blank");
    await page.context().close();
  });

  it("le site refuse : pas de cadre vide, un bouton clair", async () => {
    const page = await ouvrir("/apercu-membre/calculateur-ouvrir");
    expect(await page.locator("iframe").count()).toBe(0);
    expect(await page.getByText(/Le calculateur s'ouvre sur le site LCS Performance/).isVisible()).toBe(true);
    expect(await page.getByRole("link", { name: "Ouvrir le calculateur" }).getAttribute("href")).toBe("https://lcsperformance.fr/outils/calculateur-ttzv9zrg.html");
    await page.context().close();
  });

  it("la carte des Ressources y mène", async () => {
    const page = await ouvrir("/apercu-membre/ressources");
    expect(await page.getByRole("link", { name: /Calculateur LCS Performance/ }).getAttribute("href")).toBe("/ressources/calculateur");
    await page.context().close();
  });
});

describe("Admin : partenaires", () => {
  it("chaque partenaire modifiable, les exemples signalés, le masqué indiqué, et l'ajout", async () => {
    const page = await ouvrir("/apercu-espace/admin-partenaires");
    expect(await page.getByText("Code d'exemple à remplacer par le vrai code du partenaire.").count()).toBe(2);
    expect(await page.getByText("Masqué aux membres").isVisible()).toBe(true);
    expect(await page.getByLabel("Code promo").first().inputValue()).toBe("LECLUB15");
    const ajout = page.getByRole("region", { name: "Ajouter un partenaire" });
    await ajout.getByRole("button", { name: "Ajouter le partenaire" }).click();
    expect(await ajout.getByText("Le nom fait entre 1 et 40 caractères.").isVisible()).toBe(true);
    expect(await ajout.getByText(/La remise est un nombre entier/).isVisible()).toBe(true);
    await page.context().close();
  });
});
