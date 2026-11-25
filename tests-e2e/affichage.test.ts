/**
 * Vérifie que chaque écran tient dans la largeur de l'écran, sans déborder à droite
 * (sur téléphone, une page trop large fait dézoomer toute la page) : téléphones, iPad et ordinateurs.
 * L'app compilée est démarrée par tests-e2e/serveur.ts (APERCU=1 pour les écrans à données fictives).
 * Pour prouver qu'un changement ne touche pas au téléphone ni à l'iPad : npm run comparer-affichage.
 */
import { chromium, type Browser, type BrowserContextOptions } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ECRANS, ORDINATEURS, TABLETTES, TELEPHONES } from "./ecrans";
import { BASE } from "./serveur";

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

async function verifier(ecran: string, largeur: number, hauteur: number, options: BrowserContextOptions) {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, ...options });
  try {
    // Attendre la fin du chargement (styles compris) : mesurer avant donnerait un faux débordement.
    const reponse = await page.goto(BASE + ecran, { waitUntil: "networkidle" });
    await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
    expect(reponse?.status(), "la page doit exister").toBeLessThan(400);
    expect(page.url(), "pas de redirection vers la connexion").toContain(ecran.split("?")[0]);
    await page.evaluate(() => document.fonts.ready);

    // On compare la largeur réelle de la page à la largeur de l'écran simulé.
    const mesure = await page.evaluate((largeurEcran) => {
      const largeurPage = document.documentElement.scrollWidth;
      const fautifs = [...document.querySelectorAll("body *")]
        .filter((e) => e.getBoundingClientRect().right > largeurEcran + 1)
        .map((e) => `<${e.tagName.toLowerCase()}> « ${(e.textContent ?? "").trim().slice(0, 40)} »`);
      return { largeurPage, fautifs: largeurPage > largeurEcran ? fautifs.slice(0, 5) : [] };
    }, largeur);

    expect(mesure.largeurPage, `la page dépasse de l'écran ; en cause : ${mesure.fautifs.join(", ")}`).toBeLessThanOrEqual(
      largeur,
    );
  } finally {
    await page.close();
  }
}

const tactile = { isMobile: true, hasTouch: true };

describe.each(TELEPHONES)("téléphone de %i px de large", (largeur) => {
  it.each(ECRANS)("%s ne déborde pas", (ecran) => verifier(ecran, largeur, 780, tactile));
});

describe.each(TABLETTES)("iPad de %i × %i px", (largeur, hauteur) => {
  it.each(ECRANS)("%s ne déborde pas", (ecran) => verifier(ecran, largeur, hauteur, tactile));
});

describe.each(ORDINATEURS)("ordinateur de %i × %i px", (largeur, hauteur) => {
  it.each(ECRANS)("%s ne déborde pas", (ecran) => verifier(ecran, largeur, hauteur, {}));
});
