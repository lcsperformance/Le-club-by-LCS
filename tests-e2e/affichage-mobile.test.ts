/**
 * Vérifie que chaque écran tient dans la largeur d'un téléphone,
 * sans déborder à droite (sinon le téléphone dézoome toute la page).
 * Lance l'app compilée (`next start`) avec APERCU=1 pour les écrans avec données fictives.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PORT = 3210;
const BASE = `http://localhost:${PORT}`;

const ECRANS = [
  "/connexion",
  "/mot-de-passe-oublie",
  "/auth/confirm?code=exemple",
  "/apercu-espace/admin",
  "/apercu-espace/coach",
  "/apercu-membre/accueil",
  "/apercu-membre/accueil-tests-faits",
  "/apercu-membre/tests",
  "/apercu-membre/zones-course",
  "/apercu-membre/zones-velo",
  "/apercu-membre/zones-natation",
];

const LARGEURS = [320, 360, 390];

let serveur: ChildProcess;
let navigateur: Browser;

async function attendreServeur() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/connexion`);
      if (r.ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Le serveur Next.js n'a pas démarré (as-tu lancé `next build` ?)");
}

beforeAll(async () => {
  serveur = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: {
      ...process.env,
      APERCU: "1",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://exemple.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "cle-de-test",
    },
    stdio: "ignore",
  });
  await attendreServeur();
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
  serveur?.kill();
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
