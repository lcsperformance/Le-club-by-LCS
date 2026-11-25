/**
 * Garde-fou : chaque aperçu déclaré dans les pages d'aperçu est vérifié dans un navigateur
 * (liste tests-e2e/ecrans.ts : débordement sur téléphone, iPad et ordinateur, navigation).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ECRANS } from "../tests-e2e/ecrans";

const RACINE = join(__dirname, "..");

function apercusDeclares(fichier: string, prefixe: string): string[] {
  const source = readFileSync(join(RACINE, fichier), "utf8");
  const noms = [...source.matchAll(/case "([a-z0-9-]+)"/g), ...source.matchAll(/ecran === "([a-z0-9-]+)"/g)].map((m) => m[1]);
  return [...new Set(noms)].map((n) => prefixe + n);
}

describe("aperçus testés dans le navigateur", () => {
  it.each([
    ["src/app/(membre)/apercu-membre/[ecran]/page.tsx", "/apercu-membre/"],
    ["src/app/(espace)/apercu-espace/[ecran]/page.tsx", "/apercu-espace/"],
  ])("%s : chaque aperçu est dans tests-e2e/ecrans.ts", (fichier, prefixe) => {
    const declares = apercusDeclares(fichier, prefixe);
    expect(declares.length).toBeGreaterThan(10);
    expect(declares.filter((e) => !(ECRANS as readonly string[]).includes(e))).toEqual([]);
  });
});
