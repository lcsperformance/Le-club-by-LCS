/** Onglet Ressources (aperçus, données fictives : membre en semaine 3). */
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
  const page = await navigateur.newPage({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/apercu-membre/${ecran}`, { waitUntil: "networkidle" });
  return page;
}

describe("Ressources", () => {
  it("5 thèmes avec une icône (pas une lettre) et le nombre de contenus débloqués", async () => {
    const page = await ouvrir("ressources");
    const themes = page.getByRole("listitem");
    expect(await themes.count()).toBe(5);
    expect(await themes.allInnerTexts()).toEqual([
      "Nutrition\n3 / 4 contenus",
      "Natation\n1 / 1 contenu",
      "Vélo\n1 / 1 contenu",
      "Course à pied\n0 / 0 contenu",
      "Préparation\n0 / 1 contenu",
    ]);
    expect(await page.locator("a[href='/ressources/nutrition'] svg").count()).toBe(1);
    expect(await page.getByRole("link", { name: /Mes favoris/ }).innerText()).toMatch(/Mes favoris\s+2/);
    await page.close();
  });

  it("thème : sous-rubriques, contenus ouverts avec étoile, verrouillés avec la semaine d'ouverture", async () => {
    const page = await ouvrir("ressources-theme");
    expect(await page.getByRole("heading", { level: 2 }).allInnerTexts()).toEqual(["Les bases de la nutrition", "Nutrition à l'effort"]);
    const ouvert = page.getByRole("link", { name: /Les macronutriments en 5 minutes/ });
    expect(await ouvert.getAttribute("href")).toMatch(/^\/ressources\/contenu\/[0-9a-f-]{36}$/);
    expect(await ouvert.innerText()).toContain("Vue");
    expect(await page.getByText("Téléchargé").count()).toBe(1);
    expect(await page.getByRole("button", { name: "Retirer des favoris : Les macronutriments en 5 minutes" }).getAttribute("aria-pressed")).toBe("true");
    expect(await page.getByText("PDF · débloqué semaine 4").isVisible()).toBe(true);
    expect(await page.getByRole("img", { name: "Verrouillé" }).count()).toBe(1);
    expect(await page.getByRole("link", { name: /Tableau des apports en glucides/ }).count()).toBe(0);
    await page.close();
  });

  it("favoris : les contenus étoilés, ou un message", async () => {
    const page = await ouvrir("ressources-favoris");
    expect(await page.getByRole("listitem").count()).toBe(2);
    await page.close();
    const vide = await ouvrir("ressources-favoris-vide");
    expect(await vide.getByText("Aucun favori pour l'instant. Touche l'étoile d'un contenu pour l'ajouter ici.").isVisible()).toBe(true);
    await vide.close();
  });

  it("vidéo : favori, « Vue ✓ », commentaires avec prénom, rôle et date ; supprimer seulement les siens", async () => {
    const page = await ouvrir("ressources-video");
    expect(await page.getByText("Vidéo bientôt disponible").isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: "Dans mes favoris" }).getAttribute("aria-pressed")).toBe("true");
    expect(await page.getByRole("button", { name: "Vue ✓" }).getAttribute("aria-pressed")).toBe("true");
    const commentaires = page.getByRole("region", { name: "Commentaires" }).getByRole("listitem");
    expect(await commentaires.count()).toBe(3);
    expect(await commentaires.nth(1).innerText()).toMatch(/^Martin · Coach · 09\/01\/2027 · 08 h 15/);
    expect(await page.getByRole("button", { name: "Supprimer" }).count()).toBe(1);
    expect(await page.getByLabel("Ton commentaire").getAttribute("placeholder")).toBe("Ajouter un commentaire");
    await page.getByRole("button", { name: "Publier" }).click();
    expect(await page.getByText("Écris ton commentaire avant de le publier.").isVisible()).toBe(true);
    await page.close();
  });

  it("PDF : « Téléchargé ✓ » vers le téléchargement protégé, ou « Fichier bientôt disponible »", async () => {
    const page = await ouvrir("ressources-pdf");
    expect(await page.getByRole("link", { name: "Téléchargé ✓" }).getAttribute("href")).toMatch(/^\/ressources\/contenu\/[0-9a-f-]{36}\/telecharger$/);
    expect(await page.getByRole("region", { name: "Commentaires" }).count()).toBe(0);
    await page.close();
    const bientot = await ouvrir("ressources-pdf-bientot");
    expect(await bientot.getByText("Fichier bientôt disponible").isVisible()).toBe(true);
    await bientot.close();
  });

  it("contenu verrouillé : rien à voir ni à télécharger avant sa semaine", async () => {
    const page = await ouvrir("ressources-verrouille");
    expect(await page.getByText("Débloqué en semaine 6 de ton abonnement").isVisible()).toBe(true);
    expect(await page.getByRole("button").count()).toBe(0);
    expect(await page.locator("a[href*='telecharger'], iframe").count()).toBe(0);
    await page.close();
  });
});
