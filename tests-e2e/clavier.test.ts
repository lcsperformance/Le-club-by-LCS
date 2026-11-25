/**
 * Navigation au clavier : sur les écrans principaux, chaque élément atteint avec Tab est entouré
 * de façon visible (contour, ou bordure et halo des champs), sur téléphone et sur ordinateur.
 */
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

const ECRANS = [
  "/connexion",
  "/apercu-membre/accueil",
  "/apercu-membre/semaine",
  "/apercu-membre/seance-faite",
  "/apercu-membre/zones-course",
  "/apercu-membre/saison",
  "/apercu-membre/profil",
  "/apercu-membre/club-canal",
  "/apercu-membre/club-questions",
  "/apercu-membre/ressources",
  "/apercu-membre/ressources-video",
  "/apercu-membre/avantages",
  "/apercu-espace/admin-membres",
];
const TAILLES = [
  [390, 844],
  [1440, 900],
] as const;
/** Assez de Tab pour parcourir le haut de chaque écran (navigation comprise). */
const NOMBRE_DE_TAB = 25;

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

describe.each(TAILLES)("clavier à %i × %i px", (largeur, hauteur) => {
  it.each(ECRANS)("%s : l'élément actif est toujours visible", async (ecran) => {
    const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
    try {
      await page.goto(BASE + ecran, { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
      const sansContour: string[] = [];
      for (let i = 0; i < NOMBRE_DE_TAB; i++) {
        await page.keyboard.press("Tab");
        const etat = await page.evaluate(() => {
          const e = document.activeElement as HTMLElement | null;
          if (!e || e === document.body) return null;
          const s = getComputedStyle(e);
          const contour = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
          const halo = s.boxShadow !== "none" && /0px 0px 0px [1-9]/.test(s.boxShadow);
          const nom = `<${e.tagName.toLowerCase()}> « ${(e.getAttribute("aria-label") ?? e.textContent ?? "").trim().slice(0, 30)} »`;
          return { visible: contour || halo, nom };
        });
        if (etat && !etat.visible) sansContour.push(etat.nom);
      }
      expect([...new Set(sansContour)], "éléments atteints au clavier sans contour visible").toEqual([]);
    } finally {
      await page.close();
    }
  });
});
