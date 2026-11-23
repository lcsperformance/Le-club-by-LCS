import { describe, expect, it } from "vitest";
import { dateSeance, filtrerAthletes, filtrerSeances, initialeAthlete, niveauRpe, nomAthlete, nomSport, objectifsAVenir, type AthleteCoach, type SeanceCoach } from "@/lib/coach";

const a = (id: string, prenom: string | null, nom: string | null, acces_en_cours = true): AthleteCoach => ({
  id,
  prenom,
  nom,
  niveau: "challenger",
  profil: "extensif",
  date_inscription: "2026-11-02T10:00:00Z",
  acces_en_cours,
});

describe("athlètes", () => {
  it("prénom et nom, ou ce qui est connu", () => {
    expect(nomAthlete(a("1", "Caroline", "Dupont"))).toBe("Caroline Dupont");
    expect(nomAthlete(a("1", "Hugo", null))).toBe("Hugo");
    expect(nomAthlete(a("1", null, null))).toBe("Athlète sans nom");
    expect(initialeAthlete(a("1", "élodie", "Moreau"))).toBe("É");
  });

  it("recherche par prénom ou nom, sans accents ni majuscules, par ordre alphabétique", () => {
    const liste = [a("1", "Léa", "Martin"), a("2", "Caroline", "Dupont"), a("3", "Thomas", "Bernard"), a("4", "Élodie", "Martin")];
    expect(filtrerAthletes(liste, "", false).map((x) => x.id)).toEqual(["2", "4", "1", "3"]);
    expect(filtrerAthletes(liste, "martin", false).map((x) => x.id)).toEqual(["4", "1"]);
    expect(filtrerAthletes(liste, "LEA mar", false).map((x) => x.id)).toEqual(["1"]);
    expect(filtrerAthletes(liste, "elodie", false).map((x) => x.id)).toEqual(["4"]);
  });

  it("seulement les accès en cours, sauf si on demande les anciens membres", () => {
    const liste = [a("1", "Caroline", "Dupont"), a("2", "Ancienne", "Membre", false)];
    expect(filtrerAthletes(liste, "", false).map((x) => x.id)).toEqual(["1"]);
    expect(filtrerAthletes(liste, "", true).map((x) => x.id)).toEqual(["2", "1"]);
  });
});

describe("séances", () => {
  const s = (date: string, douleur = false): SeanceCoach => ({ date, sport: "course", titre: "Footing", rpe: 5, douleur, commentaire: null });

  it("date courte à la française, avec l'année si ce n'est pas celle en cours", () => {
    expect(dateSeance("2027-01-10", "2027-01-11")).toBe("Dim. 10 janv.");
    expect(dateSeance("2026-11-15", "2027-01-11")).toBe("Dim. 15 nov. 2026");
  });

  it("RPE léger (1-4), moyen (5-7), fort (8-10)", () => {
    expect([1, 4, 5, 7, 8, 10].map(niveauRpe)).toEqual(["leger", "leger", "moyen", "moyen", "fort", "fort"]);
    expect(niveauRpe(null)).toBe("aucun");
  });

  it("toutes ou seulement les douleurs, de la plus récente à la plus ancienne", () => {
    const liste = [s("2027-01-05", true), s("2027-01-10"), s("2027-01-07", true)];
    expect(filtrerSeances(liste, "toutes").map((x) => x.date)).toEqual(["2027-01-10", "2027-01-07", "2027-01-05"]);
    expect(filtrerSeances(liste, "douleurs").map((x) => x.date)).toEqual(["2027-01-07", "2027-01-05"]);
  });

  it("nom du sport, ou un tiret pour une séance retirée", () => {
    expect(nomSport("velo")).toBe("Vélo");
    expect(nomSport(null)).toBe("—");
  });
});

describe("objectifs", () => {
  it("seulement ceux à venir, les plus proches d'abord, avec le nom de la course s'il existe", () => {
    expect(
      objectifsAVenir(
        [
          { id: "1", bloc: "L", date_objectif: "2027-05-30", nom: null },
          { id: "2", bloc: "M", date_objectif: "2027-02-14", nom: "Triathlon de Nice" },
          { id: "3", bloc: "S", date_objectif: "2026-12-20", nom: null },
        ],
        "2027-01-11",
      ),
    ).toEqual(["Triathlon de Nice · Bloc M · 14/02/2027", "Bloc L · 30/05/2027"]);
  });
});
