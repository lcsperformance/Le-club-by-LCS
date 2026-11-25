/**
 * Garde-fou de la version ordinateur : l'affichage ne change qu'à partir de 1100 px
 * (ordinateur) et de 1440 px (grand écran). En dessous, téléphone (320-390 px) et iPad
 * (768 et 1024 px) restent tels quels : aucune nouvelle règle selon la largeur de l'écran.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "src");

/** Seuls points de rupture permis (règles « à partir de »). */
const POINTS_DE_RUPTURE = [1100, 1440];

/** Règles plus anciennes que la version ordinateur, tolérées telles quelles (fichier → conditions). */
const ANCIENNES: Record<string, string[]> = {
  "components/legal/PageLegale.module.css": ["(max-width: 400px)"],
  "app/(espace)/coach/coach.module.css": ["(min-width: 900px)", "(max-width: 899px)"],
  "app/globals.css": ["print"],
};

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

const sansCommentaires = (texte: string) => texte.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

/** Conditions des @media d'un texte, telles qu'écrites. */
function conditionsMedia(texte: string): string[] {
  return [...sansCommentaires(texte).matchAll(/@media\s+([^{]+)\{/g)].map((m) => m[1].trim());
}

/** Une condition permise : « (min-width: 1100px) » ou « (min-width: 1440px) », seule. */
const permise = (condition: string) =>
  POINTS_DE_RUPTURE.some((p) => condition.replace(/\s+/g, " ") === `(min-width: ${p}px)`);

describe("points de rupture", () => {
  it("reconnaît les conditions permises et refuse les autres", () => {
    expect(conditionsMedia("@media (min-width: 1100px) { .a {} } @media (min-width:768px){}")).toEqual([
      "(min-width: 1100px)",
      "(min-width:768px)",
    ]);
    expect(permise("(min-width: 1100px)")).toBe(true);
    expect(permise("(min-width: 1440px)")).toBe(true);
    expect(permise("(min-width: 1024px)")).toBe(false);
    expect(permise("(max-width: 1099px)")).toBe(false);
    expect(permise("(min-width: 1100px) and (orientation: landscape)")).toBe(false);
  });

  it("les styles ne changent selon la largeur de l'écran qu'à 1100 et 1440 px", () => {
    const fautifs = fichiers(SRC)
      .filter((f) => /\.(css|tsx?)$/.test(f))
      .flatMap((f) => {
        const chemin = relative(SRC, f);
        const tolerees = ANCIENNES[chemin] ?? [];
        return conditionsMedia(readFileSync(f, "utf8"))
          .filter((c) => !permise(c) && !tolerees.includes(c))
          .map((c) => `${chemin} : @media ${c}`);
      });
    expect(fautifs).toEqual([]);
  });

  it("le code ne lit pas la largeur de l'écran (tout passe par le CSS)", () => {
    const fautifs = fichiers(SRC)
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => /matchMedia\s*\(\s*["'`][^"'`]*width|innerWidth/.test(sansCommentaires(readFileSync(f, "utf8"))))
      .map((f) => relative(SRC, f));
    expect(fautifs).toEqual([]);
  });
});
