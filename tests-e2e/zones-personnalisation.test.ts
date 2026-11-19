/** Personnalisation des zones, manipulée comme le ferait un membre (page d'aperçu, course, seuil 4:30 /km). */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

let navigateur: Browser;
let page: Page;

const pourcentages = () => page.$$eval("section[aria-label^='Zones'] h2 + p", (ps) => ps.map((p) => p.textContent));
const cible = (zone: number) => page.locator("section[aria-label^='Zones'] > div").nth(zone - 1).locator("p").nth(1);

beforeAll(async () => {
  navigateur = await chromium.launch();
  page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
  // Aperçu : bornes enregistrées [60, 78, 90, 95, 102, 110], mode personnalisation ouvert.
  await page.goto(`${BASE}/apercu-membre/zones-personnalisation`, { waitUntil: "networkidle" });
});

afterAll(async () => {
  await navigateur?.close();
});

describe("personnaliser mes zones", () => {
  it("affiche les bornes enregistrées et la pastille « Zones personnalisées »", async () => {
    expect(await pourcentages()).toEqual(["60 – 78 %", "78 – 90 %", "90 – 95 %", "95 – 102 %", "102 – 110 %"]);
    expect(await page.getByText("Zones personnalisées").isVisible()).toBe(true);
  });

  it("le bouton + décale le début d'une zone d'1 % et met la cible à jour en direct", async () => {
    await page.getByLabel("Début de Z3 plus 1 pour cent").click();
    expect((await pourcentages()).slice(1, 3)).toEqual(["78 – 91 %", "91 – 95 %"]);
    // 270 × 100 / 91 = 296,7 s → 4:57
    expect(await cible(3).textContent()).toBe("4:44–4:57 /km");
  });

  it("une borne ne peut pas dépasser la zone suivante", async () => {
    for (let i = 0; i < 10; i++) {
      const plus = page.getByLabel("Début de Z3 plus 1 pour cent");
      if (await plus.isDisabled()) break;
      await plus.click();
    }
    expect((await pourcentages())[2]).toBe("94 – 95 %");
    expect(await page.getByLabel("Début de Z3 plus 1 pour cent").isDisabled()).toBe(true);
  });

  it("une borne ne peut pas passer sous la zone précédente", async () => {
    for (let i = 0; i < 20; i++) {
      const moins = page.getByLabel("Début de Z2 moins 1 pour cent");
      if (await moins.isDisabled()) break;
      await moins.click();
    }
    expect((await pourcentages()).slice(0, 2)).toEqual(["60 – 61 %", "61 – 94 %"]);
  });

  it("« Revenir aux valeurs du Club » rétablit la configuration", async () => {
    await page.getByRole("button", { name: "Revenir aux valeurs du Club" }).click();
    expect(await pourcentages()).toEqual(["65 – 78 %", "78 – 88 %", "88 – 95 %", "95 – 102 %", "102 – 110 %"]);
    expect(await page.getByText("Zones personnalisées").count()).toBe(0);
  });

  it("« Terminer » enregistre (ici sans session : message d'erreur clair)", async () => {
    await page.getByRole("button", { name: "Terminer" }).click();
    // p[role=alert] : Next.js ajoute aussi sa propre zone d'annonce (vide) avec ce rôle.
    const message = page.locator("p[role=alert]");
    await message.waitFor();
    expect(await message.textContent()).toMatch(/session a expiré/);
  });
});
