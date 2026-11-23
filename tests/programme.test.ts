import { describe, expect, it } from "vitest";
import { cibleDuBloc, DEPART_FIL_ROUGE, formatDuree, lireSemaine, seancesDuJour, semaineDuProgramme } from "@/lib/programme";
import { organiserSaison, type Objectif } from "@/lib/saison";

const objectif = (bloc: Objectif["bloc"], date_objectif: string): Objectif => ({ id: date_objectif, bloc, date_objectif });

describe("semaine du programme suivie par le membre", () => {
  it("pendant un bloc : la semaine du bloc où il en est", () => {
    // Bloc M (12 semaines) pour une course le 14/02/2027 : il démarre le 22/11/2026.
    const saison = organiserSaison([objectif("M", "2027-02-14")], "2027-01-11");
    expect(semaineDuProgramme(saison, "2027-01-11", 4)).toEqual({ phase: "M", semaine: 8 });
  });

  it("hors bloc : le fil rouge, dont les semaines tournent en boucle à partir du lancement", () => {
    const fil = (lundi: string, n: number) => semaineDuProgramme(organiserSaison([], lundi), lundi, n).semaine;
    expect(DEPART_FIL_ROUGE).toBe("2026-12-28");
    expect(fil("2026-12-28", 4)).toBe(1);
    expect(fil("2027-01-04", 4)).toBe(2);
    expect(fil("2027-01-18", 4)).toBe(4);
    expect(fil("2027-01-25", 4)).toBe(1);
    // Avant le lancement (tests, aperçus) : la boucle continue à l'envers sans erreur.
    expect(fil("2026-12-21", 4)).toBe(4);
    // Une seule semaine écrite (ou aucune) : toujours la semaine 1.
    expect(fil("2027-03-01", 1)).toBe(1);
    expect(fil("2027-03-01", 0)).toBe(1);
  });

  it("une course à venir dont le bloc n'a pas commencé : encore le fil rouge", () => {
    const saison = organiserSaison([objectif("M", "2027-09-05")], "2027-01-11");
    expect(semaineDuProgramme(saison, "2027-01-11", 1)).toEqual({ phase: "fil_rouge", semaine: 1 });
  });
});

describe("durée d'une séance", () => {
  it("en minutes, puis en heures à la française", () => {
    expect(formatDuree(45)).toBe("45 min");
    expect(formatDuree(60)).toBe("1 h");
    expect(formatDuree(65)).toBe("1 h 05");
    expect(formatDuree(150)).toBe("2 h 30");
  });
});

describe("lecture des séances de la semaine", () => {
  const ligne = (jour: number, ordre: number, id: string, extra: object = {}) => ({
    jour,
    ordre,
    seances: {
      id,
      sport: "course",
      titre: `Séance ${id}`,
      duree_minutes: 50,
      blocs_seance: [
        { ordre: 2, libelle: "Footing", detail: "30 min", zone: 2 },
        { ordre: 1, libelle: "Échauffement", detail: null, zone: null },
      ],
      ...extra,
    },
  });

  it("classe par jour puis par ordre, et les blocs dans l'ordre", () => {
    const semaine = lireSemaine([ligne(3, 1, "c"), ligne(1, 2, "b"), ligne(1, 1, "a")]);
    expect(semaine.map((s) => s.seance.id)).toEqual(["a", "b", "c"]);
    expect(semaine[0].seance.blocs).toEqual([
      { libelle: "Échauffement", detail: "", zone: null },
      { libelle: "Footing", detail: "30 min", zone: 2 },
    ]);
    expect(seancesDuJour(semaine, 1).map((s) => s.id)).toEqual(["a", "b"]);
    expect(seancesDuJour(semaine, 2)).toEqual([]);
  });

  it("ignore les lignes incohérentes plutôt que de casser l'écran", () => {
    expect(lireSemaine(null)).toEqual([]);
    expect(lireSemaine([ligne(8, 1, "x"), ligne(1, 1, "y", { sport: "ski" }), { jour: 1, ordre: 1, seances: null }])).toEqual([]);
  });
});

describe("allure de chaque bloc", () => {
  const tests = { allure_seuil_course: 270, ftp: 220, vitesse_critique_natation: 105, fc_seuil: 168 };

  it("calcule l'allure et la FC de la zone à partir des tests", () => {
    const c = cibleDuBloc("course", 2, tests);
    expect(c.type).toBe("cible");
    if (c.type === "cible") {
      expect(c.cible).toMatch(/\/km$/);
      expect(c.frequenceCardiaque).toMatch(/^FC \d+–\d+ bpm$/);
    }
    const v = cibleDuBloc("velo", 3, tests);
    expect(v.type === "cible" && v.cible).toMatch(/ W$/);
  });

  it("verrouillée sans tests ; rien à afficher sans zone ou en renforcement", () => {
    expect(cibleDuBloc("course", 2, null)).toEqual({ type: "verrouillee" });
    expect(cibleDuBloc("velo", 2, { ...tests, ftp: null })).toEqual({ type: "verrouillee" });
    expect(cibleDuBloc("course", null, tests)).toEqual({ type: "sans-zone" });
    expect(cibleDuBloc("renfo", 2, tests)).toEqual({ type: "sans-zone" });
  });

  it("suit les zones personnalisées du membre", () => {
    const club = cibleDuBloc("velo", 2, tests);
    const perso = cibleDuBloc("velo", 2, tests, [50, 60, 80, 95, 110, 130]);
    expect(perso).not.toEqual(club);
    expect(perso.type === "cible" && perso.cible).toBe("132–176 W");
  });
});
