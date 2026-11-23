/** Espace coach (aperçus, données fictives, aujourd'hui = 11/01/2027). */
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

async function ouvrir(ecran: string, largeur = 1180): Promise<Page> {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: 800 } });
  await page.goto(`${BASE}/apercu-espace/${ecran}`, { waitUntil: "networkidle" });
  return page;
}

describe("Espace coach : athlètes", () => {
  it("accès en cours par ordre alphabétique, prénom et nom, jamais d'e-mail", async () => {
    const page = await ouvrir("coach");
    const athletes = page.getByRole("region", { name: "Athlètes" }).getByRole("listitem");
    expect(await athletes.allInnerTexts()).toEqual([
      "C\nCaroline Dupont\nChallenger",
      "H\nHugo\nNiveau pas encore choisi",
      "L\nLéa Martin-Delacroix de Saint-Exupéry\nPerformer",
      "T\nThomas Bernard\nFinisher",
    ]);
    expect(await page.getByText(/@/).count()).toBe(1); // seulement l'e-mail du coach, dans son en-tête
    await page.getByLabel("Voir aussi les anciens membres").check();
    expect(await athletes.count()).toBe(5);
    expect(await page.getByText("Challenger · ancien membre").isVisible()).toBe(true);
    await page.getByLabel("Rechercher un athlète").fill("dupont");
    expect(await athletes.count()).toBe(1);
    await page.close();
  });
});

describe("Espace coach : fiche d'un athlète", () => {
  it("niveau, profil, objectifs à venir, tableau des séances en lecture seule", async () => {
    const page = await ouvrir("coach-fiche");
    expect(await page.getByRole("heading", { name: "Caroline Dupont" }).isVisible()).toBe(true);
    expect(await page.getByText("Niveau Challenger").isVisible()).toBe(true);
    expect(await page.getByText("Triathlon de Nice · Bloc M · 14/02/2027").isVisible()).toBe(true);
    expect(await page.getByText(/Historique en lecture seule/).isVisible()).toBe(true);
    expect(await page.getByRole("link", { name: /Caroline Dupont/ }).getAttribute("aria-current")).toBe("page");
    const lignes = page.getByRole("region", { name: "Séances faites" }).getByRole("listitem");
    expect(await lignes.count()).toBe(5);
    expect(await lignes.first().innerText()).toMatch(/Dim\. 10 janv\.[\s\S]*Course[\s\S]*Sortie longue[\s\S]*6[\s\S]*Non[\s\S]*Jambes un peu lourdes/);
    expect(await lignes.last().innerText()).toMatch(/Lun\. 28 déc\. 2026[\s\S]*Séance retirée du programme/);
    // Aucune modification, aucun message privé.
    expect(await page.locator("main input:not([type=checkbox]):not([type=hidden]):not([name=recherche]), main textarea, main select").count()).toBe(0);
    expect(await page.getByRole("button", { name: /modifier|écrire|message|envoyer/i }).count()).toBe(0);
    await page.close();
  });

  it("filtre « Douleurs »", async () => {
    const page = await ouvrir("coach-fiche");
    await page.getByRole("button", { name: "Douleurs (1)" }).click();
    const lignes = page.getByRole("region", { name: "Séances faites" }).getByRole("listitem");
    expect(await lignes.count()).toBe(1);
    expect(await lignes.first().innerText()).toContain("Gêne au mollet droit");
    await page.getByRole("button", { name: "Toutes (5)" }).click();
    expect(await lignes.count()).toBe(5);
    await page.close();
  });

  it("sans séance : un message ; sur téléphone, la fiche seule avec un retour aux athlètes", async () => {
    const page = await ouvrir("coach-fiche-vide", 390);
    expect(await page.getByText("Aucune séance notée pour l'instant.").isVisible()).toBe(true);
    expect(await page.getByRole("link", { name: "Athlètes" }).getAttribute("href")).toBe("/coach");
    expect(await page.getByLabel("Rechercher un athlète").isVisible()).toBe(false);
    await page.close();
  });
});
