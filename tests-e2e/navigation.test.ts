/**
 * Navigation de l'espace membre, écran par écran (tous les aperçus membre), à 1024, 1280 et 1440 px :
 * - 1024 px (encore l'affichage iPad) : barre d'onglets en bas, pas de menu latéral ;
 * - 1280 et 1440 px : menu latéral à gauche, pas de barre en bas, le contenu ne passe pas dessous ;
 * - écrans plein écran (/tests, /abonnement, conditions…) : ni barre ni menu ;
 * - l'onglet en cours est le bon.
 * L'attendu vient des règles de l'app (src/lib/onglets.ts), pas d'une liste recopiée.
 */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { barreVisible, cheminAffiche, ONGLETS, ongletActif, profilActif } from "../src/lib/onglets";
import { ECRANS, PETIT_ORDINATEUR } from "./ecrans";
import { BASE } from "./serveur";

const ECRANS_MEMBRE = ECRANS.filter((e) => e.startsWith("/apercu-membre/"));
const LARGEURS = [PETIT_ORDINATEUR, [1280, 800], [1440, 900]] as const;
const DEBUT_MENU = 1100;

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

/** Navigation visible (barre ou menu), sa position et l'onglet en cours. */
const lireNavigation = (page: Page) =>
  page.evaluate(() => {
    const visibles = [...document.querySelectorAll('nav[aria-label="Navigation principale"]')].filter(
      (e) => getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0,
    );
    const nav = visibles[0];
    const r = nav?.getBoundingClientRect();
    // Le contenu de la page, sans les fenêtres qui couvrent tout l'écran (voile fixe d'un calendrier…).
    const contenu = [...document.querySelectorAll("main > *")]
      .filter((e) => getComputedStyle(e).position !== "fixed")
      .map((e) => e.getBoundingClientRect())
      .filter((b) => b.width > 0);
    return {
      nombre: visibles.length,
      boite: r ? { gauche: r.left, droite: r.right, haut: r.top, bas: r.bottom, largeur: r.width, hauteur: r.height } : null,
      actif: nav?.querySelector('a[aria-current="page"]')?.getAttribute("href") ?? null,
      contenuGauche: contenu.length ? Math.min(...contenu.map((b) => b.left)) : null,
      hauteurEcran: window.innerHeight,
    };
  });

describe.each(LARGEURS)("navigation à %i × %i px", (largeur, hauteur) => {
  const menu = largeur >= DEBUT_MENU;

  it.each(ECRANS_MEMBRE)("%s", async (ecran) => {
    const chemin = cheminAffiche(ecran);
    const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
    try {
      await page.goto(BASE + ecran, { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
      const n = await lireNavigation(page);

      if (!barreVisible(chemin)) {
        expect(n.nombre, "écran plein écran : ni barre ni menu").toBe(0);
        return;
      }

      expect(n.nombre, "une seule navigation visible").toBe(1);
      const b = n.boite!;
      if (menu) {
        expect(b.hauteur, "menu latéral vertical").toBeGreaterThan(b.largeur);
        expect(b.gauche, "menu à gauche").toBeLessThan(40);
        expect(n.contenuGauche!, "le contenu ne passe pas sous le menu").toBeGreaterThanOrEqual(b.droite);
      } else {
        expect(b.largeur, "barre horizontale").toBeGreaterThan(b.hauteur);
        expect(b.bas, "barre en bas de l'écran").toBeGreaterThan(n.hauteurEcran - 120);
      }

      const onglet = ONGLETS.find((o) => o.cle === ongletActif(chemin))?.chemin ?? null;
      const attendu = onglet ?? (menu && profilActif(chemin) ? "/profil" : null);
      expect(n.actif, "onglet en cours").toBe(attendu);
    } finally {
      await page.close();
    }
  });
});
