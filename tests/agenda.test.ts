import { describe, expect, it } from "vitest";
import {
  depuisHeureDeParis,
  enHeureDeParis,
  evenementsDuMois,
  fichierIcs,
  joursEvenement,
  lireEvenement,
  nomFichierIcs,
  pastilleDate,
  prochaineFaq,
  quandEvenement,
  valeursFormulaire,
  type Evenement,
} from "@/lib/agenda";

const evt = (id: string, debut: string, fin: string | null = null, extra: Partial<Evenement> = {}): Evenement => ({
  id,
  titre: "FAQ en visio",
  type: "faq",
  debut,
  fin,
  lieu: null,
  lien: null,
  description: null,
  dates_a_confirmer: false,
  periode: null,
  ...extra,
});

describe("heure de Paris", () => {
  it("hiver (UTC+1) et été (UTC+2)", () => {
    expect(depuisHeureDeParis("2027-01-14", "19:30")).toBe("2027-01-14T18:30:00.000Z");
    expect(depuisHeureDeParis("2027-07-14", "19:30")).toBe("2027-07-14T17:30:00.000Z");
    expect(enHeureDeParis("2027-01-14T18:30:00.000Z")).toEqual({ date: "2027-01-14", heure: "19:30" });
  });

  it("jours de changement d'heure (28 mars et 31 octobre 2027)", () => {
    expect(depuisHeureDeParis("2027-03-28", "10:00")).toBe("2027-03-28T08:00:00.000Z"); // déjà en heure d'été
    expect(depuisHeureDeParis("2027-03-28", "01:30")).toBe("2027-03-28T00:30:00.000Z"); // encore en heure d'hiver
    expect(depuisHeureDeParis("2027-03-28", "02:30")).toBe("2027-03-28T01:30:00.000Z"); // heure qui n'existe pas
    expect(depuisHeureDeParis("2027-10-31", "10:00")).toBe("2027-10-31T09:00:00.000Z"); // retour à l'heure d'hiver
  });

  it("refuse une saisie incomplète ou fausse", () => {
    expect(depuisHeureDeParis("2027-01-14", "")).toBeNull();
    expect(depuisHeureDeParis("14/01/2027", "19:30")).toBeNull();
    expect(depuisHeureDeParis("2027-01-14", "25:00")).toBeNull();
  });
});

describe("affichage", () => {
  it("à la française", () => {
    expect(quandEvenement(evt("1", "2027-01-14T18:30:00Z", "2027-01-14T19:30:00Z"))).toBe("Jeudi 14 janvier · 19 h 30 – 20 h 30");
    expect(quandEvenement(evt("1", "2027-01-01T18:30:00Z"))).toBe("Vendredi 1er janvier · 19 h 30");
    expect(quandEvenement(evt("1", "2027-04-03T08:00:00Z", "2027-04-06T16:00:00Z"))).toBe("Du samedi 3 avril au mardi 6 avril");
    expect(quandEvenement(evt("1", "2027-04-01T08:00:00Z", null, { dates_a_confirmer: true, periode: "Printemps 2027" }))).toBe(
      "Printemps 2027 · dates à venir",
    );
  });

  it("pastille du jour, à Paris (23 h 30 UTC le 31 = 1er du mois suivant)", () => {
    expect(pastilleDate("2027-01-14T18:30:00Z")).toEqual({ jour: "14", mois: "janv." });
    expect(pastilleDate("2027-01-31T23:30:00Z")).toEqual({ jour: "1", mois: "févr." });
  });
});

describe("calendrier", () => {
  const liste = [
    evt("b", "2027-01-28T18:30:00Z", "2027-01-28T19:30:00Z"),
    evt("a", "2027-01-14T18:30:00Z", "2027-01-14T19:30:00Z"),
    evt("s", "2027-01-30T08:00:00Z", "2027-02-02T16:00:00Z", { type: "stage", titre: "Stage" }),
    evt("p", "2027-04-01T08:00:00Z", null, { dates_a_confirmer: true, periode: "Printemps" }),
  ];

  it("événements d'un mois, dans l'ordre, y compris ceux qui le traversent", () => {
    expect(evenementsDuMois(liste, "2027-01").map((e) => e.id)).toEqual(["a", "b", "s"]);
    expect(evenementsDuMois(liste, "2027-02").map((e) => e.id)).toEqual(["s"]);
    expect(evenementsDuMois(liste, "2027-04").map((e) => e.id)).toEqual(["p"]);
  });

  it("jours marqués : du début à la fin, aucun si les dates sont à confirmer", () => {
    expect(joursEvenement(liste[2])).toEqual(["2027-01-30", "2027-01-31", "2027-02-01", "2027-02-02"]);
    expect(joursEvenement(liste[3])).toEqual([]);
  });

  it("prochaine FAQ en visio, pas encore terminée", () => {
    expect(prochaineFaq(liste, new Date("2027-01-10T10:00:00Z"))?.id).toBe("a");
    expect(prochaineFaq(liste, new Date("2027-01-14T19:00:00Z"))?.id).toBe("a"); // en cours
    expect(prochaineFaq(liste, new Date("2027-01-15T10:00:00Z"))?.id).toBe("b");
    expect(prochaineFaq(liste, new Date("2027-02-01T10:00:00Z"))).toBeNull();
  });
});

