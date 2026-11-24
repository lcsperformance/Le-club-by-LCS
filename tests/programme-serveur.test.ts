/** Le serveur ne donne une séance qu'à un membre dont le programme (niveau et profil) la contient. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Faux Supabase : le rattachement existe seulement pour Challenger extensif.
const filtres: Record<string, unknown>[] = [];
function requete(table: string) {
  const f: Record<string, unknown> = { table };
  filtres.push(f);
  const r = {
    select: () => r,
    eq: (col: string, val: unknown) => ((f[col] = val), r),
    limit: () => r,
    maybeSingle: async () => {
      if (table === "programme") return { data: f.niveau === "challenger" && f.profil === "extensif" ? { id: "p1" } : null, error: null };
      return {
        data: { id: f.id, sport: "course", titre: "Footing", duree_minutes: 45, blocs_seance: [{ ordre: 1, libelle: "Footing", detail: "", zone: 2 }] },
        error: null,
      };
    },
  };
  return r;
}
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: requete }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: requete }) }));

const { lireSeanceProgramme } = await import("@/lib/programme-serveur");
const ID = "de000000-0000-0000-0000-000000000201";

beforeEach(() => {
  filtres.length = 0;
});

describe("séance ouverte par son adresse", () => {
  it("un membre ouvre une séance de son programme", async () => {
    expect(await lireSeanceProgramme(ID, { role: "membre", niveau: "challenger", profil: "extensif" })).toMatchObject({ titre: "Footing" });
  });

  it("une séance d'un autre niveau ou profil reste fermée", async () => {
    expect(await lireSeanceProgramme(ID, { role: "membre", niveau: "performer", profil: "extensif" })).toBeNull();
    expect(await lireSeanceProgramme(ID, { role: "membre", niveau: "challenger", profil: "intensif" })).toBeNull();
    expect(filtres.filter((f) => f.table === "seances")).toEqual([]);
  });

  it("sans niveau ni profil choisis : aucune séance", async () => {
    expect(await lireSeanceProgramme(ID, { role: "membre", niveau: null, profil: null })).toBeNull();
  });

  it("le coach et l'admin voient toutes les séances", async () => {
    for (const role of ["coach", "admin"] as const) {
      expect(await lireSeanceProgramme(ID, { role, niveau: null, profil: null })).toMatchObject({ titre: "Footing" });
    }
  });
});
