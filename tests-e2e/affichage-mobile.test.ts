/**
 * Vérifie que chaque écran tient dans la largeur d'un téléphone,
 * sans déborder à droite (sinon le téléphone dézoome toute la page).
 * L'app compilée est démarrée par tests-e2e/serveur.ts (APERCU=1 pour les écrans à données fictives).
 */
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

const ECRANS = [
  "/connexion",
  "/mot-de-passe-oublie",
  "/auth/confirm?code=exemple",
  "/apercu-espace/admin",
  "/apercu-espace/coach",
  "/apercu-espace/admin-membres",
  "/apercu-membre/accueil",
  "/apercu-membre/accueil-tests-faits",
  "/apercu-membre/accueil-sans-prenom",
  "/apercu-membre/tests",
  "/apercu-membre/zones-course",
  "/apercu-membre/zones-velo",
  "/apercu-membre/zones-natation",
  "/apercu-membre/zones-personnalisation",
  "/apercu-membre/profil",
  "/apercu-membre/records",
  "/apercu-membre/progres",
  "/apercu-membre/abonnement-termine",
  "/apercu-membre/profil-annuel",
  "/apercu-membre/acces-coupe",
  "/apercu-membre/saison-vide",
  "/apercu-membre/saison",
  "/apercu-membre/saison-en-cours",
  "/apercu-membre/saison-calendrier",
  "/apercu-membre/semaine",
  "/apercu-membre/semaine-sans-objectif",
  "/bienvenue",
];

const LARGEURS = [320, 360, 390];

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

describe.each(LARGEURS)("téléphone de %i px de large", (largeur) => {
  it.each(ECRANS)("%s ne déborde pas", async (ecran) => {
    const page = await navigateur.newPage({ viewport: { width: largeur, height: 780 }, isMobile: true, hasTouch: true });
    try {
      // Attendre la fin du chargement (styles compris) : mesurer avant donnerait un faux débordement.
      const reponse = await page.goto(BASE + ecran, { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
      expect(reponse?.status(), "la page doit exister").toBeLessThan(400);
      expect(page.url(), "pas de redirection vers la connexion").toContain(ecran.split("?")[0]);
      await page.evaluate(() => document.fonts.ready);

      // Sur téléphone, une page trop large élargit toute la zone d'affichage (le téléphone dézoome) :
      // on compare donc la largeur réelle de la page à la largeur de l'écran simulé.
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
  });
});
