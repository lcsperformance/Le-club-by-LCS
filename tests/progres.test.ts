import { describe, expect, it } from "vitest";
import { CADRE, CADRE_LARGE, courbe, ecart, formatValeur, gainDepuisPremier, lignesHistorique, sportProgres } from "@/lib/progres";

const pts = (...valeurs: number[]) => valeurs.map((valeur, i) => ({ date: `2026-${String(i + 9).padStart(2, "0")}-14`, valeur }));

describe("Mes progrès : sport choisi", () => {
  it("course par défaut, cardio compris", () => {
    expect(sportProgres("cardio")).toBe("cardio");
    expect(sportProgres("ski")).toBe("course");
    expect(sportProgres(undefined)).toBe("course");
  });
});

describe("valeurs et écarts", () => {
  it("dans l'unité de chaque sport", () => {
    expect(formatValeur("course", 270)).toBe("4:30 /km");
    expect(formatValeur("natation", 105)).toBe("1:45 /100 m");
    expect(formatValeur("velo", 220)).toBe("220 W");
    expect(formatValeur("cardio", 168)).toBe("168 bpm");
  });

  it("écart avec le test précédent, signe réel de la valeur", () => {
    expect(ecart("course", 284, 279)).toBe("−5 s");
    expect(ecart("velo", 212, 220)).toBe("+8 W");
    expect(ecart("cardio", 168, 168)).toBe("=");
  });
});

describe("gain depuis le premier test", () => {
  it("allure : moins de secondes = plus vite", () => {
    expect(gainDepuisPremier("course", pts(292, 284, 270))).toEqual({ grand: "−22 s/km", sous: "plus vite sur ton allure seuil" });
    expect(gainDepuisPremier("natation", pts(100, 104))).toEqual({ grand: "+4 s/100 m", sous: "plus lent sur ta vitesse critique" });
    expect(gainDepuisPremier("course", pts(280, 280))?.grand).toBe("0 s/km");
  });

  it("puissance et FC", () => {
    expect(gainDepuisPremier("velo", pts(180, 220))).toEqual({ grand: "+40 W", sous: "sur ta puissance seuil (FTP)" });
    expect(gainDepuisPremier("cardio", pts(170, 167))).toEqual({ grand: "−3 bpm", sous: "sur ta FC seuil" });
  });

  it("un seul test : pas encore de gain", () => {
    expect(gainDepuisPremier("velo", pts(200))).toBeNull();
  });
});

describe("historique", () => {
  it("du plus récent au plus ancien, sans écart pour le premier test", () => {
    expect(lignesHistorique("velo", pts(180, 190))).toEqual([
      { date: "14/10/2026", valeur: "190 W", ecart: "+10 W" },
      { date: "14/09/2026", valeur: "180 W", ecart: null },
    ]);
  });
});

describe("courbe", () => {
  it("de gauche à droite, plus haut = meilleur", () => {
    const allure = courbe("course", pts(292, 270)).points;
    expect(allure[0].x).toBe(CADRE.gauche);
    expect(allure[1].x).toBe(CADRE.droite);
    expect(allure[1].y).toBeLessThan(allure[0].y); // plus rapide = plus haut
    const watts = courbe("velo", pts(180, 220)).points;
    expect(watts[1].y).toBeLessThan(watts[0].y); // plus de watts = plus haut
    for (const p of [...allure, ...watts]) {
      expect(p.y).toBeGreaterThanOrEqual(CADRE.haut);
      expect(p.y).toBeLessThanOrEqual(CADRE.bas);
    }
  });

  it("un seul point au centre ; le dernier point est mis en valeur", () => {
    const [p] = courbe("velo", pts(200)).points;
    expect(p).toMatchObject({ x: (CADRE.gauche + CADRE.droite) / 2, dernier: true, date: "14/09" });
    expect(courbe("velo", []).points).toEqual([]);
  });

  it("avec beaucoup de tests, seuls le premier et le dernier portent leur étiquette", () => {
    const c = courbe("velo", pts(1, 2, 3, 4, 5, 6));
    expect(c.points.map((p) => p.etiquette)).toEqual([true, false, false, false, false, true]);
    expect(c.ligne.split(" ")).toHaveLength(6);
    expect(c.aire).toMatch(/^M30,150 L.* L300,150 Z$/);
  });
});

describe("Mes progrès : courbe large (ordinateur)", () => {
  it("plus large que haute, et plus large que la courbe du téléphone", () => {
    expect(CADRE_LARGE.largeur / CADRE_LARGE.hauteur).toBeGreaterThan(CADRE.largeur / CADRE.hauteur);
  });

  it("mêmes règles que sur téléphone : plus haut = meilleur, points dans le cadre, étiquettes au-delà de 4 tests", () => {
    const valeurs = pts(292, 285, 288, 276, 270, 268);
    const petite = courbe("course", valeurs).points;
    const large = courbe("course", valeurs, CADRE_LARGE).points;
    expect(large.map((p) => p.etiquette)).toEqual(petite.map((p) => p.etiquette));
    expect(large.map((p) => p.valeur)).toEqual(petite.map((p) => p.valeur));
    // Même ordre vertical des points (le dessin est le même, seulement plus grand).
    const ordre = (ps: typeof large) => ps.map((p) => p.y).map((y, _, ys) => ys.filter((z) => z < y).length);
    expect(ordre(large)).toEqual(ordre(petite));
    for (const p of large) {
      expect(p.x).toBeGreaterThanOrEqual(CADRE_LARGE.gauche);
      expect(p.x).toBeLessThanOrEqual(CADRE_LARGE.droite);
      expect(p.y).toBeGreaterThanOrEqual(CADRE_LARGE.haut);
      expect(p.y).toBeLessThanOrEqual(CADRE_LARGE.bas);
    }
    expect(large.at(-1)!.y).toBeLessThan(large[0].y);
  });

  it("sans cadre, la courbe reste celle de la maquette", () => {
    expect(courbe("velo", pts(180, 220))).toEqual(courbe("velo", pts(180, 220), CADRE));
  });
});
