import { describe, expect, it } from "vitest";
import configFichier from "../config/blocs.json";
import { validerConfigBlocs } from "@/lib/config-blocs";
import {
  BLOCS,
  ajouterJours,
  apercuBloc,
  debutBloc,
  decompte,
  dureeBloc,
  erreurDateCourse,
  estDateIso,
  formatIsoCourt,
  formatIsoLong,
  lireNomCourse,
  LONGUEUR_MAX_NOM,
  organiserSaison,
  phaseDuMoment,
  semainesBloc,
  statut,
  texteStatut,
  titreObjectif,
  type Objectif,
} from "@/lib/saison";

const M = semainesBloc("M");
const AUJ = "2027-01-11"; // un lundi

describe("fichier config/blocs.json", () => {
  it("est valide et donne une durée à chaque bloc", () => {
    const c = validerConfigBlocs(configFichier).blocs;
    for (const b of BLOCS) expect(c[b].semaines).toBeGreaterThan(0);
  });

  it("refuse une durée absente, décimale, en texte ou hors limites, et un bloc renommé", () => {
    const avec = (blocs: object) => () => validerConfigBlocs({ blocs: { ...configFichier.blocs, ...blocs } });
    expect(avec({ S: { semaines: "6", provisoire: true } })).toThrow(/bloc S.*entier/);
    expect(avec({ M: { semaines: 12.5, provisoire: false } })).toThrow(/bloc M/);
    expect(avec({ L: { semaines: 0, provisoire: false } })).toThrow(/bloc L/);
    expect(avec({ XL: { semaines: 53, provisoire: true } })).toThrow(/bloc XL/);
    expect(avec({ XL: { semaines: 20 } })).toThrow(/provisoire/);
    expect(avec({ XXL: { semaines: 24, provisoire: true } })).toThrow(/inconnu « XXL »/);
    expect(() => validerConfigBlocs({})).toThrow(/blocs/);
  });

  it("affiche la durée, avec la mention provisoire si besoin", () => {
    const { semaines, provisoire } = configFichier.blocs.S;
    expect(dureeBloc("S")).toBe(`${semaines} semaines${provisoire ? " (provisoire)" : ""}`);
  });
});

describe("dates", () => {
  it("vérifie et formate les dates du calendrier en français", () => {
    expect(estDateIso("2027-02-28")).toBe(true);
    expect(estDateIso("2027-02-29")).toBe(false);
    expect(estDateIso("30/05/2027")).toBe(false);
    expect(formatIsoCourt("2027-05-30")).toBe("30/05/2027");
    expect(formatIsoLong("2027-05-30")).toBe("dimanche 30 mai 2027");
  });

  it("compte les jours sans être gêné par le changement d'heure", () => {
    expect(ajouterJours("2027-03-27", 2)).toBe("2027-03-29");
    expect(ajouterJours("2027-01-01", -1)).toBe("2026-12-31");
  });
});

describe("début du bloc et statut", () => {
  it("le bloc commence sa durée en semaines avant la course", () => {
    expect(debutBloc("M", "2027-05-30")).toBe(ajouterJours("2027-05-30", -M * 7));
    for (const b of BLOCS) expect(debutBloc(b, "2027-10-10")).toBe(ajouterJours("2027-10-10", -semainesBloc(b) * 7));
  });

  it("avant le bloc : fil rouge, avec le décompte jusqu'à la course", () => {
    const course = ajouterJours(AUJ, M * 7 + 10);
    expect(statut("M", course, AUJ)).toEqual({ type: "a-venir", debut: ajouterJours(AUJ, 10), semaines: M, joursAvantCourse: M * 7 + 10 });
  });

  it("le premier jour du bloc est la semaine 1, puis une semaine tous les 7 jours", () => {
    const course = ajouterJours(AUJ, M * 7);
    expect(statut("M", course, AUJ)).toMatchObject({ type: "en-cours", semaine: 1 });
    expect(statut("M", course, ajouterJours(AUJ, 6))).toMatchObject({ semaine: 1 });
    expect(statut("M", course, ajouterJours(AUJ, 7))).toMatchObject({ semaine: 2 });
  });

  it("démarrage en cours de route : course dans 30 jours → semaine adaptée", () => {
    const course = ajouterJours(AUJ, 30);
    const s = statut("M", course, AUJ);
    expect(s).toMatchObject({ type: "en-cours", semaines: M, joursAvantCourse: 30 });
    // 30 jours avant la course : il reste la fin de la semaine M-4 puis 4 semaines pleines.
    expect(s.type === "en-cours" && s.semaine).toBe(M - 4);
    expect(apercuBloc("M", course, AUJ)).toBe(`Ton bloc démarre en cours de route : tu seras en semaine ${M - 4} sur ${M}.`);
  });

  it("le jour de la course compte encore (Jour J), le lendemain c'est terminé", () => {
    expect(statut("M", AUJ, AUJ)).toMatchObject({ type: "en-cours", semaine: M, joursAvantCourse: 0 });
    expect(decompte(0)).toBe("Jour J");
    expect(decompte(63)).toBe("J-63");
    expect(statut("M", ajouterJours(AUJ, -1), AUJ)).toEqual({ type: "passe" });
  });
});

