/** Accueil (aperçus, aujourd'hui = lundi 11/01/2027) : Aujourd'hui, FAQ en visio, Nouveau cette semaine. */
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

describe("Accueil", () => {
  it("dans l'ordre de la maquette : zones, aujourd'hui, bloc, FAQ, nouveau ; plus de « programme bientôt »", async () => {
    const page = await ouvrir("accueil-tests-faits");
    const texte = await page.locator("main").innerText();
    const ordre = ["Tes zones sont à jour", "AUJOURD'HUI", "BLOC EN COURS", "FAQ EN VISIO", "NOUVEAU CETTE SEMAINE"].map((t) => texte.toUpperCase().indexOf(t.toUpperCase()));
    expect(ordre.every((p) => p >= 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    expect(texte).not.toContain("Ton programme arrive bientôt");
    await page.close();
  });

  it("« Aujourd'hui » : la séance du jour mène à la séance", async () => {
    const page = await ouvrir("accueil-tests-faits");
    const carte = page.getByRole("link", { name: /Aujourd'hui/ });
    expect(await carte.innerText()).toMatch(/Natation\s*Technique & endurance · 45 min/);
    expect(await carte.getAttribute("href")).toMatch(/^\/seance\/[0-9a-f-]{36}\?jour=2027-01-11$/);
    await page.close();
  });

  it("séance faite : coche ; deux séances : « + 1 autre séance » ; repos ; semaine à venir ; niveau à choisir", async () => {
    const faite = await ouvrir("accueil-seance-faite");
    expect(await faite.getByRole("img", { name: "Séance faite" }).count()).toBe(1);
    await faite.close();
    const deux = await ouvrir("accueil-deux-seances");
    expect(await deux.getByText(/Sweet spot · 1 h 15 · \+ 1 autre séance/).isVisible()).toBe(true);
    await deux.close();
    const repos = await ouvrir("accueil-repos");
    expect(await repos.getByText("Jour de repos").isVisible()).toBe(true);
    await repos.close();
    const aVenir = await ouvrir("accueil-a-venir");
    expect(await aVenir.getByText("Ta semaine arrive").isVisible()).toBe(true);
    await aVenir.close();
    const niveau = await ouvrir("accueil");
    expect(await niveau.getByRole("link", { name: /Choisis ton niveau et ton profil/ }).getAttribute("href")).toBe("/profil");
    await niveau.close();
  });

  it("« FAQ en visio » : prochaine date, questions déposées, « Poser une question »", async () => {
    const page = await ouvrir("accueil-tests-faits");
    const faq = page.getByRole("region", { name: "FAQ en visio" });
    expect(await faq.getByText("Jeudi 14 janvier · 19 h 30 – 20 h 30").isVisible()).toBe(true);
    expect(await faq.getByText("3 questions déposées pour la prochaine FAQ.").isVisible()).toBe(true);
    expect(await faq.getByRole("link", { name: "Poser une question" }).getAttribute("href")).toBe("/club/questions");
    await page.close();
    const sans = await ouvrir("accueil-repos");
    expect(await sans.getByText("Date bientôt annoncée").isVisible()).toBe(true);
    await sans.close();
  });

  it("« Nouveau cette semaine » : le contenu débloqué, sinon pas de carte", async () => {
    const page = await ouvrir("accueil-tests-faits");
    expect(await page.getByRole("link", { name: /Nouveau cette semaine/ }).getAttribute("href")).toMatch(/^\/ressources\/contenu\//);
    expect(await page.getByText("Que manger pendant une sortie longue").isVisible()).toBe(true);
    await page.close();
    const sans = await ouvrir("accueil-repos");
    expect(await sans.getByText(/Nouveau cette semaine/i).count()).toBe(0);
    await sans.close();
  });

  it("canal du Club : le bandeau mène à la boîte à questions", async () => {
    const page = await ouvrir("club-canal");
    expect(await page.getByRole("link", { name: "Pose-la dans la boîte à questions" }).getAttribute("href")).toBe("/club/questions");
    expect(await page.getByText("(bientôt)").count()).toBe(0);
    await page.close();
  });
});
