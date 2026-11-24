import { describe, expect, it } from "vitest";
import { prochainEvenement, quandCourt, type Evenement } from "@/lib/agenda";

const ev = (id: string, debut: string, fin: string | null, autres: Partial<Evenement> = {}): Evenement => ({
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
  ...autres,
});

// Lundi 11 janvier 2027, 10 h à Paris (9 h UTC).
const maintenant = new Date("2027-01-11T09:00:00Z");

describe("prochain événement du bandeau", () => {
  const passe = ev("a", "2027-01-04T18:30:00Z", "2027-01-04T19:30:00Z");
  const faq = ev("b", "2027-01-14T18:30:00Z", "2027-01-14T19:30:00Z");
  const webinaire = ev("c", "2027-01-12T19:00:00Z", null, { type: "webinaire", titre: "Bien démarrer" });
  const aConfirmer = ev("d", "2027-01-11T12:00:00Z", null, { type: "stage", dates_a_confirmer: true, periode: "Printemps" });

  it("le plus proche à venir, quel que soit son type, sans ceux aux dates à confirmer ni les passés", () => {
    expect(prochainEvenement([faq, passe, aConfirmer, webinaire], maintenant)?.id).toBe("c");
    expect(prochainEvenement([faq, passe], maintenant)?.id).toBe("b");
  });

  it("un événement en cours reste affiché jusqu'à sa fin", () => {
    const enCours = ev("e", "2027-01-11T08:30:00Z", "2027-01-11T09:30:00Z");
    expect(prochainEvenement([faq, enCours], maintenant)?.id).toBe("e");
  });

  it("rien s'il n'y a plus d'événement daté", () => {
    expect(prochainEvenement([passe, aConfirmer], maintenant)).toBeNull();
  });
});

describe("quand, en peu de mots (heure de Paris)", () => {
  it("aujourd'hui, demain, puis le jour en abrégé", () => {
    expect(quandCourt({ debut: "2027-01-11T18:30:00Z", fin: null }, maintenant)).toBe("Aujourd'hui · 19 h 30");
    expect(quandCourt({ debut: "2027-01-12T18:30:00Z", fin: null }, maintenant)).toBe("Demain · 19 h 30");
    expect(quandCourt({ debut: "2027-01-14T18:00:00Z", fin: null }, maintenant)).toBe("Jeu. 14 janv. · 19 h 00");
  });

  it("en ce moment pendant l'événement", () => {
    expect(quandCourt({ debut: "2027-01-11T08:30:00Z", fin: "2027-01-11T09:30:00Z" }, maintenant)).toBe("En ce moment");
  });

  it("tard le soir, « demain » suit la date de Paris, pas celle du serveur", () => {
    // 23 h 30 à Paris le 11 (22 h 30 UTC) : une FAQ le 12 à 19 h 30 est « demain ».
    expect(quandCourt({ debut: "2027-01-12T18:30:00Z", fin: null }, new Date("2027-01-11T22:30:00Z"))).toBe("Demain · 19 h 30");
  });
});
