/** Club › Questions et Agenda, et leurs écrans admin (aperçus, aujourd'hui = lundi 11/01/2027). */
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
  await page.goto(`${BASE}${ecran}`, { waitUntil: "networkidle" });
  return page;
}

describe("Club › Questions", () => {
  it("prochaine FAQ à la française, « Ajouter à mon agenda », questions sans votes", async () => {
    const page = await ouvrir("/apercu-membre/club-questions");
    expect(await page.getByRole("link", { name: "Questions" }).getAttribute("aria-current")).toBe("page");
    expect(await page.getByText("Jeudi 14 janvier · 19 h 30 – 20 h 30").isVisible()).toBe(true);
    expect(await page.getByRole("link", { name: "Ajouter à mon agenda" }).getAttribute("href")).toMatch(/^\/club\/agenda\/[0-9a-f-]{36}\/ics$/);
    expect(await page.getByText("4 questions déposées").isVisible()).toBe(true);
    const questions = page.getByRole("listitem");
    // À traiter d'abord (de la plus ancienne), puis la traitée.
    expect(await questions.first().innerText()).toContain("Posée par Thomas le 08/01/2027");
    expect(await questions.last().innerText()).toContain("Traitée en FAQ");
    expect(await page.getByText("Posée par toi le 10/01/2027").isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: "Retirer ma question" }).count()).toBe(1);
    expect(await page.getByText(/vote/i).count()).toBe(0);
    await page.close();
  });

  it("une question vide n'est pas envoyée ; sans FAQ prévue, un message", async () => {
    const page = await ouvrir("/apercu-membre/club-questions-vide");
    expect(await page.getByText("Date bientôt annoncée").isVisible()).toBe(true);
    await page.getByRole("button", { name: "Envoyer ma question" }).click();
    expect(await page.getByText("Écris ta question avant de l'envoyer.").isVisible()).toBe(true);
    await page.close();
  });
});

describe("Club › Agenda", () => {
  it("calendrier de janvier 2027, jours d'événement marqués, événements du mois", async () => {
    const page = await ouvrir("/apercu-membre/club-agenda");
    expect(await page.getByText("Janvier 2027").isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: /jeudi 14 janvier 2027 · événement/i }).count()).toBe(1);
    expect(await page.getByRole("button", { name: /mercredi 13 janvier 2027 · événement/i }).count()).toBe(0);
    const evenements = page.getByRole("listitem");
    expect(await evenements.count()).toBe(2);
    expect(await evenements.first().innerText()).toMatch(/14\s*janv\.[\s\S]*FAQ en visio[\s\S]*Jeudi 14 janvier · 19 h 30 – 20 h 30 · En visio/);
    expect(await page.getByRole("link", { name: "Rejoindre la visio" }).getAttribute("href")).toBe("https://visio.exemple.fr/faq-janvier");
    expect(await page.getByText("Printemps 2027 · dates à venir").isVisible()).toBe(true);
    await page.close();
  });

  it("toucher un jour n'affiche que ses événements ; changer de mois", async () => {
    const page = await ouvrir("/apercu-membre/club-agenda");
    await page.getByRole("button", { name: /jeudi 21 janvier 2027/i }).click();
    expect(await page.getByRole("listitem").count()).toBe(1);
    expect(await page.getByRole("listitem").innerText()).toContain("Webinaire");
    await page.getByRole("button", { name: "Voir tout le mois" }).click();
    expect(await page.getByRole("listitem").count()).toBe(2);
    await page.getByRole("button", { name: "Mois suivant" }).click();
    expect(await page.getByText("Février 2027").isVisible()).toBe(true);
    expect(await page.getByText("Aucun événement ce mois-ci.").isVisible()).toBe(true);
    await page.close();
  });
});

describe("Admin", () => {
  it("boîte à questions : à traiter / traitées, marquer traitée, copier la liste", async () => {
    const page = await ouvrir("/apercu-espace/admin-questions");
    expect(await page.getByRole("button", { name: "À traiter (3)" }).getAttribute("aria-pressed")).toBe("true");
    expect(await page.getByRole("button", { name: "Marquer traitée" }).count()).toBe(3);
    expect(await page.getByRole("button", { name: "Copier la liste pour la FAQ" }).isVisible()).toBe(true);
    await page.getByRole("button", { name: "Traitées (1)" }).click();
    expect(await page.getByRole("button", { name: "Remettre à traiter" }).count()).toBe(1);
    expect(await page.getByText(/Traitée le 28\/12\/2026 · 21 h 30/).isVisible()).toBe(true);
    await page.close();
  });

  it("agenda : à venir et passés ; formulaire en heures de Paris ; dates à confirmer", async () => {
    const page = await ouvrir("/apercu-espace/admin-agenda");
    expect(await page.getByRole("heading", { name: "À venir (2)" }).isVisible()).toBe(true);
    expect(await page.getByRole("heading", { name: "Passés (1)" }).isVisible()).toBe(true);
    await page.close();
    const modifier = await ouvrir("/apercu-espace/admin-agenda-modifier");
    expect(await modifier.getByLabel("Date de début").inputValue()).toBe("2027-01-14");
    expect(await modifier.getByLabel("Heure de début (Paris)").inputValue()).toBe("19:30");
    expect(await modifier.getByLabel("Heure de fin (Paris)").inputValue()).toBe("20:30");
    await modifier.close();
    const nouveau = await ouvrir("/apercu-espace/admin-agenda-nouveau");
    await nouveau.getByRole("button", { name: "Ajouter à l'agenda" }).click();
    expect(await nouveau.getByText("Le titre doit faire entre 1 et 80 caractères.").isVisible()).toBe(true);
    expect(await nouveau.getByText("Indique la date et l'heure de début.").isVisible()).toBe(true);
    await nouveau.close();
    const aConfirmer = await ouvrir("/apercu-espace/admin-agenda-a-confirmer");
    expect(await aConfirmer.getByLabel("Période affichée").inputValue()).toBe("Printemps 2027");
    expect(await aConfirmer.getByLabel("Heure de début (Paris)").count()).toBe(0);
    await aConfirmer.close();
  });
});
