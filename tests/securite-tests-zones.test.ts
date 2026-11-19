/**
 * PREUVE : un membre ne peut ni lire ni modifier les tests et les bornes de zones d'un autre membre.
 *
 * Alice (A) essaie toutes les manières d'atteindre les données de Bruno (B) avec les mêmes
 * droits qu'un vrai membre connecté (rôle « authenticated » de Supabase, sécurité par ligne active).
 * Après chaque tentative, on relit les données de Bruno en contournant la sécurité (accès
 * administrateur) pour prouver qu'elles n'ont pas changé.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BRUNO = "00000000-0000-0000-0000-0000000000b2";

let base: BaseDeTest;
let empreinteBruno: string;
let idTestBruno: string;
let idZoneBruno: string;

/** Toutes les données de Bruno, lues sans la sécurité (vue « administrateur »). */
async function donneesDeBruno(): Promise<string> {
  const { rows } = await base.db.query(
    `select json_build_object(
       'tests', (select json_agg(t order by t.date_test) from tests t where t.membre_id = $1),
       'zones', (select json_agg(z order by z.sport) from zones z where z.membre_id = $1)
     ) as d`,
    [BRUNO],
  );
  return JSON.stringify(rows[0].d);
}

const alice = <T>(sql: string, params: unknown[] = []) => base.enTantQue<T>(ALICE, sql, params);

beforeAll(async () => {
  base = await creerBaseDeTest("securite");
  await base.db.query("insert into auth.users (id, email) values ($1, 'alice@club.fr'), ($2, 'bruno@club.fr')", [
    ALICE,
    BRUNO,
  ]);
  // Données de Bruno : deux séries de tests et des zones personnalisées.
  const t = await base.db.query(
    `insert into tests (membre_id, date_test, allure_seuil_course, ftp, vitesse_critique_natation, fc_seuil)
     values ($1, '2026-10-01', 280, 210, 110, 165), ($1, '2026-11-01', 272, 218, 106, 167) returning id`,
    [BRUNO],
  );
  idTestBruno = t.rows[0].id;
  const z = await base.db.query(
    `insert into zones (membre_id, sport, bornes) values
       ($1, 'course', '[62, 78, 88, 95, 102, 110]'), ($1, 'velo', '[45, 58, 76, 91, 106, 120]') returning id`,
    [BRUNO],
  );
  idZoneBruno = z.rows[0].id;
  // Données d'Alice : une série de tests et une zone.
  await base.db.query(
    `insert into tests (membre_id, date_test, ftp) values ($1, '2026-11-02', 250);
     insert into zones (membre_id, sport, bornes) values ($1, 'natation', '[80, 87, 93, 97, 102, 108]');`.replaceAll(
      "$1",
      `'${ALICE}'`,
    ),
  );
  empreinteBruno = await donneesDeBruno();
});

afterAll(async () => {
  await base?.fermer();
});

/** Après chaque attaque : les données de Bruno sont strictement identiques. */
async function brunoIntact() {
  expect(await donneesDeBruno()).toBe(empreinteBruno);
}

const TABLES = [
  {
    table: "tests",
    id: () => idTestBruno,
    modification: "ftp = 999",
    insertion: `insert into tests (membre_id, date_test, ftp) values ($1, '2026-11-01', 999)`,
    ecrasement: `insert into tests (membre_id, date_test, ftp) values ($1, '2026-11-01', 999)
                 on conflict (membre_id, date_test) do update set ftp = excluded.ftp`,
  },
  {
    table: "zones",
    id: () => idZoneBruno,
    modification: "bornes = '[30, 40, 50, 60, 70, 80]'",
    insertion: `insert into zones (membre_id, sport, bornes) values ($1, 'natation', '[80, 87, 93, 97, 102, 108]')`,
    ecrasement: `insert into zones (membre_id, sport, bornes) values ($1, 'course', '[30, 40, 50, 60, 70, 80]')
                 on conflict (membre_id, sport) do update set bornes = excluded.bornes`,
  },
] as const;