describe("« Ajouter à mon agenda »", () => {
  it("fichier .ics aux heures exactes (UTC), titre et lieu échappés", () => {
    const ics = fichierIcs(
      evt("e1", "2027-01-14T18:30:00.000Z", "2027-01-14T19:30:00.000Z", { lieu: "Visio, lien dans # annonces", lien: "https://meet.exemple.fr/faq" }),
      new Date("2027-01-01T10:00:00.000Z"),
    );
    expect(ics).toContain("DTSTART:20270114T183000Z\r\n");
    expect(ics).toContain("DTEND:20270114T193000Z\r\n");
    expect(ics).toContain("SUMMARY:FAQ en visio · Le Club by LCS\r\n");
    expect(ics).toContain("LOCATION:Visio\\, lien dans # annonces\r\n");
    expect(ics).toContain("URL:https://meet.exemple.fr/faq\r\n");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("sans fin : une heure par défaut ; nom de fichier lisible", () => {
    expect(fichierIcs(evt("e2", "2027-01-14T18:30:00.000Z"), new Date())).toContain("DTEND:20270114T193000Z");
    expect(nomFichierIcs({ titre: "Webinaire : bien démarrer sa saison", debut: "2027-01-21T19:00:00Z" })).toBe(
      "webinaire-bien-demarrer-sa-saison-2027-01-21.ics",
    );
  });
});

describe("formulaire de l'admin", () => {
  const base = { titre: "FAQ en visio", type: "faq", date_debut: "2027-01-14", heure_debut: "19:30", heure_fin: "20:30" };

  it("heures de Paris converties ; champs vides = rien", () => {
    expect(lireEvenement(base)).toEqual({
      evenement: {
        titre: "FAQ en visio",
        type: "faq",
        debut: "2027-01-14T18:30:00.000Z",
        fin: "2027-01-14T19:30:00.000Z",
        lieu: null,
        lien: null,
        description: null,
        dates_a_confirmer: false,
        periode: null,
      },
    });
  });

  it("erreurs rattachées à leur champ", () => {
    expect(lireEvenement({ ...base, titre: "", type: "fete", heure_fin: "18:00", lien: "http://pas-sur.fr" })).toEqual({
      erreurs: {
        titre: "Le titre doit faire entre 1 et 80 caractères.",
        type: "Choisis le type d'événement.",
        fin: "La fin doit être après le début.",
        lien: "Le lien doit commencer par https:// (lien de la visio, page d'inscription…).",
      },
    });
    expect(lireEvenement({ ...base, date_debut: "" })).toHaveProperty("erreurs.debut");
  });

  it("dates à confirmer : une période et un jour approximatif suffisent", () => {
    const lu = lireEvenement({ titre: "Week-end vélo", type: "autre", date_debut: "2027-05-01", dates_a_confirmer: true, periode: "Mai 2027" });
    expect(lu).toMatchObject({ evenement: { dates_a_confirmer: true, periode: "Mai 2027", fin: null, debut: "2027-05-01T08:00:00.000Z" } });
    expect(lireEvenement({ ...base, dates_a_confirmer: true })).toHaveProperty("erreurs.periode");
  });

  it("le formulaire retrouve les heures de Paris d'un événement", () => {
    expect(valeursFormulaire(evt("1", "2027-07-14T17:30:00.000Z", "2027-07-14T18:30:00.000Z"))).toMatchObject({
      date_debut: "2027-07-14",
      heure_debut: "19:30",
      date_fin: "",
      heure_fin: "20:30",
    });
  });
});