describe("aperçu avant d'ajouter", () => {
  it("annonce le fil rouge puis le début du bloc, en dates françaises", () => {
    const course = "2027-05-30";
    const debut = debutBloc("M", course);
    expect(apercuBloc("M", course, AUJ)).toBe(
      `Tu suis le fil rouge jusqu'au ${formatIsoCourt(ajouterJours(debut, -1))}, puis ton bloc de ${M} semaines démarre le ${formatIsoCourt(debut)}.`,
    );
  });

  it("bloc qui commence pile aujourd'hui, ou qui a commencé il y a quelques jours", () => {
    expect(apercuBloc("M", ajouterJours(AUJ, M * 7), AUJ)).toBe(`Ton bloc de ${M} semaines démarre aujourd'hui.`);
    expect(apercuBloc("M", ajouterJours(AUJ, M * 7 - 3), AUJ)).toBe(
      `Ton bloc démarre en cours de route : tu seras en semaine 1 sur ${M}.`,
    );
  });

  it("date passée", () => {
    expect(apercuBloc("M", "2026-12-01", AUJ)).toBe("Choisis une date à venir.");
  });
});

describe("vérification de la date choisie", () => {
  it("accepte aujourd'hui et l'avenir proche", () => {
    expect(erreurDateCourse(AUJ, AUJ)).toBeNull();
    expect(erreurDateCourse("2027-05-30", AUJ)).toBeNull();
  });
  it("refuse le passé, le trop lointain et ce qui n'est pas une date", () => {
    expect(erreurDateCourse("2027-01-10", AUJ)).toMatch(/à venir/);
    expect(erreurDateCourse("2031-01-01", AUJ)).toMatch(/3 ans/);
    expect(erreurDateCourse("2027-13-01", AUJ)).toMatch(/valide/);
    expect(erreurDateCourse(42, AUJ)).toMatch(/valide/);
  });
});

describe("organisation de la saison", () => {
  const obj = (id: string, bloc: Objectif["bloc"], date: string): Objectif => ({ id, bloc, date_objectif: date });

  it("sans objectif : fil rouge, pas de décompte", () => {
    const s = organiserSaison([], AUJ);
    expect(s).toEqual({ objectifs: [], prochain: null, enCours: null });
    expect(phaseDuMoment(s)).toBe("Fil rouge");
  });

  it("classe les objectifs à venir par date, puis les terminés (le plus récent d'abord)", () => {
    const s = organiserSaison(
      [obj("b", "L", "2027-09-12"), obj("p1", "S", "2026-10-01"), obj("a", "M", "2027-05-30"), obj("p2", "S", "2026-12-20")],
      AUJ,
    );
    expect(s.objectifs.map((o) => o.id)).toEqual(["a", "b", "p2", "p1"]);
    expect(s.prochain?.id).toBe("a");
    expect(texteStatut(s.objectifs[3])).toBe("Terminé");
  });

  it("un bloc en cours donne la phase et le décompte", () => {
    const course = ajouterJours(AUJ, 20);
    const s = organiserSaison([obj("a", "M", course)], AUJ);
    expect(s.enCours?.id).toBe("a");
    expect(phaseDuMoment(s)).toBe(`Bloc M, semaine ${M - 2}/${M}`);
    expect(texteStatut(s.objectifs[0])).toBe(`Bloc en cours · semaine ${M - 2}/${M} · J-20`);
  });

  it("deux blocs qui se chevauchent : la course la plus proche mène, l'autre attend, les deux sont signalés", () => {
    const proche = ajouterJours(AUJ, 20);
    const loin = ajouterJours(AUJ, 30);
    const s = organiserSaison([obj("loin", "M", loin), obj("proche", "M", proche)], AUJ);
    const [a, b] = s.objectifs;
    expect([a.id, a.mene, b.id, b.mene]).toEqual(["proche", true, "loin", false]);
    expect(b.enAttenteDe).toBe(proche);
    expect(texteStatut(b)).toBe(`Bloc en attente : celui du ${formatIsoCourt(proche)} passe d'abord · J-30`);
    expect(a.chevauche).toEqual([loin]);
    expect(b.chevauche).toEqual([proche]);
  });

  it("des blocs qui se suivent sans se toucher ne sont pas signalés", () => {
    const premiere = "2027-03-01";
    const seconde = ajouterJours(premiere, M * 7 + 1);
    const s = organiserSaison([obj("a", "M", premiere), obj("b", "M", seconde)], AUJ);
    expect(s.objectifs.every((o) => o.chevauche.length === 0)).toBe(true);
  });

  it("une course passée ne compte plus dans les chevauchements", () => {
    const s = organiserSaison([obj("p", "XL", "2027-01-05"), obj("a", "S", "2027-01-20")], AUJ);
    expect(s.objectifs.find((o) => o.id === "a")?.chevauche).toEqual([]);
  });
});

describe("nom de la course (facultatif)", () => {
  it("nettoie les espaces ; vide ou absent = pas de nom", () => {
    expect(lireNomCourse("  Triathlon   de Nice ")).toEqual({ nom: "Triathlon de Nice" });
    expect(lireNomCourse("   ")).toEqual({ nom: null });
    expect(lireNomCourse(undefined)).toEqual({ nom: null });
    expect(lireNomCourse(null)).toEqual({ nom: null });
  });

  it("refuse un nom trop long ou qui n'est pas du texte", () => {
    expect(lireNomCourse("x".repeat(LONGUEUR_MAX_NOM))).toEqual({ nom: "x".repeat(LONGUEUR_MAX_NOM) });
    expect(lireNomCourse("x".repeat(LONGUEUR_MAX_NOM + 1))).toEqual({ erreur: `${LONGUEUR_MAX_NOM} caractères maximum pour le nom de ta course.` });
    expect(lireNomCourse(42)).toHaveProperty("erreur");
  });

  it("le titre est le nom choisi, sinon « Triathlon » et le bloc", () => {
    expect(titreObjectif({ bloc: "M", nom: "Triathlon de Nice" })).toBe("Triathlon de Nice");
    expect(titreObjectif({ bloc: "M", nom: null })).toBe("Triathlon M");
    expect(titreObjectif({ bloc: "XL" })).toBe("Triathlon XL");
  });
});
