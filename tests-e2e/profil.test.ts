/** Écran Profil (aperçu) : choix du niveau et du profil, raccourcis, écrans « bientôt ». */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

let navigateur: Browser;
let page: Page;

const presse = (nom: string) => page.getByRole("button", { name: nom }).getAttribute("aria-pressed");

beforeAll(async () => {
  navigateur = await chromium.launch();
  page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
  // Aperçu : niveau Challenger et profil Extensif déjà choisis.
  await page.goto(`${BASE}/apercu-membre/profil`, { waitUntil: "networkidle" });
});

afterAll(async () => {
  await navigateur?.close();
});

describe("écran Profil : niveau et profil", () => {
  it("affiche les 3 niveaux et les 2 profils avec leurs textes", async () => {
    for (const n of ["Finisher", "Challenger", "Performer"]) expect(await page.getByRole("button", { name: n }).isVisible()).toBe(true);
    expect(await page.getByText("Tu encaisses bien le volume : le plan insiste sur l'endurance.").isVisible()).toBe(true);
    expect(await page.getByText("Tu réponds bien aux séances dures : le plan insiste sur l'intensité.").isVisible()).toBe(true);
  });

  it("montre les choix déjà faits", async () => {
    expect(await presse("Challenger")).toBe("true");
    expect(await presse("Finisher")).toBe("false");
    expect(await presse("Extensif Tu encaisses bien le volume : le plan insiste sur l'endurance.")).toBe("true");
  });

  it("toucher un autre niveau tente de l'enregistrer ; en cas d'échec (ici, pas de session), le choix précédent revient", async () => {
    await page.getByRole("button", { name: "Performer" }).click();
    const message = page.locator("p[role=alert]");
    await message.waitFor();
    expect(await message.textContent()).toMatch(/session a expiré/);
    expect(await presse("Challenger")).toBe("true");
    expect(await presse("Performer")).toBe("false");
  });
});

describe("écran Profil : raccourcis", () => {
  it("propose, dans l'ordre de la maquette, Mes records, Mes progrès, Mes zones, Refaire mes tests", async () => {
    const liens = await page.$$eval("main a[href]", (as) =>
      as.map((a) => [a.textContent?.trim(), a.getAttribute("href")]).filter(([, h]) => h !== "/accueil"),
    );
    expect(liens).toEqual([
      ["Mes records", "/records"],
      ["Mes progrès", "/progres"],
      ["Mes zones", "/zones"],
      ["Refaire mes tests", "/tests"],
    ]);
  });

  it("propose « Se déconnecter »", async () => {
    expect(await page.getByRole("button", { name: "Se déconnecter" }).isVisible()).toBe(true);
  });
});

describe("écrans « bientôt »", () => {
  it.each([
    ["records", "Mes records"],
    ["progres", "Mes progrès"],
  ])("%s affiche son titre, « Bientôt disponible » et un retour au Profil", async (ecran, titre) => {
    const p = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BASE}/apercu-membre/${ecran}`, { waitUntil: "networkidle" });
    expect(await p.getByRole("heading", { level: 1 }).textContent()).toBe(titre);
    expect(await p.getByText("Bientôt disponible").isVisible()).toBe(true);
    expect(await p.getByRole("link", { name: "Profil" }).getAttribute("href")).toBe("/profil");
    await p.close();
  });
});
