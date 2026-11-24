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
  "/apercu-espace/coach-fiche",
  "/apercu-espace/coach-fiche-vide",
  "/apercu-espace/admin-membres",
  "/apercu-espace/admin-equipe",
  "/apercu-espace/admin-partenaires",
  "/apercu-espace/admin-questions",
  "/apercu-espace/admin-agenda",
  "/apercu-espace/admin-agenda-nouveau",
  "/apercu-espace/admin-agenda-modifier",
  "/apercu-espace/admin-agenda-a-confirmer",
  "/apercu-espace/admin-ressources",
  "/apercu-espace/admin-ressources-nouveau",
  "/apercu-espace/admin-ressources-video",
  "/apercu-espace/admin-ressources-pdf",
  "/apercu-espace/admin-ressources-themes",
  "/apercu-espace/admin-ressources-commentaires",
  "/apercu-membre/accueil",
  "/apercu-membre/bandeau-titre-long",
  "/apercu-membre/accueil-tests-faits",
  "/apercu-membre/accueil-sans-prenom",
  "/apercu-membre/accueil-seance-faite",
  "/apercu-membre/accueil-deux-seances",
  "/apercu-membre/accueil-repos",
  "/apercu-membre/accueil-a-venir",
  "/apercu-membre/accueil-installer-android",
  "/apercu-membre/accueil-installer-iphone",
  "/apercu-membre/accueil-notifications",
  "/apercu-membre/accueil-notifications-iphone",
  "/apercu-membre/tests",
  "/apercu-membre/tests-pma",
  "/apercu-membre/zones-course",
  "/apercu-membre/zones-velo",
  "/apercu-membre/zones-natation",
  "/apercu-membre/zones-cardio",
  "/apercu-membre/zones-cardio-personnalisation",
  "/apercu-membre/zones-personnalisation",
  "/apercu-membre/profil",
  "/apercu-membre/records",
  "/apercu-membre/progres",
  "/apercu-membre/progres-velo",
  "/apercu-membre/progres-un-test",
  "/apercu-membre/progres-sans-mesure",
  "/apercu-membre/progres-sans-test",
  "/apercu-membre/records-vide",
  "/apercu-membre/club",
  "/apercu-membre/club-canal",
  "/apercu-membre/club-canal-admin",
  "/apercu-membre/club-canal-vide",
  "/apercu-membre/club-annonces",
  "/apercu-membre/club-annonces-coach",
  "/apercu-membre/avantages",
  "/apercu-membre/avantages-vide",
  "/apercu-membre/calculateur",
  "/apercu-membre/calculateur-ouvrir",
  "/apercu-membre/club-questions",
  "/apercu-membre/club-questions-vide",
  "/apercu-membre/club-agenda",
  "/apercu-membre/club-agenda-vide",
  "/apercu-membre/ressources",
  "/apercu-membre/ressources-theme",
  "/apercu-membre/ressources-favoris",
  "/apercu-membre/ressources-favoris-vide",
  "/apercu-membre/ressources-video",
  "/apercu-membre/ressources-pdf",
  "/apercu-membre/ressources-pdf-bientot",
  "/apercu-membre/ressources-verrouille",
  "/apercu-membre/abonnement-termine",
  "/apercu-membre/profil-annuel",
  "/apercu-membre/acces-coupe",
  "/apercu-membre/saison-vide",
  "/apercu-membre/saison",
  "/apercu-membre/saison-en-cours",
  "/apercu-membre/saison-calendrier",
  "/apercu-membre/semaine",
  "/apercu-membre/semaine-sans-objectif",
  "/apercu-membre/semaine-tests-a-faire",
  "/apercu-membre/semaine-a-venir",
  "/apercu-membre/seance",
  "/apercu-membre/seance-verrouillee",
  "/apercu-membre/seance-renfo",
  "/apercu-membre/seance-faite",
  "/apercu-membre/seance-a-venir",
  "/apercu-membre/seance-ancienne",
  "/apercu-membre/semaine-passee",
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

// iPad (portrait et paysage) : l'espace membre reste centré, rien ne déborde.
const TABLETTES = [
  [768, 1024],
  [1024, 768],
] as const;
const ECRANS_TABLETTE = ECRANS.filter((e) => e.startsWith("/apercu-membre/")).slice(0, 12);

describe.each(TABLETTES)("iPad de %i × %i px", (largeur, hauteur) => {
  it.each(ECRANS_TABLETTE)("%s ne déborde pas", async (ecran) => {
    const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, isMobile: true, hasTouch: true });
    try {
      await page.goto(BASE + ecran, { waitUntil: "networkidle" });
      await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(largeur);
    } finally {
      await page.close();
    }
  });
});
