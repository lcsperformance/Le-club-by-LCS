/** Écran Profil (aperçu) : choix du niveau et du profil, raccourcis vers Mes records et Mes progrès. */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

let navigateur: Browser;
let page: Page;

const presse = (nom: string) => page.getByRole("button", { name: nom }).getAttribute("aria-pressed");

beforeAll(async () => {
  navigateur = await chromium.launch();
  page = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
  // Aperçu : niveau Challenger et profil Extensif déjà choisis.
  await page.goto(`${BASE}/apercu-membre/profil`, { waitUntil: "networkidle" });
});

afterAll(async () => {
  await navigateur?.close();
});

describe("écran Profil : niveau et profil", () => {
  it("affiche les 3 niveaux et les 2 profils avec leurs textes", async () => {
    for (const n of ["Finisher", "Challenger", "Performer"]) expect(await page.getByRole("button", { name: n }).isVisible()).toBe(true);
    expect(await page.getByText("Tu encaisses bien le volume : le plan insiste sur l'endurance.").isVisible()).toBe(true);
    expect(await page.getByText("Tu réponds bien aux séances dures : le plan insiste sur l'intensité.").isVisible()).toBe(true);
  });

  it("montre les choix déjà faits", async () => {
    expect(await presse("Challenger")).toBe("true");
    expect(await presse("Finisher")).toBe("false");
    expect(await presse("Extensif Tu encaisses bien le volume : le plan insiste sur l'endurance.")).toBe("true");
  });

  it("toucher un autre niveau tente de l'enregistrer ; en cas d'échec (ici, pas de session), le choix précédent revient", async () => {
    await page.getByRole("button", { name: "Performer" }).click();
    const message = page.locator("p[role=alert]");
    await message.waitFor();
    expect(await message.textContent()).toMatch(/session a expiré/);
    expect(await presse("Challenger")).toBe("true");
    expect(await presse("Performer")).toBe("false");
  });
});

describe("écran Profil : raccourcis", () => {
  it("propose, dans l'ordre de la maquette, Ma saison, Mes records, Mes progrès, le Calculateur, Mes zones, Refaire mes tests", async () => {
    const liens = await page.$$eval("main a[href]", (as) =>
      as.map((a) => [a.textContent?.trim(), a.getAttribute("href")]).filter(([, h]) => h !== "/accueil"),
    );
    expect(liens).toEqual([
      ["Ma saison", "/saison"],
      ["Mes records", "/records"],
      ["Mes progrès", "/progres"],
      ["Calculateur LCS", "/ressources/calculateur"],
      ["Mes zones", "/zones"],
      ["Refaire mes tests", "/tests"],
    ]);
  });

  it("propose « Se déconnecter »", async () => {
    expect(await page.getByRole("button", { name: "Se déconnecter" }).isVisible()).toBe(true);
  });
});

describe("Mes records et Mes progrès (plus d'écran « bientôt »)", () => {
  it("le Profil y mène", async () => {
    expect(await page.getByRole("link", { name: "Mes records" }).getAttribute("href")).toBe("/records");
    expect(await page.getByRole("link", { name: "Mes progrès" }).getAttribute("href")).toBe("/progres");
  });

  it.each([
    ["records", "Mes records", "Profil", "/profil"],
    ["progres", "Mes progrès", "Mes zones", "/zones"],
  ])("%s affiche son titre et son retour, comme la maquette", async (ecran, titre, retour, href) => {
    const p = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BASE}/apercu-membre/${ecran}`, { waitUntil: "networkidle" });
    expect(await p.getByRole("heading", { level: 1 }).textContent()).toBe(titre);
    expect(await p.getByText("Bientôt disponible").count()).toBe(0);
    expect(await p.getByRole("link", { name: retour, exact: true }).getAttribute("href")).toBe(href);
    await p.close();
  });
});

describe("abonnement", () => {
  it("le Profil affiche la carte « Mon abonnement » et le bouton du portail Stripe", async () => {
    expect(await page.getByText("Le Club · 49 €/mois").isVisible()).toBe(true);
    expect(await page.getByText("Abonnement actif. Prochain prélèvement le 10 février 2027.").isVisible()).toBe(true);
    expect(await page.getByRole("button", { name: "Gérer mon abonnement" }).isVisible()).toBe(true);
    expect(
      await page
        .getByText("Envie de passer à l'année (499 €/an, 89 € d'économie) ? Choisis « Gérer mon abonnement ».")
        .isVisible(),
    ).toBe(true);
  });

  it("abonné à l'année : la carte affiche 499 €/an et comment repasser au mois", async () => {
    const p = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BASE}/apercu-membre/profil-annuel`, { waitUntil: "networkidle" });
    expect(await p.getByText("Le Club · 499 €/an").isVisible()).toBe(true);
    expect(await p.getByText(/le changement se fera à la fin de ton année/).isVisible()).toBe(true);
    await p.close();
  });

  it("abonnement terminé : page dédiée avec « Me réabonner » vers le lien de paiement (e-mail prérempli)", async () => {
    const p = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BASE}/apercu-membre/abonnement-termine`, { waitUntil: "networkidle" });
    expect(await p.getByText("Ton abonnement est terminé depuis le 1 janvier 2027.").isVisible()).toBe(true);
    const email = "?prefilled_email=prenom.nom-tres-long%40exemple-de-domaine.fr";
    expect(await p.getByRole("link", { name: "Me réabonner · 49 €/mois" }).getAttribute("href")).toBe(
      `https://buy.stripe.com/test_exemple${email}`,
    );
    expect(await p.getByRole("link", { name: "Me réabonner à l'année · 499 €/an" }).getAttribute("href")).toBe(
      `https://buy.stripe.com/test_annuel${email}`,
    );
    expect(await p.getByText("Soit 41,58 € par mois : 89 € d'économie sur l'année.").isVisible()).toBe(true);
    await p.close();
  });
});

describe("prénom", () => {
  it("l'accueil dit « Salut Caroline », ou « Salut ! » sans prénom", async () => {
    const p = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BASE}/apercu-membre/accueil`, { waitUntil: "networkidle" });
    expect(await p.getByRole("heading", { level: 1 }).textContent()).toBe("Salut Caroline");
    expect(await p.getByRole("link", { name: "Mon profil" }).textContent()).toBe("C");
    await p.goto(`${BASE}/apercu-membre/accueil-sans-prenom`, { waitUntil: "networkidle" });
    expect(await p.getByRole("heading", { level: 1 }).textContent()).toBe("Salut !");
    expect(await p.getByRole("link", { name: "Mon profil" }).textContent()).toBe("P");
    await p.close();
  });

  it("le Profil affiche le prénom et un champ pour le modifier", async () => {
    expect(await page.getByRole("heading", { level: 1 }).textContent()).toBe("Caroline");
    expect(await page.getByLabel("Prénom").inputValue()).toBe("Caroline");
  });

  it("une saisie invalide affiche un message, sans rien enregistrer", async () => {
    const champ = page.getByLabel("Prénom");
    await champ.fill("Caro123");
    await champ.press("Enter");
    await page.getByText("Seulement des lettres, espaces, tirets et apostrophes.").waitFor();
  });
});
