/**
 * PREUVE : les appareils qui reçoivent les notifications sont privés à chaque membre (ni les autres
 * membres, ni le coach, ni l'admin ne les lisent) ; chacun ne change que ses propres réglages ;
 * seul le serveur lit les appareils et note les rappels de FAQ.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BRUNO = "00000000-0000-0000-0000-0000000000b2";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const FAQ = "00000000-0000-0000-0003-0000000000f1";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);

async function serveur<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  await base.db.query("begin");
  try {
    await base.db.query("set local role service_role");
    const r = await base.db.query(sql, params);
    await base.db.query("commit");
    return r.rows as T[];
  } catch (e) {
    await base.db.query("rollback");
    throw e;
  }
}

beforeAll(async () => {
  base = await creerBaseDeTest("notifications");
  await base.db.query(
    "insert into auth.users (id, email) values ($1, 'alice@club.fr'), ($2, 'bruno@club.fr'), ($3, 'coach@club.fr'), ($4, 'admin@club.fr')",
    [ALICE, BRUNO, COACH, ADMIN],
  );
  await base.db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
  await base.db.query(
    "insert into appareils_notifications (membre_id, endpoint, p256dh, auth) values ($1, 'https://push.exemple.fr/bruno', 'cle', 'auth')",
    [BRUNO],
  );
  await base.db.query(
    "insert into evenements (id, titre, type, debut, fin) values ($1, 'FAQ en visio', 'faq', '2027-01-14T18:30:00Z', '2027-01-14T19:30:00Z')",
    [FAQ],
  );
});

afterAll(async () => {
  await base?.fermer();
});

describe("appareils_notifications", () => {
  it("Alice enregistre et retire son propre appareil", async () => {
    await en(ALICE, "insert into appareils_notifications (endpoint, p256dh, auth) values ('https://push.exemple.fr/alice', 'cle', 'auth')");
    expect(await en(ALICE, "select endpoint from appareils_notifications")).toEqual([{ endpoint: "https://push.exemple.fr/alice" }]);
    expect(await en(ALICE, "delete from appareils_notifications returning endpoint")).toEqual([{ endpoint: "https://push.exemple.fr/alice" }]);
  });

  it.each([
    ["le coach", COACH],
    ["l'admin", ADMIN],
    ["un autre membre", ALICE],
  ])("%s ne voit pas les appareils de Bruno", async (_, qui) => {
    expect(await en(qui, "select * from appareils_notifications where membre_id = $1", [BRUNO])).toEqual([]);
  });

  it("une adresse d'envoi doit être en https", async () => {
    await expect(
      en(ALICE, "insert into appareils_notifications (endpoint, p256dh, auth) values ('http://push.exemple.fr/x', 'cle', 'auth')"),
    ).rejects.toThrow(/check constraint/);
  });

  it("un visiteur non connecté n'a accès à rien", async () => {
    await expect(en(null, "select * from appareils_notifications")).rejects.toThrow(/permission denied/);
  });

  it("le serveur lit les appareils pour envoyer, et retire ceux qui ont disparu", async () => {
    expect(await serveur("select endpoint from appareils_notifications where membre_id = $1", [BRUNO])).toEqual([
      { endpoint: "https://push.exemple.fr/bruno" },
    ]);
    await expect(serveur("update appareils_notifications set auth = 'x'")).rejects.toThrow(/permission denied/);
  });
});

describe("réglages du Profil (membres.notif_annonces, notif_faq)", () => {
  it("activés par défaut", async () => {
    expect(await en(ALICE, "select notif_annonces, notif_faq from membres where id = $1", [ALICE])).toEqual([
      { notif_annonces: true, notif_faq: true },
    ]);
  });

  it("Alice coupe ses rappels FAQ, sans toucher à ceux de Bruno", async () => {
    expect(await en(ALICE, "update membres set notif_faq = false where id = $1 returning notif_faq", [ALICE])).toEqual([{ notif_faq: false }]);
    expect(await en(ALICE, "update membres set notif_faq = false where id = $1 returning id", [BRUNO])).toEqual([]);
    const { rows } = await base.db.query("select notif_faq from membres where id = $1", [BRUNO]);
    expect(rows[0].notif_faq).toBe(true);
  });
});

describe("rappels_faq_envoyes", () => {
  it("fermé aux membres, au coach et à l'admin", async () => {
    for (const qui of [ALICE, COACH, ADMIN]) {
      await expect(en(qui, "select * from rappels_faq_envoyes")).rejects.toThrow(/permission denied/);
      await expect(en(qui, "insert into rappels_faq_envoyes (evenement_id) values ($1)", [FAQ])).rejects.toThrow(/permission denied/);
    }
  });

  it("le serveur note un rappel une seule fois", async () => {
    await serveur("insert into rappels_faq_envoyes (evenement_id) values ($1)", [FAQ]);
    await expect(serveur("insert into rappels_faq_envoyes (evenement_id) values ($1)", [FAQ])).rejects.toThrow(/duplicate key/);
    expect(await serveur("select id from evenements where type = 'faq'")).toContainEqual({ id: FAQ });
  });
});