describe.each(TABLES)("table $table : Alice face aux données de Bruno", (cas) => {
  describe("lecture", () => {
    it("filtrer sur Bruno ne renvoie rien", async () => {
      expect(await alice(`select * from ${cas.table} where membre_id = $1`, [BRUNO])).toEqual([]);
    });

    it("tout lire ne renvoie que ses propres lignes", async () => {
      const lignes = await alice<{ membre_id: string }>(`select membre_id from ${cas.table}`);
      expect(lignes.length).toBeGreaterThan(0);
      expect(lignes.every((l) => l.membre_id === ALICE)).toBe(true);
    });

    it("même en connaissant l'identifiant exact d'une ligne de Bruno", async () => {
      expect(await alice(`select * from ${cas.table} where id = $1`, [cas.id()])).toEqual([]);
    });

    it("compter ses lignes ne révèle rien", async () => {
      const [r] = await alice<{ n: string }>(`select count(*) as n from ${cas.table} where membre_id = $1`, [BRUNO]);
      expect(r.n).toBe("0");
    });
  });

  describe("modification", () => {
    it("modifier les lignes de Bruno n'en touche aucune", async () => {
      const touchees = await alice(`update ${cas.table} set ${cas.modification} where membre_id = $1 returning id`, [
        BRUNO,
      ]);
      expect(touchees).toEqual([]);
      await brunoIntact();
    });

    it("même en visant l'identifiant exact", async () => {
      expect(await alice(`update ${cas.table} set ${cas.modification} where id = $1 returning id`, [cas.id()])).toEqual(
        [],
      );
      await brunoIntact();
    });

    it("transférer une de ses lignes à Bruno est refusé", async () => {
      await expect(alice(`update ${cas.table} set membre_id = $1 where membre_id = $2`, [BRUNO, ALICE])).rejects.toThrow(
        /row-level security/,
      );
      await brunoIntact();
    });
  });

  describe("suppression", () => {
    it("supprimer les lignes de Bruno n'en efface aucune", async () => {
      expect(await alice(`delete from ${cas.table} where membre_id = $1 returning id`, [BRUNO])).toEqual([]);
      await brunoIntact();
    });
  });

  describe("écriture au nom de Bruno", () => {
    it("créer une ligne au nom de Bruno est refusé", async () => {
      await expect(alice(cas.insertion, [BRUNO])).rejects.toThrow(/row-level security/);
      await brunoIntact();
    });

    it("écraser une ligne existante de Bruno (« upsert ») est refusé", async () => {
      await expect(alice(cas.ecrasement, [BRUNO])).rejects.toThrow(/row-level security/);
      await brunoIntact();
    });
  });

  it("un visiteur non connecté ne peut rien lire", async () => {
    await expect(base.enTantQue(null, `select * from ${cas.table}`)).rejects.toThrow(/permission denied/);
  });
});

describe("contre-épreuve", () => {
  it("Bruno, lui, voit toujours toutes ses données intactes", async () => {
    const tests = await base.enTantQue<{ ftp: number }>(BRUNO, "select ftp from tests order by date_test");
    const zones = await base.enTantQue<{ sport: string }>(BRUNO, "select sport from zones order by sport");
    expect(tests.map((t) => t.ftp)).toEqual([210, 218]);
    expect(zones.map((z) => z.sport).sort()).toEqual(["course", "velo"]);
  });

  it("Alice peut bien modifier ses propres données (la sécurité ne bloque pas tout)", async () => {
    const touchees = await alice("update tests set ftp = 255 where membre_id = $1 returning ftp", [ALICE]);
    expect(touchees).toEqual([{ ftp: 255 }]);
  });
});

describe("journal de l'admin (journal_admin) : Alice face aux lignes de Bruno", () => {
  beforeAll(async () => {
    await base.db.query("insert into journal_admin (membre_id, action, detail) values ($1, 'acces_offert', '01/01/2027')", [
      BRUNO,
    ]);
  });
  const lignesBruno = async () =>
    (await base.db.query("select action, detail from journal_admin where membre_id = $1", [BRUNO])).rows;

  it("lecture : ne voit rien, ni de Bruno ni d'elle-même", async () => {
    expect(await alice("select * from journal_admin")).toEqual([]);
    expect(await alice("select * from journal_admin where membre_id = $1", [BRUNO])).toEqual([]);
  });

  it("modification et suppression : refusées", async () => {
    await expect(alice("update journal_admin set detail = 'x' where membre_id = $1", [BRUNO])).rejects.toThrow(
      /permission denied/,
    );
    await expect(alice("delete from journal_admin where membre_id = $1", [BRUNO])).rejects.toThrow(/permission denied/);
    expect(await lignesBruno()).toEqual([{ action: "acces_offert", detail: "01/01/2027" }]);
  });

  it("écriture au nom de Bruno : refusée, directement comme par les fonctions de l'admin", async () => {
    await expect(
      alice("insert into journal_admin (membre_id, action) values ($1, 'acces_coupe')", [BRUNO]),
    ).rejects.toThrow(/permission denied/);
    await expect(alice("select admin_couper_acces($1, true)", [BRUNO])).rejects.toThrow(/administrateur/);
    expect(await lignesBruno()).toHaveLength(1);
  });
});
