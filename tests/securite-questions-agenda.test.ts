/**
 * PREUVE : boîte à questions (sans votes) et agenda du Club.
 * - Tout membre connecté lit toutes les questions et pose les siennes en son nom ; personne ne vote.
 * - Seul l'admin marque une question traitée ; chacun retire les siennes, l'admin n'importe laquelle.
 * - Tout membre lit l'agenda ; seul l'admin ajoute, modifie ou supprime un événement.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BRUNO = "00000000-0000-0000-0000-0000000000b2";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);
const poser = async (qui: string, texte: string) =>
  (await en<{ id: string }>(qui, "insert into questions_faq (texte) values ($1) returning id", [texte]))[0].id;

beforeAll(async () => {
  base = await creerBaseDeTest("questions_agenda");
  await base.db.query(
    "insert into auth.users (id, email) values ($1, 'alice@club.fr'), ($2, 'bruno@club.fr'), ($3, 'coach@club.fr'), ($4, 'admin@club.fr')",
    [ALICE, BRUNO, COACH, ADMIN],
  );
  await base.abonnerTous();
  await base.db.query("update membres set prenom = 'Alice' where id = $1", [ALICE]);
  await base.db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
});

afterAll(async () => {
  await base?.fermer();
});

describe("boîte à questions", () => {
  it("un membre pose une question en son nom ; tous les membres la lisent (« Posée par Alice »)", async () => {
    await poser(ALICE, "Comment adapter ma semaine si je rate une séance ?");
    const lues = await en<{ auteur: string; texte: string; traitee_le: string | null }>(BRUNO, "select auteur, texte, traitee_le from questions_faq");
    expect(lues).toEqual([{ auteur: "Alice", texte: "Comment adapter ma semaine si je rate une séance ?", traitee_le: null }]);
    expect(await en(COACH, "select count(*)::int as n from questions_faq")).toEqual([{ n: 1 }]);
  });

  it("impossible de poser une question au nom d'un autre, d'usurper un prénom ou de la marquer traitée en la posant", async () => {
    await expect(en(BRUNO, "insert into questions_faq (membre_id, texte) values ($1, 'Au nom d''Alice')", [ALICE])).rejects.toThrow(/row-level security/);
    await expect(en(BRUNO, "insert into questions_faq (texte, auteur) values ('x', 'Martin')")).rejects.toThrow(/permission denied/);
    await expect(en(BRUNO, "insert into questions_faq (texte, traitee_le) values ('x', now())")).rejects.toThrow(/permission denied/);
  });

  it("sans votes : aucune colonne ni table pour voter, et une question ne se modifie pas", async () => {
    const colonnes = await en<{ column_name: string }>(
      ALICE,
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'questions_faq' order by column_name",
    );
    expect(colonnes.map((c) => c.column_name)).toEqual(["auteur", "auteur_role", "cree_le", "id", "membre_id", "texte", "traitee_le"]);
    const tables = await en<{ n: number }>(ALICE, "select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name ~ 'vote'");
    expect(tables).toEqual([{ n: 0 }]);
    await expect(en(ALICE, "update questions_faq set texte = 'Modifiée'")).rejects.toThrow(/permission denied/);
  });

  it("seul l'admin marque une question traitée (le coach non plus)", async () => {
    for (const qui of [ALICE, BRUNO, COACH]) {
      expect(await en(qui, "update questions_faq set traitee_le = now() returning id")).toEqual([]);
    }
    const [r] = await en<{ traitee: boolean }>(ADMIN, "update questions_faq set traitee_le = now() returning traitee_le is not null as traitee");
    expect(r.traitee).toBe(true);
  });

  it("chacun retire ses questions, pas celles des autres ; l'admin retire n'importe laquelle", async () => {
    const deBruno = await poser(BRUNO, "Faut-il refaire ses tests avant chaque bloc ?");
    expect(await en(ALICE, "delete from questions_faq where id = $1 returning id", [deBruno])).toEqual([]);
    expect(await en(COACH, "delete from questions_faq where id = $1 returning id", [deBruno])).toEqual([]);
    expect(await en(BRUNO, "delete from questions_faq where id = $1 returning id", [deBruno])).toEqual([{ id: deBruno }]);
    const autre = await poser(BRUNO, "Question à retirer par l'admin");
    expect(await en(ADMIN, "delete from questions_faq where id = $1 returning id", [autre])).toEqual([{ id: autre }]);
  });

  it("un visiteur non connecté ne lit rien", async () => {
    await expect(en(null, "select * from questions_faq")).rejects.toThrow(/permission denied/);
  });
});

describe("agenda", () => {
  it("les exemples de janvier 2027, à l'heure de Paris", async () => {
    const evts = await en<{ titre: string; debut_paris: string }>(
      ALICE,
      "select titre, to_char(debut at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI') as debut_paris from evenements order by debut",
    );
    expect(evts).toEqual([
      { titre: "FAQ en visio", debut_paris: "14/01/2027 19:30" },
      { titre: "Webinaire : bien démarrer sa saison", debut_paris: "21/01/2027 20:00" },
      { titre: "FAQ en visio", debut_paris: "28/01/2027 19:30" },
    ]);
  });

  it("un membre ou le coach ne peut ni ajouter, ni modifier, ni supprimer un événement", async () => {
    for (const qui of [ALICE, COACH]) {
      await expect(en(qui, "insert into evenements (titre, type, debut) values ('Pirate', 'autre', now())")).rejects.toThrow(/row-level security/);
      expect(await en(qui, "update evenements set titre = 'Pirate' returning id")).toEqual([]);
      expect(await en(qui, "delete from evenements returning id")).toEqual([]);
    }
  });

  it("l'admin ajoute, modifie et supprime un événement", async () => {
    const [e] = await en<{ id: string }>(
      ADMIN,
      "insert into evenements (titre, type, debut, fin) values ('Webinaire récup', 'webinaire', '2027-02-04 20:00 Europe/Paris', '2027-02-04 21:00 Europe/Paris') returning id",
    );
    expect(await en(ADMIN, "update evenements set titre = 'Webinaire récupération' where id = $1 returning titre", [e.id])).toEqual([
      { titre: "Webinaire récupération" },
    ]);
    expect(await en(ADMIN, "delete from evenements where id = $1 returning id", [e.id])).toEqual([{ id: e.id }]);
  });

  it("la base refuse un événement incohérent", async () => {
    for (const sql of [
      "insert into evenements (titre, type, debut, fin) values ('X', 'faq', '2027-02-04 20:00+01', '2027-02-04 19:00+01')",
      "insert into evenements (titre, type, debut, lien) values ('X', 'faq', now(), 'http://pas-securise.fr')",
      "insert into evenements (titre, type, debut, dates_a_confirmer) values ('X', 'stage', now(), true)",
    ]) {
      await expect(en(ADMIN, sql), sql).rejects.toThrow(/check constraint/);
    }
  });

  it("un visiteur non connecté ne lit pas l'agenda", async () => {
    await expect(en(null, "select * from evenements")).rejects.toThrow(/permission denied/);
  });
});
