/** Application installable : fiche, icônes, écrans de démarrage, petit programme et page hors ligne. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import {
  carteInstallation,
  ECRANS_DEMARRAGE,
  ECRANS_IPAD,
  estAppareilApple,
  FICHIERS_HORS_LIGNE,
  imagesDemarrage,
} from "@/lib/installation";

const RACINE = join(__dirname, "..");
const lire = (chemin: string) => readFileSync(join(RACINE, chemin), "utf8");
const taillePng = (chemin: string) => {
  const b = readFileSync(join(RACINE, chemin));
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

describe("fiche de l'app", () => {
  const m = manifest();

  it("nom en français, plein écran, couleurs du Club, ouverture sur l'accueil", () => {
    expect(m).toMatchObject({
      name: "Le Club by LCS",
      short_name: "Le Club",
      lang: "fr",
      display: "standalone",
      start_url: "/accueil",
      background_color: "#090A0F",
      theme_color: "#090A0F",
    });
  });

  it("icônes 192 et 512 px présentes, dont une pour les icônes arrondies d'Android", () => {
    for (const icone of m.icons ?? []) {
      const [l, h] = taillePng(`public${icone.src}`);
      expect(`${l}x${h}`).toBe(icone.sizes);
    }
    expect(m.icons?.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("icônes de l'onglet et de l'écran d'accueil iPhone", () => {
    expect(taillePng("src/app/apple-icon.png")).toEqual([180, 180]);
    expect(existsSync(join(RACINE, "src/app/icon.png"))).toBe(true);
  });
});

describe("écrans de démarrage iPhone", () => {
  it("iPad : une image en portrait et une en paysage pour chaque écran", () => {
    const images = imagesDemarrage().slice(ECRANS_DEMARRAGE.length);
    expect(images).toHaveLength(ECRANS_IPAD.length * 2);
    for (const [i, [l, h, d]] of ECRANS_IPAD.entries()) {
      const [portrait, paysage] = [images[2 * i], images[2 * i + 1]];
      expect(taillePng(`public${portrait.url}`)).toEqual([l * d, h * d]);
      expect(taillePng(`public${paysage.url}`)).toEqual([h * d, l * d]);
      expect(portrait.media).toContain(`(device-width: ${l}px) and (device-height: ${h}px)`);
      expect(portrait.media).toContain("(orientation: portrait)");
      expect(paysage.media).toContain("(orientation: landscape)");
    }
    const script = lire("scripts/icones.mjs").replace(/\s/g, "");
    for (const [l, h, d] of ECRANS_IPAD) expect(script).toContain(`[${l},${h},${d}]`);
  });

  it("une image à la bonne taille pour chaque écran, réservée à cet écran", () => {
    const images = imagesDemarrage().slice(0, ECRANS_DEMARRAGE.length);
    for (const [i, [l, h, d]] of ECRANS_DEMARRAGE.entries()) {
      expect(taillePng(`public${images[i].url}`)).toEqual([l * d, h * d]);
      expect(images[i].media).toContain(`(device-width: ${l}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d})`);
    }
  });

  it("même liste d'écrans que le script qui fabrique les images", () => {
    const script = lire("scripts/icones.mjs").replace(/\s/g, "");
    for (const [l, h, d] of ECRANS_DEMARRAGE) expect(script).toContain(`[${l},${h},${d}]`);
  });
});

describe("petit programme de l'app (sw.js)", () => {
  const sw = lire("public/sw.js");

  it("ne garde que la page hors ligne et son icône", () => {
    expect(sw).toContain(`const FICHIERS = ${JSON.stringify(FICHIERS_HORS_LIGNE).replace(/,/g, ", ")};`);
    // Une seule mise en réserve, celle de ces fichiers : aucune page, aucune donnée.
    expect(sw.match(/\.put\(|\.add\(|\.addAll\(/g)).toEqual([".addAll("]);
    for (const fichier of FICHIERS_HORS_LIGNE) expect(existsSync(join(RACINE, "public", fichier))).toBe(true);
  });

  it("le réseau d'abord : la page hors ligne seulement si le réseau ne répond pas", () => {
    expect(sw).toMatch(/fetch\(demande\)\.catch\(\(\) => caches\.match\("\/hors-ligne\.html"\)\)/);
    expect(sw).toContain('demande.method !== "GET"');
  });

  it("le programme, la page hors ligne et la fiche échappent à la redirection vers la connexion", () => {
    const proxy = lire("src/proxy.ts");
    expect(proxy).toContain("sw\\\\.js");
    expect(proxy).toContain("hors-ligne\\\\.html");
    expect(proxy).toContain("webmanifest");
  });

  it("page hors ligne en français, autonome (rien chargé du réseau sauf l'icône gardée)", () => {
    const page = lire("public/hors-ligne.html");
    expect(page).toContain('<html lang="fr">');
    expect(page).toContain("Pas de connexion");
    expect(page).toContain("Réessayer");
    const adresses = [...page.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    expect(adresses).toEqual(["/icones/icone-192.png"]);
  });
});

describe("carte « Installer l'app »", () => {
  const base = { installee: false, fermee: false, apple: false, invitation: false };

  it("Android : bouton « Installer » dès que Chrome le propose", () => {
    expect(carteInstallation({ ...base, invitation: true })).toBe("android");
    expect(carteInstallation(base)).toBeNull(); // ordinateur, ou navigateur qui ne propose rien
  });

  it("iPhone : les gestes de Safari", () => {
    expect(carteInstallation({ ...base, apple: true })).toBe("iphone");
  });

  it("rien si l'app est déjà installée ou si le membre a fermé la carte", () => {
    expect(carteInstallation({ ...base, apple: true, installee: true })).toBeNull();
    expect(carteInstallation({ ...base, invitation: true, fermee: true })).toBeNull();
  });

  it("reconnaît l'iPhone et l'iPad (même présenté comme un Mac tactile)", () => {
    expect(estAppareilApple("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(true);
    expect(estAppareilApple("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
    expect(estAppareilApple("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
    expect(estAppareilApple("Mozilla/5.0 (Linux; Android 15; Pixel 9)")).toBe(false);
  });
});
