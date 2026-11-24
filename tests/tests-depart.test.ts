import { describe, expect, it } from "vitest";
import { dateDuJourParis } from "@/lib/dates";
import { pasSuivant } from "@/components/ui/Compteur";
import { facultativesFaites, formatMinSec, lireValeurs, MESURES, VALEURS_PAR_DEFAUT, valeursDeDepart } from "@/lib/tests-depart";

const mesure = (cle: string) => MESURES.find((m) => m.cle === cle)!;

function formulaire(v: Record<string, string>) {
  const f = new FormData();
  for (const [k, x] of Object.entries(v)) f.set(k, x);
  return f;
}
const valide = { allure_seuil_course: "270", ftp: "220", vitesse_critique_natation: "105", fc_seuil: "168" };

describe("affichage", () => {
  it("formate les allures en min:sec", () => {
    expect(formatMinSec(270)).toBe("4:30");
    expect(formatMinSec(105)).toBe("1:45");
    expect(formatMinSec(65)).toBe("1:05");
  });

  it("affiche les valeurs par défaut de la maquette", () => {
    expect(MESURES.map((m) => m.afficher(m.defaut))).toEqual(["4:30 /km", "220 W", "270 W", "1:45 /100 m", "168 bpm"]);
  });
});

describe("boutons − et +", () => {
  it("avancent du bon pas", () => {
    expect(pasSuivant(mesure("allure_seuil_course"), 270, 1)).toBe(275);
    expect(pasSuivant(mesure("ftp"), 220, -1)).toBe(215);
    expect(pasSuivant(mesure("vitesse_critique_natation"), 105, -1)).toBe(104);
    expect(pasSuivant(mesure("fc_seuil"), 168, 1)).toBe(169);
  });

  it("s'arrêtent aux limites", () => {
    expect(pasSuivant(mesure("ftp"), 450, 1)).toBe(450);
    expect(pasSuivant(mesure("allure_seuil_course"), 180, -1)).toBe(180);
  });
});

describe("valeurs de départ", () => {
  it("par défaut sans test précédent", () => {
    expect(valeursDeDepart(null)).toEqual(VALEURS_PAR_DEFAUT);
  });

  it("reprend le dernier test, et complète ce qui manque", () => {
    expect(valeursDeDepart({ ftp: 250, fc_seuil: null })).toEqual({ ...VALEURS_PAR_DEFAUT, ftp: 250 });
  });
});

describe("vérification côté serveur", () => {
  it("accepte des valeurs correctes", () => {
    expect(lireValeurs(formulaire(valide))).toEqual({
      valeurs: { allure_seuil_course: 270, ftp: 220, pma_5min: null, vitesse_critique_natation: 105, fc_seuil: 168 },
    });
  });

  it("la puissance max sur 5 min est facultative : enregistrée si elle est donnée", () => {
    const r = lireValeurs(formulaire({ ...valide, pma_5min: "265" }));
    expect("valeurs" in r && r.valeurs.pma_5min).toBe(265);
    const vide = lireValeurs(formulaire({ ...valide, pma_5min: "" }));
    expect("valeurs" in vide && vide.valeurs.pma_5min).toBeNull();
  });

  it("refuse une puissance max sur 5 min impossible", () => {
    const r = lireValeurs(formulaire({ ...valide, pma_5min: "5000" }));
    expect("erreur" in r && r.erreur).toMatch(/Vélo/);
  });

  it("les quatre mesures de la maquette restent obligatoires", () => {
    expect(MESURES.filter((m) => !m.facultative).map((m) => m.cle)).toEqual(["allure_seuil_course", "ftp", "vitesse_critique_natation", "fc_seuil"]);
  });

  it("coche d'avance le test facultatif s'il figurait au dernier test", () => {
    expect(facultativesFaites({ ftp: 220, pma_5min: 260 })).toEqual(["pma_5min"]);
    expect(facultativesFaites({ ftp: 220, pma_5min: null })).toEqual([]);
    expect(facultativesFaites(null)).toEqual([]);
  });

  it.each([
    ["ftp", "9999", /Vélo/],
    ["fc_seuil", "abc", /Cardio/],
    ["allure_seuil_course", "", /Course/],
    ["vitesse_critique_natation", "105.5", /Natation/],
  ])("refuse %s = %s", (cle, valeur, message) => {
    const r = lireValeurs(formulaire({ ...valide, [cle]: valeur }));
    expect("erreur" in r && r.erreur).toMatch(message);
  });
});

describe("date du jour", () => {
  it("suit l'heure de Paris, pas l'heure du serveur", () => {
    // 23 h 30 UTC le 31 décembre = 0 h 30 à Paris le 1er janvier.
    expect(dateDuJourParis(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    expect(dateDuJourParis(new Date("2027-07-01T21:59:00Z"))).toBe("2027-07-01");
  });
});
