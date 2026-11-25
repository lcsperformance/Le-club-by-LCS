/** Écran « Ma semaine » et page Séance (aperçus, données fictives, aujourd'hui = lundi 11/01/2027). */
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

describe("Ma semaine", () => {
  it("affiche les séances du jour touché, ou le repos", async () => {
    const page = await ouvrir("semaine");
    expect(await page.getByText("Technique & endurance · 45 min").isVisible()).toBe(true);
    await page.getByRole("button", { name: /^Jeudi 14 janvier · 2 séances/ }).click();
    expect(await page.getByText("Sweet spot · 1 h 15").isVisible()).toBe(true);
    expect(await page.getByText("Enchaînement · 15 min").isVisible()).toBe(true);
    await page.getByRole("button", { name: /^Vendredi 15 janvier$/ }).click();
    expect(await page.getByText("Jour de repos").isVisible()).toBe(true);
    await page.getByRole("button", { name: /^Mardi/ }).click();
    expect(await page.getByRole("link", { name: /Course à pied/ }).getAttribute("href")).toMatch(/^\/seance\/[0-9a-f-]{36}\?jour=2027-01-12$/);
    expect(await page.getByRole("img", { name: "Séance faite" }).count()).toBe(1);
    await page.close();
  });

  it("sans tests : allures verrouillées ; sans niveau : invitation à le choisir", async () => {
    const page = await ouvrir("semaine-tests-a-faire");
    expect(await page.getByText("Allures verrouillées. Fais tes tests pour les voir.").isVisible()).toBe(true);
    await page.close();
    const sansNiveau = await ouvrir("semaine-sans-objectif");
    expect(await sansNiveau.getByText("Choisis ton niveau et ton profil pour voir tes séances.").isVisible()).toBe(true);
    await sansNiveau.close();
  });

  it("semaine pas encore écrite : un message plutôt que sept jours de repos", async () => {
    const page = await ouvrir("semaine-a-venir");
    expect(await page.getByText(/pas encore en ligne/).isVisible()).toBe(true);
    expect(await page.getByText("Jour de repos").count()).toBe(0);
    await page.close();
  });
});

describe("Séance", () => {
  it("chaque bloc avec sa zone et l'allure du membre", async () => {
    const page = await ouvrir("seance");
    const blocs = page.getByRole("listitem");
    expect(await blocs.count()).toBe(4);
    expect(await blocs.nth(1).innerText()).toMatch(/Z2[\s\S]*Footing[\s\S]*\/km[\s\S]*FC \d+–\d+ bpm/);
    await page.close();
  });

  it("sans tests : allures verrouillées et lien vers les tests", async () => {
    const page = await ouvrir("seance-verrouillee");
    expect(await page.getByRole("img", { name: "Allure verrouillée" }).count()).toBe(4);
    expect(await page.getByRole("link", { name: "Débloquer mes allures : faire mes tests" }).getAttribute("href")).toBe("/tests");
    await page.close();
  });

  it("le programme n'est ni téléchargeable ni imprimable", async () => {
    const page = await ouvrir("seance");
    expect(await page.getByText(/PDF|Télécharger|Imprimer/i).count()).toBe(0);
    await page.emulateMedia({ media: "print" });
    expect(await page.locator("[data-programme]").isVisible()).toBe(false);
    await page.close();
  });
});

