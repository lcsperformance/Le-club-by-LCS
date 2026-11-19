import { describe, expect, it } from "vitest";
import { formatDateFr, formatHeureFr } from "@/lib/dates";

describe("dates au format français, fuseau Europe/Paris", () => {
  it("formate une date", () => {
    expect(formatDateFr(new Date("2027-01-01T00:00:00+01:00"))).toBe("1 janvier 2027");
  });

  it("formate une heure à l'heure de Paris, même depuis un serveur en UTC", () => {
    expect(formatHeureFr(new Date("2027-01-01T13:30:00Z"))).toBe("14 h 30");
    expect(formatHeureFr(new Date("2027-07-01T13:30:00Z"))).toBe("15 h 30");
  });
});

describe("jour au format français", () => {
  it("affiche le jour de la semaine avec une majuscule", async () => {
    const { formatJourFr } = await import("@/lib/dates");
    expect(formatJourFr(new Date("2026-11-16T10:00:00Z"))).toBe("Lundi 16 novembre");
  });
});
