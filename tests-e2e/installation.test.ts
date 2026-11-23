/** Application installable : fiche, page hors ligne en vrai (sans réseau), carte « Installer l'app ». */
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

describe("Application installable", () => {
  it("la fiche de l'app et le programme sont servis sans connexion", async () => {
    const fiche = await fetch(`${BASE}/manifest.webmanifest`, { redirect: "manual" });
    expect(fiche.status).toBe(200);
    expect(await fiche.json()).toMatchObject({ short_name: "Le Club", display: "standalone" });
    const sw = await fetch(`${BASE}/sw.js`, { redirect: "manual" });
    expect(sw.status).toBe(200);
    expect(sw.headers.get("cache-control")).toContain("no-cache");
    expect((await fetch(`${BASE}/hors-ligne.html`, { redirect: "manual" })).status).toBe(200);
  });

  it("la page déclare la fiche, l'icône iPhone et les écrans de démarrage", async () => {
    const page = await navigateur.newPage();
    await page.goto(`${BASE}/connexion`);
    expect(await page.locator('link[rel="manifest"]').getAttribute("href")).toBe("/manifest.webmanifest");
    expect(await page.locator('link[rel="apple-touch-icon"]').count()).toBeGreaterThan(0);
    expect(await page.locator('link[rel="apple-touch-startup-image"]').count()).toBe(12);
    expect(await page.locator('meta[name="apple-mobile-web-app-title"]').getAttribute("content")).toBe("Le Club");
    await page.close();
  });

  it("sans réseau, une page affiche « Pas de connexion » au lieu de l'erreur du navigateur", async () => {
    const contexte = await navigateur.newContext({ viewport: { width: 360, height: 780 }, isMobile: true });
    const page = await contexte.newPage();
    await page.goto(`${BASE}/connexion`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await contexte.setOffline(true);
    await page.goto(`${BASE}/accueil`);
    await expect.poll(() => page.locator("h1").textContent()).toBe("Pas de connexion");
    expect(await page.getByRole("button", { name: "Réessayer" }).isVisible()).toBe(true);
    // Rien d'autre n'est gardé sur le téléphone : ni page du Club, ni donnée.
    const gardes = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const nom of await caches.keys()) {
        for (const r of await (await caches.open(nom)).keys()) urls.push(new URL(r.url).pathname);
      }
      return urls.sort();
    });
    expect(gardes).toEqual(["/hors-ligne.html", "/icones/icone-192.png"]);
    await contexte.close();
  });

  it("Android : la carte propose « Installer » en bas de l'accueil", async () => {
    const page = await ouvrir("accueil-installer-android");
    const carte = page.getByRole("region", { name: "Installe Le Club sur ton téléphone" });
    expect(await carte.getByRole("button", { name: "Installer" }).isVisible()).toBe(true);
    await page.close();
  });

  it("iPhone : la carte montre les deux gestes de Safari ; « Fermer » la masque", async () => {
    const page = await ouvrir("accueil-installer-iphone");
    const carte = page.getByRole("region", { name: "Installe Le Club sur ton téléphone" });
    const texte = await carte.innerText();
    expect(texte).toContain("Partager");
    expect(texte).toContain("Sur l'écran d'accueil");
    await carte.getByRole("button", { name: /Fermer/ }).click();
    expect(await carte.count()).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem("le-club:installation-fermee"))).toBe("1");
    await page.close();
  });

  it("sur ordinateur, pas de carte d'installation", async () => {
    const page = await ouvrir("accueil-tests-faits");
    expect(await page.getByText("Installe Le Club sur ton téléphone").count()).toBe(0);
    await page.close();
  });
});
