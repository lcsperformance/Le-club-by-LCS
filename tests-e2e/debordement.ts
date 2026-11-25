/**
 * Vérification commune des tests d'affichage : un écran tient dans la largeur, sans déborder à droite
 * (sur téléphone, une page trop large fait dézoomer toute la page).
 * L'app compilée est démarrée par tests-e2e/serveur.ts (APERCU=1 pour les écrans à données fictives).
 */
import { chromium, type Browser, type BrowserContextOptions } from "playwright";
import { afterAll, beforeAll, expect } from "vitest";
import { BASE } from "./serveur";

let navigateur: Browser;

/** Ouvre un navigateur pour le fichier de tests qui appelle cette fonction. */
export function preparerNavigateur() {
  beforeAll(async () => {
    navigateur = await chromium.launch();
  });
  afterAll(async () => {
    await navigateur?.close();
  });
}

export const tactile: BrowserContextOptions = { isMobile: true, hasTouch: true };

export async function verifierDebordement(ecran: string, largeur: number, hauteur: number, options: BrowserContextOptions) {
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
