/** Espace admin des Ressources (aperçus, données fictives). */
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
  const page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/apercu-espace/${ecran}`, { waitUntil: "networkidle" });
  return page;
}

describe("admin : Ressources", () => {
  it("liste par thème, avec ce qu'il manque à chaque contenu", async () => {
    const page = await ouvrir("admin-ressources");
    expect(await page.getByRole("heading", { level: 2 }).allInnerTexts()).toEqual(["Nutrition", "Natation", "Vélo", "Course à pied", "Préparation"]);
    expect(await page.getByRole("link", { name: /Comprendre sa puissance seuil/ }).innerText()).toContain("lien à ajouter");
    expect(await page.getByRole("link", { name: /Tableau des apports en glucides/ }).innerText()).toContain("PDF à déposer");
    expect(await page.getByRole("link", { name: "Ajouter un contenu" }).getAttribute("href")).toBe("/admin/ressources/nouveau");
    expect(await page.getByRole("link", { name: "Commentaires (3)" }).getAttribute("href")).toBe("/admin/ressources/commentaires");
    await page.close();
  });

  it("nouveau contenu : la sous-rubrique suit le thème ; PDF ou lien YouTube selon le type", async () => {
    const page = await ouvrir("admin-ressources-nouveau");
    await page.getByLabel("Thème").selectOption("velo");
    expect(await page.getByLabel("Sous-rubrique").locator("option").allInnerTexts()).toEqual(["Position et matériel", "Travail de puissance"]);
    expect(await page.getByLabel("Choisir une miniature").count()).toBe(1);
    await page.getByRole("button", { name: "PDF" }).click();
    expect(await page.getByLabel("Choisir un PDF").count()).toBe(1);
    expect(await page.getByLabel("Choisir une miniature").count()).toBe(0);
    await page.close();
  });

  it("un lien qui n'est pas YouTube et un titre vide sont signalés sans rien envoyer", async () => {
    const page = await ouvrir("admin-ressources-nouveau");
    await page.getByLabel(/Lien de la vidéo YouTube/).fill("https://vimeo.com/123");
    await page.getByLabel("Semaine de déblocage").fill("0");
    await page.getByRole("button", { name: "Ajouter le contenu" }).click();
    expect(await page.getByText(/Ce lien n'est pas une vidéo YouTube/).isVisible()).toBe(true);
    expect(await page.getByText("Le titre doit faire entre 1 et 120 caractères.").isVisible()).toBe(true);
    expect(await page.getByText(/La semaine de déblocage est un nombre entier/).isVisible()).toBe(true);
    await page.close();
  });

  it("modifier : valeurs actuelles, lien YouTube lisible, bouton de suppression", async () => {
    const page = await ouvrir("admin-ressources-video");
    expect(await page.getByLabel("Titre").inputValue()).toBe("Les macronutriments en 5 minutes");
    expect(await page.getByLabel(/Lien de la vidéo YouTube/).inputValue()).toBe("https://youtu.be/dQw4w9WgXcQ");
    expect(await page.getByRole("button", { name: "Supprimer ce contenu" }).isVisible()).toBe(true);
    await page.close();
    const pdf = await ouvrir("admin-ressources-pdf");
    expect(await pdf.getByText("Un PDF est déjà déposé. Choisis-en un autre pour le remplacer.").isVisible()).toBe(true);
    await pdf.close();
  });

  it("thèmes : icône à choisir (pas une lettre), suppression impossible tant qu'il reste des contenus", async () => {
    const page = await ouvrir("admin-ressources-themes");
    const nutrition = page.getByRole("region", { name: "Nutrition" });
    expect(await nutrition.getByRole("button", { name: "Pomme (nutrition)" }).getAttribute("aria-pressed")).toBe("true");
    expect(await nutrition.getByText("impossible tant qu'il contient des contenus").isVisible()).toBe(true);
    expect(await page.getByRole("region", { name: "Course à pied" }).getByText("impossible tant qu'il contient des contenus").count()).toBe(0);
    expect(await page.getByRole("region", { name: "Nouveau thème" }).getByRole("button", { name: "Ajouter le thème" }).isVisible()).toBe(true);
    await page.close();
  });

  it("commentaires : auteur, date, vidéo concernée et bouton Supprimer", async () => {
    const page = await ouvrir("admin-ressources-commentaires");
    const lignes = page.getByRole("listitem");
    expect(await lignes.count()).toBe(3);
    expect(await lignes.nth(1).innerText()).toMatch(/Martin · Coach · 09\/01\/2027 · 08 h 15/);
    expect(await lignes.nth(1).getByRole("link", { name: "Les macronutriments en 5 minutes" }).getAttribute("href")).toMatch(/^\/ressources\/contenu\//);
    expect(await page.getByRole("button", { name: "Supprimer" }).count()).toBe(3);
    await page.close();
  });
});