describe("Séance : marquer comme faite et ressenti", () => {
  it("pas encore faite : le bouton, sans le ressenti", async () => {
    const page = await ouvrir("seance");
    expect(await page.getByRole("button", { name: "Marquer comme faite" }).getAttribute("aria-pressed")).toBe("false");
    expect(await page.getByText("Ressenti de la séance").count()).toBe(0);
    await page.close();
  });

  it("faite : RPE et commentaire enregistrés, modifiables ; pas de case « douleur »", async () => {
    const page = await ouvrir("seance-faite");
    expect(await page.getByRole("button", { name: "Séance faite ✓" }).getAttribute("aria-pressed")).toBe("true");
    expect(await page.getByRole("button", { name: "RPE 7 sur 10" }).getAttribute("aria-pressed")).toBe("true");
    expect(await page.getByRole("switch").count()).toBe(0);
    expect(await page.getByLabel("Commentaire (facultatif)").inputValue()).toBe("Dur sur la fin, mais allure tenue.");
    expect(await page.getByLabel("Commentaire (facultatif)").getAttribute("placeholder")).toBe("Ton ressenti sur la séance");
    expect(await page.getByRole("button", { name: "Ressenti enregistré" }).isVisible()).toBe(true);
    expect(await page.getByText("Visible seulement par toi et les coachs.").isVisible()).toBe(true);

    await page.getByRole("button", { name: "RPE 4 sur 10" }).click();
    expect(await page.getByRole("button", { name: "RPE 4 sur 10" }).getAttribute("aria-pressed")).toBe("true");
    expect(await page.getByRole("button", { name: "RPE 7 sur 10" }).getAttribute("aria-pressed")).toBe("false");
    expect(await page.getByRole("button", { name: "Enregistrer mon ressenti" }).isVisible()).toBe(true);
    await page.close();
  });

  it("séance à venir : on ne peut pas encore la marquer", async () => {
    const page = await ouvrir("seance-a-venir");
    // Une version pour le téléphone, une pour l'ordinateur : une seule est affichée.
    expect(await page.getByText("Tu pourras marquer cette séance le jour J.").locator("visible=true").count()).toBe(1);
    expect(await page.getByRole("button", { name: "Marquer comme faite" }).count()).toBe(0);
    await page.close();
  });
});

describe("Ma semaine : semaines précédentes et suivantes", () => {
  it("semaine en cours : flèches vers les semaines voisines", async () => {
    const page = await ouvrir("semaine");
    expect(await page.getByText("Cette semaine").isVisible()).toBe(true);
    expect(await page.getByRole("link", { name: "Semaine précédente" }).getAttribute("href")).toBe("/semaine?du=2027-01-04");
    expect(await page.getByRole("link", { name: "Semaine suivante" }).getAttribute("href")).toBe("/semaine?du=2027-01-18");
    await page.close();
  });

  it("fin de la période payée : pas de semaine suivante", async () => {
    const page = await ouvrir("semaine-tests-a-faire");
    expect(await page.getByRole("link", { name: "Semaine suivante" }).count()).toBe(0);
    await page.close();
  });

  it("semaine passée : ses dates, ses séances faites, le retour à cette semaine", async () => {
    const page = await ouvrir("semaine-passee");
    expect(await page.getByText(/^16 – 22 novembre · Fil rouge$/).isVisible()).toBe(true);
    expect(await page.getByRole("heading", { name: "Lundi 16 novembre" }).isVisible()).toBe(true);
    expect(await page.getByRole("img", { name: "Séance faite" }).count()).toBe(1);
    expect(await page.getByRole("link", { name: /Natation/ }).getAttribute("href")).toMatch(/\?jour=2026-11-16$/);
    expect(await page.getByRole("link", { name: "Revenir à cette semaine" }).getAttribute("href")).toBe("/semaine");
    expect(await page.getByRole("link", { name: "Semaine précédente" }).count()).toBe(0);
    await page.close();
  });

  it("séance de plus de 14 jours : ressenti en lecture seule", async () => {
    const page = await ouvrir("seance-ancienne");
    expect(await page.getByRole("heading", { name: "Séance faite ✓" }).isVisible()).toBe(true);
    expect(await page.getByText("6/10").isVisible()).toBe(true);
    expect(await page.getByText("Bonnes sensations, un peu de vent de face sur le retour.").isVisible()).toBe(true);
    expect(await page.getByRole("button").count()).toBe(0);
    await page.close();
  });
});
