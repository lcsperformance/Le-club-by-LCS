/** Écrans « Mes progrès » et « Mes records » (aperçus, données fictives). */
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

describe("Mes progrès", () => {
  it("gain depuis le premier test, courbe et historique du plus récent au plus ancien", async () => {
    const page = await ouvrir("progres");
    expect(await page.getByText("−22 s/km").isVisible()).toBe(true);
    expect(await page.getByText("plus vite sur ton allure seuil").isVisible()).toBe(true);
    const courbe = page.getByRole("img", { name: /^Courbe de ta allure seuil en course : 4:52 \/km le 14\/09/ });
    expect(await courbe.count()).toBe(1);
    // Points de la courbe seulement (les icônes de la navigation ont aussi des ronds).
    expect(await courbe.locator("circle").count()).toBe(4);
    const lignes = page.getByRole("region", { name: "Historique des tests" }).getByRole("listitem");
    expect(await lignes.count()).toBe(4);
    expect(await lignes.first().innerText()).toMatch(/11\/01\/2027\s+4:30 \/km\s+−16 s/);
    expect(await page.getByRole("link", { name: "Cardio" }).getAttribute("href")).toBe("/progres?sport=cardio");
    await page.close();
  });

  it("un seul test, pas de mesure, pas de test : un message clair", async () => {
    const un = await ouvrir("progres-un-test");
    expect(await un.getByText("Premier test").isVisible()).toBe(true);
    await un.close();
    const sansMesure = await ouvrir("progres-sans-mesure");
    expect(await sansMesure.getByText(/Pas encore de mesure de ta FC seuil/).isVisible()).toBe(true);
    await sansMesure.close();
    const sansTest = await ouvrir("progres-sans-test");
    expect(await sansTest.getByRole("link", { name: "Faire mes tests" }).isVisible()).toBe(true);
    await sansTest.close();
  });
});

describe("Mes records", () => {
  it("affiche les records enregistrés, les autres restent vides", async () => {
    const page = await ouvrir("records");
    expect(await page.getByLabel("Record 10 km").inputValue()).toBe("41:32");
    expect(await page.getByLabel("Record Semi-marathon").inputValue()).toBe("1:32:10");
    expect(await page.getByLabel("Record Triathlon XL").inputValue()).toBe("11:04:59");
    expect(await page.getByLabel("Record Marathon").inputValue()).toBe("");
    await page.close();
  });

  it("un temps mal écrit est signalé sous son champ, sans rien enregistrer", async () => {
    const page = await ouvrir("records-vide");
    await page.getByLabel("Record Marathon").fill("3h");
    await page.getByLabel("Record 10 km").fill("41:75");
    await page.getByRole("button", { name: "Enregistrer mes records" }).click();
    expect(await page.getByText("Écris le temps sous la forme 3:20:00.").isVisible()).toBe(true);
    expect(await page.getByText(/Minutes et secondes vont de 00 à 59/).isVisible()).toBe(true);
    expect(await page.getByLabel("Record Marathon").getAttribute("aria-invalid")).toBe("true");
    expect(await page.getByText("Vérifie les temps en rouge.").getAttribute("role")).toBe("alert");
    await page.close();
  });
});
