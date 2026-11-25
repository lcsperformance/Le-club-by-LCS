/**
 * Socle de la version ordinateur (à partir de 1100 px, src/lib/points-de-rupture.ts) :
 * rail d'onglets à gauche, contenu à sa droite et limité à --largeur-contenu, bandeau aligné
 * sur le contenu, fond Neon plein écran. À 1024 px (iPad en paysage), la barre reste en bas.
 */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ORDINATEURS } from "./ecrans";
import { BASE } from "./serveur";

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

async function ouvrir(ecran: string, largeur: number, hauteur: number): Promise<Page> {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
  await page.goto(BASE + ecran, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
  return page;
}

/** Position du rail, du contenu, du bandeau et du fond. */
const mesurer = (page: Page) =>
  page.evaluate(() => {
    const boite = (e: Element | null) => e?.getBoundingClientRect() ?? null;
    const contenu = [...document.querySelectorAll("main > *")].map((e) => e.getBoundingClientRect());
    const fond = [...document.querySelectorAll("div[aria-hidden]")].find(
      (e) => getComputedStyle(e).position === "fixed" && getComputedStyle(e).zIndex === "-1",
    );
    return {
      rail: boite(document.querySelector('nav[aria-label="Navigation principale"]')),
      contenuGauche: Math.min(...contenu.map((r) => r.left)),
      contenuDroite: Math.max(...contenu.map((r) => r.right)),
      bandeau: boite(document.querySelector('a[href="/club/agenda"]')),
      fond: boite(fond ?? null),
      ecran: { largeur: document.documentElement.clientWidth, hauteur: window.innerHeight },
    };
  });

describe.each(ORDINATEURS)("ordinateur de %i × %i px", (largeur, hauteur) => {
  it("rail à gauche, contenu à sa droite, bandeau aligné, fond plein écran", async () => {
    const page = await ouvrir("/apercu-membre/accueil", largeur, hauteur);
    try {
      const m = await mesurer(page);
      expect(m.rail, "le rail d'onglets est affiché").not.toBeNull();
      const rail = m.rail!;
      expect(rail.left, "rail collé à gauche").toBeLessThan(40);
      expect(rail.height, "rail vertical").toBeGreaterThan(rail.width);
      expect(m.contenuGauche, "le contenu commence après le rail").toBeGreaterThanOrEqual(rail.right + 16);
      expect(m.contenuDroite - m.contenuGauche, "contenu limité à 1100 px").toBeLessThanOrEqual(1100);
      expect(m.contenuDroite, "le contenu tient dans l'écran").toBeLessThanOrEqual(m.ecran.largeur);
      expect(m.bandeau!.left, "le bandeau ne passe pas sous le rail").toBeGreaterThanOrEqual(rail.right);
      expect(m.fond, "fond Neon présent").not.toBeNull();
      expect(m.fond!.width).toBeGreaterThanOrEqual(m.ecran.largeur);
      expect(m.fond!.height).toBeGreaterThanOrEqual(m.ecran.hauteur);
    } finally {
      await page.close();
    }
  });

  it("le contenu est centré dans l'espace à droite du rail", async () => {
    const page = await ouvrir("/apercu-membre/avantages", largeur, hauteur);
    try {
      const m = await mesurer(page);
      const debut = m.rail!.right;
      const gauche = m.contenuGauche - debut;
      const droite = m.ecran.largeur - m.contenuDroite;
      expect(Math.abs(gauche - droite), `marges ${gauche} / ${droite}`).toBeLessThanOrEqual(m.rail!.left + 2);
    } finally {
      await page.close();
    }
  });

  it("écran plein écran (tests) : pas de rail, contenu centré", async () => {
    const page = await ouvrir("/apercu-membre/tests", largeur, hauteur);
    try {
      const m = await mesurer(page);
      expect(m.rail).toBeNull();
      expect(Math.abs(m.contenuGauche - (m.ecran.largeur - m.contenuDroite))).toBeLessThanOrEqual(2);
    } finally {
      await page.close();
    }
  });
});

describe("iPad en paysage (1024 px)", () => {
  it("la barre d'onglets reste en bas", async () => {
    const page = await ouvrir("/apercu-membre/accueil", 1024, 768);
    try {
      const { rail } = await mesurer(page);
      expect(rail!.width).toBeGreaterThan(rail!.height);
      expect(rail!.bottom).toBeGreaterThan(700);
    } finally {
      await page.close();
    }
  });
});
