/**
 * PREUVE : chacun ne note que son propre accord aux conditions ; supprimer un compte efface toutes
 * ses données ; la trace des suppressions est anonyme et lue par l'admin seulement.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";
import { TABLES_EXPORT } from "@/lib/mes-donnees";

const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BRUNO = "00000000-0000-0000-0000-0000000000b2";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const SEANCE = "de000000-0000-0000-0000-000000000201";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);

beforeAll(async () => {
  base = await creerBaseDeTest("mesdonnees");
  await base.db.query("insert into auth.users (id, email) values ($1, 'alice@club.fr'), ($2, 'bruno@club.fr'), ($3, 'admin@club.fr')", [
    ALICE,
    BRUNO,
    ADMIN,
  ]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
});

afterAll(async () => {
  await base?.fermer();
});

describe("acceptation des conditions", () => {
  it("Alice note son accord, à la date du jour", async () => {
    await en(ALICE, "select accepter_conditions('2026-11-24')");
    const { rows } = await base.db.query("select conditions_version, conditions_acceptees_le > now() - interval '1 minute' as recent from membres where id = $1", [ALICE]);
    expect(rows[0]).toEqual({ conditions_version: "2026-11-24", recent: true });
  });

  it("elle ne peut ni écrire ces colonnes directement, ni noter l'accord de Bruno", async () => {
    await expect(en(ALICE, "update membres set conditions_version = '2030-01-01' where id = $1", [ALICE])).rejects.toThrow(/permission denied/);
    await expect(en(ALICE, "update membres set conditions_acceptees_le = now() where id = $1", [BRUNO])).rejects.toThrow(/permission denied/);
    const { rows } = await base.db.query("select conditions_version from membres where id = $1", [BRUNO]);
    expect(rows[0].conditions_version).toBeNull();
  });

  it("une version mal formée est refusée ; un visiteur ne peut rien", async () => {
    await expect(en(ALICE, "select accepter_conditions('n''importe quoi')")).rejects.toThrow(/Version inconnue/);
    await expect(en(null, "select accepter_conditions('2026-11-24')")).rejects.toThrow(/permission denied/);
  });
});

describe("suppression du compte", () => {
  it("toutes les données de Bruno disparaissent avec son compte", async () => {
    await base.db.query(
      `insert into tests (membre_id, date_test, ftp) values ($1, '2026-11-02', 250);
       insert into ressentis (membre_id, seance_id, date_seance, rpe, commentaire) values ($1, '${SEANCE}', '2027-01-11', 6, 'Bien');
       insert into messages_club (canal, membre_id, texte) values ('general', $1, 'Salut');
       insert into appareils_notifications (membre_id, endpoint, p256dh, auth) values ($1, 'https://push.exemple.fr/b', 'c', 'a');`.replaceAll(
        "$1",
        `'${BRUNO}'`,
      ),
    );
    await base.db.query("delete from auth.users where id = $1", [BRUNO]);
    for (const table of ["membres", ...TABLES_EXPORT.map((t) => t.table), "journal_admin", "lectures_canaux"]) {
      const colonne = table === "membres" ? "id" : "membre_id";
      const { rows } = await base.db.query(`select count(*)::int as n from ${table} where ${colonne} = $1`, [BRUNO]);
      expect(rows[0].n, table).toBe(0);
    }
  });

  it("la trace des suppressions est anonyme, lue par l'admin seulement", async () => {
    await base.db.query("insert into comptes_supprimes (abonnement_resilie) values (true)");
    expect(await en(ALICE, "select * from comptes_supprimes")).toEqual([]);
    await expect(en(ALICE, "insert into comptes_supprimes (abonnement_resilie) values (false)")).rejects.toThrow(/permission denied/);
    expect(await en(ADMIN, "select abonnement_resilie from comptes_supprimes")).toEqual([{ abonnement_resilie: true }]);
    const { rows } = await base.db.query("select column_name from information_schema.columns where table_name = 'comptes_supprimes' order by 1");
    expect(rows.map((r) => r.column_name)).toEqual(["abonnement_resilie", "id", "supprime_le"]);
  });
});
