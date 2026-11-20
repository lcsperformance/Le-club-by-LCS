/** Espace admin « Membres » (aperçu, données fictives) : liste, recherche, gestion de l'accès. */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE } from "./serveur";

let navigateur: Browser;
let page: Page;

const cartes = () => page.getByRole("article");
const deborde = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

beforeAll(async () => {
  navigateur = await chromium.launch();
  page = await navigateur.newPage({ viewport: { width: 320, height: 700 } });
  await page.goto(`${BASE}/apercu-espace/admin-membres`, { waitUntil: "networkidle" });
});

afterAll(async () => {
  await navigateur?.close();
});

describe("liste des membres", () => {
  it("affiche chaque membre avec statut, accès, niveau et ancienneté", async () => {
    expect(await cartes().count()).toBe(6);
    const elodie = page.getByRole("article", { name: /Élodie/ });
    for (const texte of ["Paiement en échec", "Accès jusqu'au 20/01/2027", "Performer", "Membre depuis 1 an et 4 mois"]) {
      expect(await elodie.getByText(texte).isVisible(), texte).toBe(true);
    }
    expect(await page.getByRole("article", { name: /Léa/ }).getByText("Accès offert jusqu'au 30/06/2027").isVisible()).toBe(true);
    expect(await page.getByRole("article", { name: /Marc/ }).getByText("Accès coupé par l'admin").isVisible()).toBe(true);
    expect(await page.getByRole("article", { name: /ancien@/ }).getByText("Pas d'accès").isVisible()).toBe(true);
  });

  it("recherche par prénom (sans accent) ou par e-mail", async () => {
    const champ = page.getByLabel("Rechercher un membre");
    await champ.fill("elodie");
    expect(await cartes().count()).toBe(1);
    await champ.fill("ambassadeur@");
    expect(await cartes().count()).toBe(1);
    expect(await page.getByText("1 membre sur 6").isVisible()).toBe(true);
    await champ.fill("personne");
    expect(await page.getByText("Aucun membre ne correspond à ta recherche.").isVisible()).toBe(true);
    await champ.fill("");
    expect(await cartes().count()).toBe(6);
  });

  it("« Gérer l'accès » ouvre les actions et le journal, sans déborder sur un petit téléphone", async () => {
    const lea = page.getByRole("article", { name: /Léa/ });
    await lea.getByRole("button", { name: "Gérer l'accès" }).click();
    for (const nom of ["Ouvrir l'accès", "Retirer l'accès offert", "Couper l'accès", "Renvoyer l'e-mail d'accès"]) {
      expect(await lea.getByRole("button", { name: nom }).isVisible(), nom).toBe(true);
    }
    expect(await lea.getByText("Accès offert jusqu'au 30/06/2027", { exact: false }).count()).toBeGreaterThan(1);
    expect(await lea.getByText(/E-mail d'accès renvoyé \(Invitation\)/).isVisible()).toBe(true);
    expect(await deborde()).toBe(false);
  });

  it("le champ date reste dans la carte, au-dessus du bouton « Ouvrir l'accès », sans le recouvrir", async () => {
    const lea = page.getByRole("article", { name: /Léa/ });
    const champ = lea.getByLabel("Ouvrir l'accès jusqu'au");
    await champ.fill("2027-01-31");
    const bouton = lea.getByRole("button", { name: "Ouvrir l'accès", exact: true });
    expect(await bouton.isEnabled()).toBe(true);
    const [c, b, carte] = await Promise.all([champ.boundingBox(), bouton.boundingBox(), lea.boundingBox()]);
    expect(c!.x + c!.width).toBeLessThanOrEqual(carte!.x + carte!.width);
    expect(b!.y).toBeGreaterThanOrEqual(c!.y + c!.height);
    // Le doigt touche bien le bouton, à gauche comme au centre.
    for (const x of [b!.x + 4, b!.x + b!.width / 2]) {
      const touche = await page.evaluate(
        ([px, py]) => document.elementFromPoint(px, py)?.closest("button")?.textContent ?? null,
        [x, b!.y + b!.height / 2],
      );
      expect(touche).toBe("Ouvrir l'accès");
    }
  });

  it("le serveur refuse l'action sans session admin, même depuis l'écran", async () => {
    const marc = page.getByRole("article", { name: /Marc/ });
    await marc.getByRole("button", { name: "Gérer l'accès" }).click();
    page.once("dialog", (d) => void d.accept());
    await marc.getByRole("button", { name: "Rétablir l'accès" }).click();
    await marc.getByText("Action réservée à un administrateur.").waitFor();
    expect(await marc.getByText("Accès coupé par l'admin").isVisible()).toBe(true);
  });
});

describe("membre dont l'accès est coupé", () => {
  it("voit un message de suspension, sans bouton de paiement", async () => {
    const p = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(`${BASE}/apercu-membre/acces-coupe`, { waitUntil: "networkidle" });
    expect(await p.getByText(/Ton accès au Club a été suspendu/).isVisible()).toBe(true);
    expect(await p.getByRole("link", { name: /abonner/ }).count()).toBe(0);
    await p.close();
  });
});
