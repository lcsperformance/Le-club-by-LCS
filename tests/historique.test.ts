import { describe, expect, it, vi } from "vitest";
import { extraireHistorique } from "@/lib/historique";

const lignes = [
  { date_test: "2026-11-16", allure_seuil_course: 270, ftp: 220, vitesse_critique_natation: 105, fc_seuil: 168 },
  { date_test: "2026-09-14", allure_seuil_course: 285, ftp: 205, vitesse_critique_natation: null, fc_seuil: 165 },
  { date_test: "2026-10-19", allure_seuil_course: 278, ftp: 212, vitesse_critique_natation: 108, fc_seuil: 167 },
];

describe("historique d'un sport", () => {
  it("classe par date, de la plus ancienne à la plus récente", () => {
    expect(extraireHistorique(lignes, "course")).toEqual([
      { date: "2026-09-14", valeur: 285 },
      { date: "2026-10-19", valeur: 278 },
      { date: "2026-11-16", valeur: 270 },
    ]);
  });

  it("suit la bonne mesure pour chaque sport", () => {
    expect(extraireHistorique(lignes, "velo").map((p) => p.valeur)).toEqual([205, 212, 220]);
    expect(extraireHistorique(lignes, "cardio").map((p) => p.valeur)).toEqual([165, 167, 168]);
  });

  it("ignore les dates où la valeur manque", () => {
    expect(extraireHistorique(lignes, "natation")).toEqual([
      { date: "2026-10-19", valeur: 108 },
      { date: "2026-11-16", valeur: 105 },
    ]);
  });

  it("renvoie une liste vide sans test", () => {
    expect(extraireHistorique([], "course")).toEqual([]);
  });
});

describe("lecture en base", () => {
  it("lit les tests du membre demandé, triés par date, pour la seule mesure du sport", async () => {
    const appels: string[] = [];
    const requete = {
      select: (c: string) => (appels.push(`select ${c}`), requete),
      eq: (c: string, v: string) => (appels.push(`eq ${c}=${v}`), requete),
      not: (c: string) => (appels.push(`not null ${c}`), requete),
      order: async (c: string, o: { ascending: boolean }) => {
        appels.push(`order ${c} ${o.ascending ? "croissant" : "décroissant"}`);
        return { data: [{ date_test: "2026-11-16", ftp: 220 }, { date_test: "2026-09-14", ftp: 205 }], error: null };
      },
    };
    vi.doMock("server-only", () => ({}));
    vi.doMock("@/lib/auth", () => ({ utilisateurConnecte: async () => ({ id: "moi" }) }));
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => requete }) }));
    const { historiqueSport } = await import("@/lib/historique-serveur");

    expect(await historiqueSport("velo", "athlete-42")).toEqual([
      { date: "2026-09-14", valeur: 205 },
      { date: "2026-11-16", valeur: 220 },
    ]);
    expect(appels).toEqual([
      "select date_test, ftp",
      "eq membre_id=athlete-42",
      "not null ftp",
      "order date_test croissant",
    ]);

    appels.length = 0;
    await historiqueSport("course");
    expect(appels).toContain("eq membre_id=moi");
  });
});
