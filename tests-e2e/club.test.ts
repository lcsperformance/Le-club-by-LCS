/** Onglet Club (aperçus, données fictives, aujourd'hui = lundi 11/01/2027, membre Caroline). */
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

describe("Le Club : canaux", () => {
  it("les 9 canaux, annonces en lecture seule, badges de non-lus et « Mon bloc »", async () => {
    const page = await ouvrir("club");
    const canaux = page.getByRole("listitem");
    expect(await canaux.count()).toBe(9);
    const annonces = page.getByRole("link", { name: /annonces/ });
    expect(await annonces.getAttribute("href")).toBe("/club/annonces");
    expect(await annonces.getByRole("img", { name: "Lecture seule" }).count()).toBe(1);
    expect(await annonces.getByLabel("2 messages non lus").innerText()).toBe("2");
    expect(await page.getByRole("link", { name: /courses/ }).getByLabel("99+ messages non lus").count()).toBe(1);
    expect(await page.getByRole("link", { name: /bloc-m/ }).innerText()).toContain("Mon bloc");
    expect(await page.getByRole("link", { name: /bloc-l/ }).innerText()).not.toContain("Mon bloc");
    expect(await page.getByRole("link", { name: /présentations/ }).getByText(/non lu/).count()).toBe(0);
    await page.close();
  });
});

describe("Le Club : un canal", () => {
  it("messages par jour, mes messages à droite, badge Coach, heure à la française", async () => {
    const page = await ouvrir("club-canal");
    expect(await page.getByRole("heading", { name: "# général" }).isVisible()).toBe(true);
    expect(await page.getByText("Hier", { exact: true }).isVisible()).toBe(true);
    expect(await page.getByText("Aujourd'hui", { exact: true }).isVisible()).toBe(true);
    const messages = page.getByRole("article");
    expect(await messages.count()).toBe(4);
    expect(await messages.nth(1).innerText()).toMatch(/Martin\s*Coach\s*19 h 02/);
    expect(await messages.nth(2).innerText()).toMatch(/^Toi/);
    // Chacun ne peut supprimer que ses propres messages.
    expect(await page.getByRole("button", { name: "Supprimer" }).count()).toBe(1);
    expect(await page.getByRole("button", { name: "Voir les messages précédents" }).isVisible()).toBe(true);
    expect(await page.getByLabel("Ton message").getAttribute("placeholder")).toBe("Écrire dans # général");
    expect(await page.getByText(/pas de messages privés/).isVisible()).toBe(true);
    await page.close();
  });

  it("un message vide n'est pas envoyé", async () => {
    const page = await ouvrir("club-canal");
    await page.getByRole("button", { name: "Envoyer" }).click();
    expect(await page.getByText("Écris ton message avant de l'envoyer.").isVisible()).toBe(true);
    await page.close();
  });

  it("l'admin peut supprimer chaque message", async () => {
    const page = await ouvrir("club-canal-admin");
    expect(await page.getByRole("button", { name: "Supprimer" }).count()).toBe(4);
    await page.close();
  });

  it("canal vide : une invitation à lancer la discussion", async () => {
    const page = await ouvrir("club-canal-vide");
    expect(await page.getByText("Aucun message pour l'instant. Lance la discussion.").isVisible()).toBe(true);
    await page.close();
  });

  it("annonces : lecture seule pour un membre, champ d'envoi pour le coach", async () => {
    const membre = await ouvrir("club-annonces");
    expect(await membre.getByText("Seuls l'équipe du Club et le coach publient ici.").isVisible()).toBe(true);
    expect(await membre.getByLabel("Ton message").count()).toBe(0);
    await membre.close();
    const coach = await ouvrir("club-annonces-coach");
    expect(await coach.getByLabel("Ton message").isVisible()).toBe(true);
    await coach.close();
  });

  it("le champ d'envoi reste collé en bas, au-dessus de la barre d'onglets flottante (96 px)", async () => {
    const page = await ouvrir("club-canal");
    const style = await page.locator("form", { has: page.getByLabel("Ton message") }).evaluate((f) => {
      const s = getComputedStyle(f);
      return { position: s.position, bas: parseFloat(s.bottom) };
    });
    expect(style.position).toBe("sticky");
    expect(style.bas).toBeGreaterThanOrEqual(96);
    await page.close();
  });
});
