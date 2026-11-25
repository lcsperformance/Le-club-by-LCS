/** PREUVE : les codes des partenaires ne sont lus que par les membres connectés ; seul l'admin les gère. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const MEMBRE = "00000000-0000-0000-0000-0000000000a1";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);

beforeAll(async () => {
  base = await creerBaseDeTest("partenaires");
  await base.db.query("insert into auth.users (id, email) values ($1, 'membre@club.fr'), ($2, 'coach@club.fr'), ($3, 'admin@club.fr')", [MEMBRE, COACH, ADMIN]);
  await base.abonnerTous();
  await base.db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
  await base.db.query("insert into partenaires (nom, remise, description, code, affiche) values ('Bientôt', 25, 'en préparation', 'SECRET25', false)");
});

afterAll(async () => {
  await base?.fermer();
});

describe("partenaires", () => {
  it("les deux exemples : Pyrène −15 % et Onatera −10 %, codes d'exemple à remplacer", async () => {
    expect(await en(MEMBRE, "select nom, remise, code, exemple from partenaires order by ordre")).toEqual([
      { nom: "Pyrène", remise: 15, code: "LECLUB15", exemple: true },
      { nom: "Onatera", remise: 10, code: "LECLUB10", exemple: true },
    ]);
  });

  it("un visiteur non connecté ne voit aucun code", async () => {
    await expect(en(null, "select code from partenaires")).rejects.toThrow(/permission denied/);
  });

  it("un partenaire masqué n'est visible que par l'admin", async () => {
    expect(await en(MEMBRE, "select code from partenaires where code = 'SECRET25'")).toEqual([]);
    expect(await en(COACH, "select code from partenaires where code = 'SECRET25'")).toEqual([]);
    expect(await en(ADMIN, "select code from partenaires where code = 'SECRET25'")).toEqual([{ code: "SECRET25" }]);
  });

  it("un membre ou le coach ne peut ni ajouter, ni modifier, ni supprimer", async () => {
    for (const qui of [MEMBRE, COACH]) {
      await expect(en(qui, "insert into partenaires (nom, remise, description, code) values ('Pirate', 50, 'x', 'PIRATE50')")).rejects.toThrow(/row-level security/);
      expect(await en(qui, "update partenaires set remise = 90 returning id")).toEqual([]);
      expect(await en(qui, "delete from partenaires returning id")).toEqual([]);
    }
  });

  it("l'admin ajoute, modifie et supprime ; la base refuse une remise ou un code incohérent", async () => {
    const [p] = await en<{ id: string }>(ADMIN, "insert into partenaires (nom, remise, description, code) values ('Zeste', 12, 'sur tout le site', 'ZESTE12') returning id");
    expect(await en(ADMIN, "update partenaires set remise = 20 where id = $1 returning remise", [p.id])).toEqual([{ remise: 20 }]);
    expect(await en(ADMIN, "delete from partenaires where id = $1 returning id", [p.id])).toEqual([{ id: p.id }]);
    await expect(en(ADMIN, "insert into partenaires (nom, remise, description, code) values ('X', 95, 'x', 'XX95')")).rejects.toThrow(/check constraint/);
    await expect(en(ADMIN, "insert into partenaires (nom, remise, description, code) values ('X', 10, 'x', 'avec espace')")).rejects.toThrow(/check constraint/);
    await expect(en(ADMIN, "insert into partenaires (nom, remise, description, code) values ('X', 10, 'x', 'CODE#10')")).rejects.toThrow(/check constraint/);
    await expect(en(ADMIN, "insert into partenaires (nom, remise, description, code) values ('Point', 10, 'x', 'LCS2026?!')")).resolves.toBeDefined();
  });

  it("aucun thème des Ressources ne peut prendre l'adresse du calculateur", async () => {
    await expect(en(ADMIN, "insert into themes_ressources (cle, nom, icone) values ('calculateur', 'Calcul', 'velo')")).rejects.toThrow(/check constraint/);
  });
});
