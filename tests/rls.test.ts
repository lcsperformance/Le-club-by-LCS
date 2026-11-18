/**
 * Vérifie la sécurité par ligne sur une vraie base PostgreSQL locale.
 * Variable TEST_DATABASE_URL (défaut : postgres://postgres:postgres@localhost:5432/postgres).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ADMIN_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
const DB = `club_test_${process.pid}`;
const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

let admin: Client;
let db: Client;

/** Exécute une requête en tant que membre connecté (rôle authenticated). */
async function enTantQue<T>(uid: string | null, sql: string, params: unknown[] = []) {
  await db.query("begin");
  try {
    await db.query(uid ? "set local role authenticated" : "set local role anon");
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid ?? ""]);
    const res = await db.query(sql, params);
    await db.query("commit");
    return res.rows as T[];
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

beforeAll(async () => {
  admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${DB}`);
  const url = new URL(ADMIN_URL);
  url.pathname = `/${DB}`;
  db = new Client({ connectionString: url.toString() });
  await db.connect();

  await db.query(readFileSync(join(__dirname, "supabase-shim.sql"), "utf8"));
  const dir = join(__dirname, "..", "supabase", "migrations");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.query(readFileSync(join(dir, f), "utf8"));
  }

  await db.query("insert into auth.users (id, email) values ($1, 'a@club.fr'), ($2, 'b@club.fr')", [A, B]);
  await db.query(
    `insert into public.tests (membre_id, date_test, ftp) values ($1, '2026-11-01', 250), ($2, '2026-11-02', 300);
     insert into public.zones (membre_id, sport, bornes) values ($1, 'velo', '[{"nom":"Z1","min":0,"max":140}]'),
                                                              ($2, 'velo', '[{"nom":"Z1","min":0,"max":170}]');
     insert into public.objectifs (membre_id, bloc, date_objectif) values ($1, 'M', '2027-06-14'), ($2, 'XL', '2027-09-05');`
      .replaceAll("$1", `'${A}'`).replaceAll("$2", `'${B}'`),
  );
});

afterAll(async () => {
  await db?.end();
  await admin?.query(`drop database if exists ${DB}`);
  await admin?.end();
});

describe("fiche membre", () => {
  it("est créée automatiquement à l'inscription, statut inactif", async () => {
    const rows = await enTantQue<{ email: string; statut_abonnement: string }>(A, "select * from membres");
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("a@club.fr");
    expect(rows[0].statut_abonnement).toBe("inactif");
  });

  it("le membre choisit lui-même son niveau et son profil", async () => {
    await enTantQue(A, "update membres set niveau = 'challenger', profil = 'intensif'");
    const [m] = await enTantQue<{ niveau: string; profil: string }>(A, "select niveau, profil from membres");
    expect(m).toEqual({ niveau: "challenger", profil: "intensif" });
  });

  it("le membre ne peut pas modifier son statut d'abonnement", async () => {
    await expect(enTantQue(A, "update membres set statut_abonnement = 'actif'")).rejects.toThrow(/permission/);
  });

  it("le membre ne peut pas modifier la fiche d'un autre", async () => {
    await enTantQue(A, "update membres set niveau = 'performer' where id = $1", [B]);
    const [b] = await enTantQue<{ niveau: string | null }>(B, "select niveau from membres");
    expect(b.niveau).toBeNull();
  });
});

describe.each(["tests", "zones", "objectifs"])("table %s", (table) => {
  it("chaque membre ne voit que ses propres lignes", async () => {
    const rowsA = await enTantQue<{ membre_id: string }>(A, `select membre_id from ${table}`);
    const rowsB = await enTantQue<{ membre_id: string }>(B, `select membre_id from ${table}`);
    expect(rowsA.map((r) => r.membre_id)).toEqual([A]);
    expect(rowsB.map((r) => r.membre_id)).toEqual([B]);
  });

  it("un membre ne peut pas supprimer les lignes d'un autre", async () => {
    await enTantQue(A, `delete from ${table} where membre_id = $1`, [B]);
    expect(await enTantQue(B, `select 1 from ${table}`)).toHaveLength(1);
  });

  it("un visiteur non connecté ne voit rien", async () => {
    await expect(enTantQue(null, `select * from ${table}`)).rejects.toThrow(/permission/);
  });
});

describe("écriture", () => {
  it("un membre ne peut pas créer une ligne au nom d'un autre", async () => {
    await expect(
      enTantQue(A, "insert into objectifs (membre_id, bloc, date_objectif) values ($1, 'S', '2027-05-01')", [B]),
    ).rejects.toThrow(/row-level security/);
  });

  it("une ligne ajoutée sans membre_id est rattachée au membre connecté", async () => {
    await enTantQue(A, "insert into tests (date_test, fc_seuil) values ('2026-11-10', 172)");
    const rows = await enTantQue<{ membre_id: string }>(A, "select membre_id from tests where fc_seuil = 172");
    expect(rows).toEqual([{ membre_id: A }]);
  });

  it("un test sans aucune mesure est refusé", async () => {
    await expect(enTantQue(A, "insert into tests (date_test) values ('2026-11-11')")).rejects.toThrow(
      /au_moins_une_mesure/,
    );
  });
});
