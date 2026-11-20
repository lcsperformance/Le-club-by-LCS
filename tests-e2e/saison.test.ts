/** Écran « Ma saison » (aperçu, données fictives, aujourd'hui = lundi 11/01/2027). */
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

async function ouvrir(ecran: string, largeur = 360): Promise<Page> {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: 780 }, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/apercu-membre/${ecran}`, { waitUntil: "networkidle" });
  return page;
}

describe("Ma saison", () => {
  it("sans objectif : fil rouge et invitation à ajouter une course", async () => {
    const page = await ouvrir("saison-vide");
    expect(await page.getByText("Aucun objectif pour l'instant. Tu suis le fil rouge.").isVisible()).toBe(true);
    expect(await page.getByText("Ajoute ta prochaine course dans Ma saison").isVisible()).toBe(true);
    await page.close();
  });

  it("liste les objectifs avec statut, décompte, chevauchement et course terminée", async () => {
    const page = await ouvrir("saison");
    const objectifs = page.getByRole("listitem");
    expect(await objectifs.count()).toBe(3);
    await expect.poll(() => objectifs.nth(0).innerText()).toContain("Triathlon M · 30/05/2027");
    expect(await objectifs.nth(0).innerText()).toContain("J-139");
    expect(await objectifs.nth(0).innerText()).toContain("Ce bloc chevauche celui du 20/06/2027.");
    expect(await objectifs.nth(2).innerText()).toContain("Terminé");
    // Décompte jusqu'au prochain objectif.
    expect(await page.getByRole("region", { name: /139 jours avant ton objectif Triathlon M/ }).isVisible()).toBe(true);
    await page.close();
  });

  it("bloc en cours de route : semaine adaptée, l'autre bloc à venir", async () => {
    const page = await ouvrir("saison-en-cours");
    const premier = await page.getByRole("listitem").first().innerText();
    expect(premier).toContain("Triathlon M · 14/02/2027");
    expect(premier).toMatch(/Bloc en cours · semaine \d+\/\d+ · J-34/);
    await page.close();
  });

  it("choisir un bloc met à jour l'aperçu ; le calendrier change la date de la course", async () => {
    const page = await ouvrir("saison-vide");
    await page.getByRole("button", { name: /^L Bloc L/ }).click();
    expect(await page.getByRole("button", { name: /^L Bloc L/ }).getAttribute("aria-pressed")).toBe("true");

    await page.getByRole("button", { name: /Date de ta course/ }).click();
    const feuille = page.getByRole("dialog", { name: "Date de ta course" });
    await feuille.waitFor();
    // Le calendrier s'ouvre sur le mois de la date choisie ; on remonte jusqu'au mois en cours.
    while (!(await feuille.getByRole("button", { name: "Mois précédent" }).isDisabled())) {
      await feuille.getByRole("button", { name: "Mois précédent" }).click();
    }
    expect(await feuille.getByText("Janvier 2027").isVisible()).toBe(true);
    // Jours passés désactivés, aujourd'hui possible.
    expect(await feuille.getByRole("button", { name: "dimanche 10 janvier 2027" }).isDisabled()).toBe(true);
    expect(await feuille.getByRole("button", { name: "lundi 11 janvier 2027" }).isEnabled()).toBe(true);
    for (let i = 0; i < 4; i++) await feuille.getByRole("button", { name: "Mois suivant" }).click();
    expect(await feuille.getByText("Mai 2027").isVisible()).toBe(true);
    await feuille.getByRole("button", { name: "dimanche 30 mai 2027" }).click();
    expect(await feuille.innerText()).toContain("puis ton bloc de");
    await feuille.getByRole("button", { name: "Valider le 30/05/2027" }).click();
    await feuille.waitFor({ state: "detached" });
    expect(await page.getByText("Dimanche 30 mai 2027").isVisible()).toBe(true);
    await page.close();
  });

  it("la feuille du calendrier tient sur un petit téléphone et se ferme avec Échap", async () => {
    const page = await ouvrir("saison-calendrier", 320);
    const feuille = page.getByRole("dialog");
    const boite = await feuille.boundingBox();
    expect(boite!.x).toBeGreaterThanOrEqual(0);
    expect(boite!.x + boite!.width).toBeLessThanOrEqual(320);
    expect(await feuille.getByRole("button", { name: /^Valider le/ }).isVisible()).toBe(true);
    await page.keyboard.press("Escape");
    await feuille.waitFor({ state: "detached" });
    await page.close();
  });

  it("le serveur refuse l'ajout sans session, avec un message", async () => {
    const page = await ouvrir("saison-vide");
    await page.getByRole("button", { name: "Ajouter à ma saison" }).click();
    await page.getByText(/Ta session a expiré/).waitFor();
    await page.close();
  });
});

describe("Ma semaine", () => {
  it("affiche la phase du moment et le décompte, qui mène à Ma saison", async () => {
    const page = await ouvrir("semaine");
    expect(await page.getByText(/^Bloc M, semaine \d+\/\d+$/).isVisible()).toBe(true);
    const carte = page.getByRole("link", { name: /34 jours avant ton objectif Triathlon M, le 14\/02\/2027/ });
    expect(await carte.getAttribute("href")).toBe("/saison");
    await page.close();
  });

  it("sans objectif : fil rouge", async () => {
    const page = await ouvrir("semaine-sans-objectif");
    expect(await page.getByText("Fil rouge", { exact: true }).isVisible()).toBe(true);
    await page.close();
  });
});
