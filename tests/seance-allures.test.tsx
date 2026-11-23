/**
 * Allures affichées sur la page Séance : un bloc en zone 3 montre la cible calculée
 * à partir des tests du membre (pourcentages de config/zones.json).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Les actions serveur (enregistrement du ressenti) ne servent pas ici.
vi.mock("@/app/(membre)/seance/actions", () => ({ marquerSeance: vi.fn(), enregistrerRessenti: vi.fn() }));

import { EcranSeance } from "@/app/(membre)/seance/[id]/EcranSeance";
import { cibleDuBloc, type Seance } from "@/lib/programme";

const TESTS = { allure_seuil_course: 4 * 60 + 30, ftp: 220, vitesse_critique_natation: null, fc_seuil: null };

const seance = (sport: Seance["sport"]): Seance => ({
  id: "00000000-0000-0000-0000-000000000301",
  sport,
  titre: "Tempo",
  dureeMinutes: 60,
  blocs: [{ libelle: "Corps de séance", detail: "3 × 10 min", zone: 3 }],
});

describe("bloc en zone 3", () => {
  it("course, seuil à 4:30 /km : entre 4:44 et 5:07 /km", () => {
    expect(cibleDuBloc("course", 3, TESTS)).toEqual({ type: "cible", cible: "4:44–5:07 /km", frequenceCardiaque: null });
    const html = renderToStaticMarkup(<EcranSeance seance={seance("course")} tests={TESTS} />);
    expect(html).toContain("4:44–5:07 /km");
  });

  it("vélo, FTP de 220 W : entre 167 et 200 W", () => {
    expect(cibleDuBloc("velo", 3, TESTS)).toEqual({ type: "cible", cible: "167–200 W", frequenceCardiaque: null });
    const html = renderToStaticMarkup(<EcranSeance seance={seance("velo")} tests={TESTS} />);
    expect(html).toContain("167–200 W");
  });
});
