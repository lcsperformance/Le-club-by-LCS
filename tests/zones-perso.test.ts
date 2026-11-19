import { describe, expect, it } from "vitest";
import type { Bornes } from "@/lib/config-zones";
import { calculerZones, CONFIG_ZONES } from "@/lib/zones";
import { decalerDebut, limitesDebut, memesBornes, validerBornesPerso } from "@/lib/zones-perso";

const course = CONFIG_ZONES.course; // [65, 78, 88, 95, 102, 110]

describe("décaler le début d'une zone", () => {
  it("avance ou recule d'1 %", () => {
    expect(decalerDebut(course, 2, 1)).toEqual([65, 79, 88, 95, 102, 110]);
    expect(decalerDebut(course, 3, -1)).toEqual([65, 78, 87, 95, 102, 110]);
  });

  it("ne dépasse pas la zone suivante", () => {
    const b: Bornes = [65, 87, 88, 95, 102, 110];
    expect(limitesDebut(b, 2)).toEqual({ min: 66, max: 87 });
    expect(decalerDebut(b, 2, 1)).toBe(b);
  });

  it("ne passe pas sous la zone précédente", () => {
    const b: Bornes = [65, 66, 88, 95, 102, 110];
    expect(decalerDebut(b, 2, -1)).toBe(b);
  });

  it("le début de Z1 ne descend pas sous 30 %", () => {
    const b: Bornes = [30, 78, 88, 95, 102, 110];
    expect(decalerDebut(b, 1, -1)).toBe(b);
  });

  it("le début de Z5 reste sous la fin de Z5", () => {
    expect(limitesDebut(course, 5)).toEqual({ min: 96, max: 109 });
  });

  it("ne modifie jamais les bornes d'origine", () => {
    const copie = [...course];
    decalerDebut(course, 2, 1);
    expect(course).toEqual(copie);
  });
});

describe("cibles recalculées avec les bornes personnalisées", () => {
  it("le début de Z3 à 90 % change la fin de Z2 et le début de Z3", () => {
    const tests = { allure_seuil_course: 270, ftp: 220, vitesse_critique_natation: 105, fc_seuil: 168 };
    const perso: Bornes = [65, 78, 90, 95, 102, 110];
    const z = calculerZones("course", tests, CONFIG_ZONES, perso);
    expect(z[1].pourcentages).toBe("78 – 90 %");
    expect(z[2].pourcentages).toBe("90 – 95 %");
    // 270 × 100 / 90 = 300 s → 5:00
    expect(z[2].cible).toBe("4:44–5:00 /km");
    // La FC garde les valeurs du Club.
    expect(z[2].frequenceCardiaque).toBe(calculerZones("course", tests)[2].frequenceCardiaque);
  });
});

describe("vérification côté serveur", () => {
  it("accepte des bornes cohérentes", () => {
    expect(validerBornesPerso([60, 78, 88, 95, 102, 110], course)).toEqual([60, 78, 88, 95, 102, 110]);
  });

  it.each([
    ["des bornes qui ne montent pas", [65, 90, 88, 95, 102, 110]],
    ["une fin de Z5 modifiée", [65, 78, 88, 95, 102, 120]],
    ["un début sous 30 %", [25, 78, 88, 95, 102, 110]],
    ["un nombre à virgule", [65, 78.5, 88, 95, 102, 110]],
    ["5 bornes", [65, 78, 88, 95, 110]],
    ["du texte", "65,78,88,95,102,110"],
  ])("refuse %s", (_, valeur) => {
    expect(validerBornesPerso(valeur, course)).toBeNull();
  });

  it("reconnaît les valeurs du Club", () => {
    expect(memesBornes([...course], course)).toBe(true);
    expect(memesBornes(decalerDebut(course, 2, 1), course)).toBe(false);
  });
});

describe("bornes enregistrées quand le Club change sa configuration", () => {
  it("reprend la nouvelle fin de Z5 du Club", async () => {
    const { bornesPersoApplicables } = await import("@/lib/zones-perso");
    const club: Bornes = [65, 78, 88, 95, 102, 112];
    expect(bornesPersoApplicables([60, 78, 88, 95, 102, 110], club)).toEqual([60, 78, 88, 95, 102, 112]);
  });

  it("revient aux valeurs du Club si les bornes deviennent incohérentes", async () => {
    const { bornesPersoApplicables } = await import("@/lib/zones-perso");
    const club: Bornes = [65, 78, 88, 95, 102, 105];
    expect(bornesPersoApplicables([60, 78, 88, 95, 108, 110], club)).toBeNull();
    expect(bornesPersoApplicables(null, club)).toBeNull();
  });
});
