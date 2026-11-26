/**
 * PREUVE : seul l'admin ajoute, modifie ou supprime un canal ; un canal ajouté est collectif
 * (lisible par tous les membres qui ont un accès en cours) ; « annonces » est protégé ;
 * supprimer un canal exige de retaper son nom et emporte ses messages ; tout est noté au journal.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const MEMBRE = "00000000-0000-0000-0000-0000000000a1";
const AUTRE = "00000000-0000-0000-0000-0000000000a2";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);
const creer = (qui: string, cle: string, nom: string, lecture = false, ordre = 50) =>
  en(qui, "select admin_creer_canal($1, $2, 'Pour les sorties longues', $3, $4::smallint)", [cle, nom, lecture, ordre]);

beforeAll(async () => {
  base = await creerBaseDeTest("canaux_admin");
  await base.db.query(
    "insert into auth.users (id, email) values ($1, 'membre@club.fr'), ($2, 'autre@club.fr'), ($3, 'coach@club.fr'), ($4, 'admin@club.fr')",
    [MEMBRE, AUTRE, COACH, ADMIN],
  );
  await base.db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
  await base.abonnerTous();
});

afterAll(async () => {
  await base?.fermer();
});

describe("ajouter un canal", () => {
  it("un membre ou un coach ne peut ni ajouter, ni modifier, ni supprimer un canal, même directement", async () => {
    for (const qui of [MEMBRE, COACH]) {
      await expect(creer(qui, "velo-route", "vélo route")).rejects.toThrow(/réservée à un administrateur/);
      await expect(en(qui, "select admin_modifier_canal('general', 'x', 'y', false, 1::smallint)")).rejects.toThrow(/réservée à un administrateur/);
      await expect(en(qui, "select admin_supprimer_canal('general', 'général')")).rejects.toThrow(/réservée à un administrateur/);
      await expect(en(qui, "insert into canaux (cle, nom, description, ordre) values ('prive', 'prive', 'x', 1)")).rejects.toThrow(/permission denied/);
      await expect(en(qui, "delete from canaux where cle = 'general'")).rejects.toThrow(/permission denied/);
    }
  });

  it("l'admin ajoute un canal : il est collectif, tout membre le lit et y écrit", async () => {
    await creer(ADMIN, "sorties-longues", "sorties longues");
    for (const qui of [MEMBRE, AUTRE, COACH]) {
      const rows = await en<{ cle: string }>(qui, "select cle from canaux where cle = 'sorties-longues'");
      expect(rows).toEqual([{ cle: "sorties-longues" }]);
    }
    await en(MEMBRE, "insert into messages_club (canal, texte) values ('sorties-longues', 'Qui roule dimanche ?')");
    const lus = await en<{ texte: string }>(AUTRE, "select texte from messages_club where canal = 'sorties-longues'");
    expect(lus).toEqual([{ texte: "Qui roule dimanche ?" }]);
  });

  it("refuse une adresse prise, invalide ou réservée (questions, agenda)", async () => {
    await expect(creer(ADMIN, "sorties-longues", "doublon")).rejects.toThrow(/déjà ce nom/);
    for (const cle of ["questions", "agenda", "Majuscule", "avec espace", "-tiret", ""]) {
      await expect(creer(ADMIN, cle, "nom")).rejects.toThrow(/Adresse de canal invalide/);
    }
  });
});

describe("modifier un canal", () => {
  it("l'admin renomme un canal et le passe en lecture seule", async () => {
    await en(ADMIN, "select admin_modifier_canal('sorties-longues', 'sorties', 'Le dimanche matin', true, 9::smallint)");
    const [c] = await en<{ nom: string; lecture_seule: boolean; ordre: number }>(MEMBRE, "select nom, lecture_seule, ordre from canaux where cle = 'sorties-longues'");
    expect(c).toEqual({ nom: "sorties", lecture_seule: true, ordre: 9 });
    await expect(en(MEMBRE, "insert into messages_club (canal, texte) values ('sorties-longues', 'encore ?')")).rejects.toThrow();
  });

  it("« annonces » reste en lecture seule", async () => {
    await expect(en(ADMIN, "select admin_modifier_canal('annonces', 'annonces', 'x', false, 1::smallint)")).rejects.toThrow(/reste réservé/);
  });
});

describe("supprimer un canal", () => {
  it("« annonces » ne peut pas être supprimé", async () => {
    await expect(en(ADMIN, "select admin_supprimer_canal('annonces', 'annonces')")).rejects.toThrow(/ne peut pas être supprimé/);
  });

  it("il faut retaper exactement le nom du canal", async () => {
    await expect(en(ADMIN, "select admin_supprimer_canal('sorties-longues', 'sortie')")).rejects.toThrow(/tape exactement le nom/);
    expect((await base.db.query("select 1 from canaux where cle = 'sorties-longues'")).rowCount).toBe(1);
  });

  it("supprime le canal et ses messages, et le note au journal", async () => {
    const [{ n }] = await en<{ n: number }>(ADMIN, "select admin_supprimer_canal('sorties-longues', 'sorties') as n");
    expect(n).toBe(1);
    expect((await base.db.query("select 1 from canaux where cle = 'sorties-longues'")).rowCount).toBe(0);
    expect((await base.db.query("select 1 from messages_club where canal = 'sorties-longues'")).rowCount).toBe(0);
    const { rows } = await base.db.query("select action, detail from journal_admin where admin_id = $1 order by id", [ADMIN]);
    expect(rows.map((r) => r.action)).toEqual(["canal_cree", "canal_modifie", "canal_supprime"]);
    expect(rows[2].detail).toBe("#sorties-longues : sorties (1 messages)");
  });
});
