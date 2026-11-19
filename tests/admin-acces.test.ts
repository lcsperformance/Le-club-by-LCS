/**
 * Espace admin : ouvrir, couper un accès et noter le renvoi de l'e-mail d'accès.
 * Seul l'admin peut le faire ; un membre ou un coach est refusé par la base elle-même.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const MEMBRE = "00000000-0000-0000-0000-0000000000a1";
const AUTRE = "00000000-0000-0000-0000-0000000000b2";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const DANS_UN_MOIS = "now() + interval '30 days'";

let base: BaseDeTest;

const fiche = async (id: string) =>
  (
    await base.db.query<{ acces_offert_jusqua: Date | null; acces_coupe: boolean }>(
      "select acces_offert_jusqua, acces_coupe from membres where id = $1",
      [id],
    )
  ).rows[0];
const journal = async () =>
  (await base.db.query<{ membre_id: string; admin_id: string; action: string; detail: string | null }>(
    "select membre_id, admin_id, action, detail from journal_admin order by id",
  )).rows;

beforeAll(async () => {
  base = await creerBaseDeTest("admin_acces");
  await base.db.query(
    `insert into auth.users (id, email) values ($1, 'membre@club.fr'), ($2, 'autre@club.fr'),
       ($3, 'coach@club.fr'), ($4, 'admin@club.fr')`,
    [MEMBRE, AUTRE, COACH, ADMIN],
  );
  await base.db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
});

beforeEach(async () => {
  await base.db.query("delete from journal_admin");
  await base.db.query("update membres set acces_offert_jusqua = null, acces_coupe = false");
});

afterAll(async () => {
  await base?.fermer();
});

describe("l'admin gère les accès", () => {
  it("ouvre un accès jusqu'à une date, puis le retire, avec une trace dans le journal", async () => {
    await base.enTantQue(ADMIN, `select admin_offrir_acces($1, ${DANS_UN_MOIS})`, [MEMBRE]);
    expect((await fiche(MEMBRE)).acces_offert_jusqua).not.toBeNull();
    await base.enTantQue(ADMIN, "select admin_offrir_acces($1, null)", [MEMBRE]);
    expect((await fiche(MEMBRE)).acces_offert_jusqua).toBeNull();
    const j = await journal();
    expect(j.map((l) => l.action)).toEqual(["acces_offert", "acces_offert_retire"]);
    expect(j[0]).toMatchObject({ membre_id: MEMBRE, admin_id: ADMIN });
    expect(j[0].detail).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("coupe puis rétablit un accès", async () => {
    await base.enTantQue(ADMIN, "select admin_couper_acces($1, true)", [MEMBRE]);
    expect((await fiche(MEMBRE)).acces_coupe).toBe(true);
    await base.enTantQue(ADMIN, "select admin_couper_acces($1, false)", [MEMBRE]);
    expect((await fiche(MEMBRE)).acces_coupe).toBe(false);
    expect((await journal()).map((l) => l.action)).toEqual(["acces_coupe", "acces_retabli"]);
  });

  it("note le renvoi de l'e-mail d'accès", async () => {
    await base.enTantQue(ADMIN, "select admin_noter_email_acces($1, 'Invitation')", [MEMBRE]);
    expect(await journal()).toEqual([
      { membre_id: MEMBRE, admin_id: ADMIN, action: "email_acces_renvoye", detail: "Invitation" },
    ]);
  });

  it("lit le journal de tous les membres", async () => {
    await base.enTantQue(ADMIN, "select admin_couper_acces($1, true)", [MEMBRE]);
    await base.enTantQue(ADMIN, "select admin_couper_acces($1, true)", [AUTRE]);
    expect(await base.enTantQue(ADMIN, "select membre_id from journal_admin")).toHaveLength(2);
  });

  it("refuse une date passée", async () => {
    await expect(
      base.enTantQue(ADMIN, "select admin_offrir_acces($1, now() - interval '1 day')", [MEMBRE]),
    ).rejects.toThrow(/futur/);
  });

  it.each([COACH, ADMIN])("ne gère pas l'accès d'un compte de l'équipe (%s)", async (cible) => {
    await expect(base.enTantQue(ADMIN, "select admin_couper_acces($1, true)", [cible])).rejects.toThrow(
      /membre/,
    );
    expect((await fiche(cible)).acces_coupe).toBe(false);
  });
});

describe.each([
  ["un membre", MEMBRE],
  ["un coach", COACH],
])("%s est refusé", (_, qui) => {
  it.each([
    ["ouvrir un accès", `select admin_offrir_acces('${AUTRE}', ${DANS_UN_MOIS})`],
    ["s'ouvrir un accès à lui-même", `select admin_offrir_acces('${MEMBRE}', ${DANS_UN_MOIS})`],
    ["couper un accès", `select admin_couper_acces('${AUTRE}', true)`],
    ["rétablir son propre accès", `select admin_couper_acces('${MEMBRE}', false)`],
    ["noter un e-mail", `select admin_noter_email_acces('${AUTRE}', 'x')`],
  ])("%s", async (_, sql) => {
    await expect(base.enTantQue(qui, sql)).rejects.toThrow(/réservée à un administrateur/);
    expect(await journal()).toEqual([]);
    expect(await fiche(AUTRE)).toEqual({ acces_offert_jusqua: null, acces_coupe: false });
  });

  it("modifier directement les colonnes d'accès est interdit", async () => {
    await expect(base.enTantQue(qui, `update membres set acces_coupe = false where id = '${MEMBRE}'`)).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      base.enTantQue(qui, `update membres set acces_offert_jusqua = '2099-01-01' where id = '${MEMBRE}'`),
    ).rejects.toThrow(/permission denied/);
  });

  it("le journal est invisible et ne s'écrit pas directement", async () => {
    await base.enTantQue(ADMIN, "select admin_couper_acces($1, true)", [MEMBRE]);
    expect(await base.enTantQue(qui, "select * from journal_admin")).toEqual([]);
    await expect(
      base.enTantQue(qui, `insert into journal_admin (membre_id, action) values ('${AUTRE}', 'acces_retabli')`),
    ).rejects.toThrow(/permission denied/);
    await expect(base.enTantQue(qui, "delete from journal_admin")).rejects.toThrow(/permission denied/);
  });
});

it("un visiteur non connecté ne peut ni lire le journal ni appeler les fonctions", async () => {
  await expect(base.enTantQue(null, "select * from journal_admin")).rejects.toThrow(/permission denied/);
  await expect(base.enTantQue(null, `select admin_couper_acces('${MEMBRE}', true)`)).rejects.toThrow(
    /permission denied/,
  );
});

it("le membre lit l'état de son propre accès (sans pouvoir le changer)", async () => {
  await base.enTantQue(ADMIN, "select admin_couper_acces($1, true)", [MEMBRE]);
  expect(await base.enTantQue(MEMBRE, "select acces_coupe from membres where id = $1", [MEMBRE])).toEqual([
    { acces_coupe: true },
  ]);
});
