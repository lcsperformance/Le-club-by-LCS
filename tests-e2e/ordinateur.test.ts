/**
 * Version ordinateur (à partir de 1100 px, src/lib/points-de-rupture.ts) : menu latéral fixe à gauche
 * (logo, 5 onglets, profil ; onglet en cours en valeur), contenu à sa droite et limité à
 * --largeur-contenu, bandeau aligné sur le contenu, fond Neon plein écran.
 * À 1024 px (iPad en paysage), la barre d'onglets reste en bas.
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

/** Position du menu, du contenu, du bandeau et du fond. */
const mesurer = (page: Page) =>
  page.evaluate(() => {
    const boite = (e: Element | null) => e?.getBoundingClientRect() ?? null;
    const contenu = [...document.querySelectorAll("main > *")].map((e) => e.getBoundingClientRect());
    const fond = [...document.querySelectorAll("div[aria-hidden]")].find(
      (e) => getComputedStyle(e).position === "fixed" && getComputedStyle(e).zIndex === "-1",
    );
    return {
      rail: boite(
        [...document.querySelectorAll('nav[aria-label="Navigation principale"]')].find(
          (e) => getComputedStyle(e).display !== "none",
        ) ?? null,
      ),
      contenuGauche: Math.min(...contenu.map((r) => r.left)),
      contenuDroite: Math.max(...contenu.map((r) => r.right)),
      bandeau: boite(document.querySelector('a[href="/club/agenda"]')),
      fond: boite(fond ?? null),
      ecran: { largeur: document.documentElement.clientWidth, hauteur: window.innerHeight },
    };
  });

describe.each(ORDINATEURS)("ordinateur de %i × %i px", (largeur, hauteur) => {
  it("menu à gauche, contenu à sa droite, bandeau aligné, fond plein écran", async () => {
    const page = await ouvrir("/apercu-membre/accueil", largeur, hauteur);
    try {
      const m = await mesurer(page);
      expect(m.rail, "le menu latéral est affiché").not.toBeNull();
      const rail = m.rail!;
      expect(rail.left, "rail collé à gauche").toBeLessThan(40);
      expect(rail.height, "rail vertical").toBeGreaterThan(rail.width);
      expect(m.contenuGauche, "le contenu commence après le rail").toBeGreaterThanOrEqual(rail.right + 16);
      expect(m.contenuDroite - m.contenuGauche, "contenu limité à 1100 px").toBeLessThanOrEqual(1100);
      expect(m.contenuDroite, "le contenu tient dans l'écran").toBeLessThanOrEqual(m.ecran.largeur);
      expect(m.bandeau!.left, "le bandeau ne passe pas sous le menu").toBeGreaterThanOrEqual(rail.right);
      expect(m.fond, "fond Neon présent").not.toBeNull();
      expect(m.fond!.width).toBeGreaterThanOrEqual(m.ecran.largeur);
      expect(m.fond!.height).toBeGreaterThanOrEqual(m.ecran.hauteur);
    } finally {
      await page.close();
    }
  });

  it("le contenu est centré dans l'espace à droite du menu", async () => {
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

  it("écran plein écran (tests) : pas de menu, contenu centré", async () => {
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

/** Boîte d'un élément de la page. */
const boite = (page: Page, selecteur: string) =>
  page.locator(selecteur).first().evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { gauche: r.left, droite: r.right, haut: r.top, largeur: r.width };
  });

describe.each(ORDINATEURS)("écrans en deux colonnes à %i × %i px", (largeur, hauteur) => {
  it("accueil : cartes en grille de 2, en-tête sans débordement", async () => {
    const page = await ouvrir("/apercu-membre/accueil", largeur, hauteur);
    try {
      const grille = await page.evaluate(() => {
        const g = [...document.querySelectorAll("main *")].find(
          (e) => getComputedStyle(e).display === "grid" && getComputedStyle(e).gridTemplateColumns.split(" ").length === 2,
        );
        return [...(g?.children ?? [])].slice(0, 2).map((e) => e.getBoundingClientRect().toJSON() as DOMRect);
      });
      expect(grille, "une grille de 2 cartes").toHaveLength(2);
      expect(grille[0].top, "deux cartes sur la même ligne").toBe(grille[1].top);
      expect(grille[0].right).toBeLessThan(grille[1].left);
      const entete = await boite(page, "header");
      const contenu = await boite(page, 'section[aria-labelledby="etape-tests"]');
      expect(entete.gauche, "l'en-tête est aligné sur le contenu").toBe(contenu.gauche);
      expect(await page.locator("header").getByText("le club").isVisible(), "logo seulement dans le menu").toBe(false);
      expect(await page.locator("main header a[href='/profil']").isVisible(), "profil seulement dans le menu").toBe(false);
    } finally {
      await page.close();
    }
  });

  it("Ma semaine : les 7 jours à gauche, le jour choisi et ses séances à droite", async () => {
    const page = await ouvrir("/apercu-membre/semaine", largeur, hauteur);
    try {
      const jours = await boite(page, '[aria-label="Jours de la semaine"]');
      const titreJour = await boite(page, "main h2");
      expect(jours.droite).toBeLessThan(titreJour.gauche);
      const avant = await page.locator("main h2").first().innerText();
      await page.locator('[aria-label="Jours de la semaine"] button[aria-pressed="false"]').first().click();
      await expect.poll(() => page.locator("main h2").first().innerText()).not.toBe(avant);
    } finally {
      await page.close();
    }
  });

  it("Séance : les blocs à gauche, le suivi (RPE, ressenti) à droite", async () => {
    const page = await ouvrir("/apercu-membre/seance-faite", largeur, hauteur);
    try {
      const blocs = await boite(page, "main ol");
      const ressenti = await boite(page, 'section[aria-labelledby="titre-ressenti"]');
      expect(blocs.droite).toBeLessThan(ressenti.gauche);
      expect(ressenti.haut, "le suivi commence en haut de la page").toBeLessThan(blocs.haut + 200);
    } finally {
      await page.close();
    }
  });

  it("Séance sans suivi : une colonne de 720 px au plus", async () => {
    const page = await ouvrir("/apercu-membre/seance-verrouillee", largeur, hauteur);
    try {
      expect((await boite(page, "main ol")).largeur).toBeLessThanOrEqual(720);
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
