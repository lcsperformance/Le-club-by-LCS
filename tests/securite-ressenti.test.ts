/**
 * PREUVE : un membre ne peut pas lire le RPE, la douleur ni le commentaire d'un autre membre
 * (données de santé). Table attendue : ressentis (membre_id, seance_id, date_seance, rpe, douleur, commentaire).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BRUNO = "00000000-0000-0000-0000-0000000000b2";
const SEANCE = "de000000-0000-0000-0000-000000000201";

let base: BaseDeTest;
const alice = <T>(sql: string, params: unknown[] = []) => base.enTantQue<T>(ALICE, sql, params);

beforeAll(async () => {
  base = await creerBaseDeTest("ressenti");
  await base.db.query("insert into auth.users (id, email) values ($1, 'alice@club.fr'), ($2, 'bruno@club.fr')", [ALICE, BRUNO]);
  await base.db.query(
    `insert into ressentis (membre_id, seance_id, date_seance, rpe, douleur, commentaire)
     values ($1, $2, '2027-01-11', 8, true, 'Douleur au genou droit')`,
    [BRUNO, SEANCE],
  );
});

afterAll(async () => {
  await base?.fermer();
});

describe("ressenti de séance (RPE, douleur, commentaire)", () => {
  it("Alice ne voit aucune ligne de Bruno, même en la visant directement", async () => {
    expect(await alice("select * from ressentis")).toEqual([]);
    expect(await alice("select rpe, douleur, commentaire from ressentis where membre_id = $1", [BRUNO])).toEqual([]);
    expect(await alice("select count(*)::int as n from ressentis")).toEqual([{ n: 0 }]);
  });

  it("Alice ne peut pas deviner les valeurs de Bruno par un filtre", async () => {
    expect(await alice("select 1 from ressentis where rpe = 8 or douleur or commentaire ilike '%genou%'")).toEqual([]);
  });

  it("un visiteur non connecté n'a accès à rien", async () => {
    await expect(base.enTantQue(null, "select * from ressentis")).rejects.toThrow(/permission denied/);
  });
});
