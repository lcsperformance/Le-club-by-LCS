/**
 * Garde-fou : les polices sont déclarées à un seul endroit (src/app/polices.ts)
 * et utilisées partout ailleurs via les variables CSS.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

describe("polices", () => {
  it("polices.ts déclare --police-titre et --police-texte", () => {
    const polices = lire("app/polices.ts");
    expect(polices).toContain('variable: "--police-titre"');
    expect(polices).toContain('variable: "--police-texte"');
    expect(polices).toContain('axes: ["wdth"]');
  });

  it("le layout applique les variables sur <html>", () => {
    expect(lire("app/layout.tsx")).toContain("className={classesPolices}");
  });

  it("globals.css utilise les variables et règle le style des titres", () => {
    const css = lire("app/globals.css");
    expect(css).toContain("--titre-graisse: 800;");
    expect(css).toContain("--titre-largeur: 125%;");
    expect(css).toContain("--titre-casse: uppercase;");
    expect(css).toMatch(/font-family: var\(--police-texte\)/);
    expect(css).toMatch(/font-family: var\(--police-titre\)/);
  });

  it("aucun autre fichier ne charge ou ne nomme une police directement", () => {
    const fautifs = fichiers(SRC)
      .filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith("polices.ts"))
      .filter((f) => {
        // Les commentaires peuvent parler des polices ; seul le code compte.
        const contenu = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
        return /next\/font|["']?(Archivo|Inter|Tussilago)["']?\s*[,;)]|font-stretch:\s*\d|fontStretch/.test(contenu);
      })
      .map((f) => relative(SRC, f));
    expect(fautifs).toEqual([]);
  });
});
