/** Actions serveur de « Ma saison » : vérifications avant toute écriture en base. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ajouterJours, OBJECTIFS_MAX } from "@/lib/saison";
import { dateDuJourParis } from "@/lib/dates";

const etat = vi.hoisted(() => ({
  connecte: true,
  acces: true,
  existants: [] as { bloc: string; date_objectif: string }[],
  ecritures: [] as string[],
  lignesModifiees: 1,
}));

vi.mock("@/lib/auth", () => ({
  utilisateurConnecte: async () => (etat.connecte ? { id: "membre-1", role: "membre" } : null),
  aAccesEspace: () => etat.acces,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: async () => ({ data: etat.existants, error: null }) }),
      insert: async (ligne: object) => {
        etat.ecritures.push(`ajout:${JSON.stringify(ligne)}`);
        return { error: null };
      },
      update: (v: object) => ({
        eq: () => ({
          eq: () => ({
            select: async () => {
              etat.ecritures.push(`date:${JSON.stringify(v)}`);
              return { data: Array(etat.lignesModifiees).fill({ id: "x" }), error: null };
            },
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          eq: async () => {
            etat.ecritures.push("suppression");
            return { error: null };
          },
        }),
      }),
    }),
  }),
}));

import { ajouterObjectif, changerDateObjectif, supprimerObjectif } from "@/app/(membre)/saison/actions";

const ID = "11111111-2222-3333-4444-555555555555";
const DANS_100_JOURS = ajouterJours(dateDuJourParis(), 100);

beforeEach(() => {
  Object.assign(etat, { connecte: true, acces: true, existants: [], ecritures: [], lignesModifiees: 1 });
});

describe("ajouter un objectif", () => {
  it("enregistre le bloc et la date pour le membre connecté", async () => {
    expect(await ajouterObjectif("M", DANS_100_JOURS)).toEqual({});
    expect(etat.ecritures).toEqual([`ajout:${JSON.stringify({ membre_id: "membre-1", bloc: "M", date_objectif: DANS_100_JOURS })}`]);
  });

  it.each([
    ["sans session", () => (etat.connecte = false), /session a expiré/],
    ["sans accès en cours", () => (etat.acces = false), /accès au Club/],
  ])("refusé %s", async (_, preparer, message) => {
    preparer();
    expect((await ajouterObjectif("M", DANS_100_JOURS)).erreur).toMatch(message);
    expect(etat.ecritures).toEqual([]);
  });

  it.each([
    ["un bloc inconnu", "XXL", DANS_100_JOURS, /S, M, L ou XL/],
    ["une date passée", "M", ajouterJours(dateDuJourParis(), -1), /à venir/],
    ["une date qui n'existe pas", "M", "2027-02-30", /valide/],
    ["une date trop lointaine", "M", ajouterJours(dateDuJourParis(), 365 * 4), /3 ans/],
  ])("refuse %s", async (_, bloc, date, message) => {
    expect((await ajouterObjectif(bloc, date)).erreur).toMatch(message);
    expect(etat.ecritures).toEqual([]);
  });

  it("le même objectif envoyé deux fois (double toucher) n'est enregistré qu'une fois", async () => {
    etat.existants = [{ bloc: "M", date_objectif: DANS_100_JOURS }];
    expect(await ajouterObjectif("M", DANS_100_JOURS)).toEqual({});
    expect(etat.ecritures).toEqual([]);
  });

  it(`au-delà de ${OBJECTIFS_MAX} objectifs, demande de faire du ménage`, async () => {
    etat.existants = Array.from({ length: OBJECTIFS_MAX }, (_, i) => ({ bloc: "S", date_objectif: `2026-01-${String(i + 1).padStart(2, "0")}` }));
    expect((await ajouterObjectif("M", DANS_100_JOURS)).erreur).toMatch(/supprime ceux qui sont terminés/);
    expect(etat.ecritures).toEqual([]);
  });
});

describe("changer la date", () => {
  it("met à jour la date de son objectif", async () => {
    expect(await changerDateObjectif(ID, DANS_100_JOURS)).toEqual({});
    expect(etat.ecritures).toEqual([`date:${JSON.stringify({ date_objectif: DANS_100_JOURS })}`]);
  });

  it("objectif d'un autre membre ou inexistant : introuvable", async () => {
    etat.lignesModifiees = 0;
    expect((await changerDateObjectif(ID, DANS_100_JOURS)).erreur).toMatch(/introuvable/);
  });

  it("refuse un identifiant mal formé ou une date passée, sans rien écrire", async () => {
    expect((await changerDateObjectif("1 or 1=1", DANS_100_JOURS)).erreur).toMatch(/introuvable/);
    expect((await changerDateObjectif(ID, "2020-01-01")).erreur).toMatch(/à venir/);
    expect(etat.ecritures).toEqual([]);
  });
});

describe("supprimer", () => {
  it("supprime son objectif", async () => {
    expect(await supprimerObjectif(ID)).toEqual({});
    expect(etat.ecritures).toEqual(["suppression"]);
  });

  it("refusé sans session ou avec un identifiant mal formé", async () => {
    expect((await supprimerObjectif("pas-un-id")).erreur).toMatch(/introuvable/);
    etat.connecte = false;
    expect((await supprimerObjectif(ID)).erreur).toMatch(/session/);
    expect(etat.ecritures).toEqual([]);
  });
});
