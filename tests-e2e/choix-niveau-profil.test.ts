/** Choix du niveau et du profil, manipulés comme le ferait un membre (écran Profil d'aperçu). */
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
