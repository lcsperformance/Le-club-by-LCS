/**
 * PREUVE : seul un admin change les rôles ; un « Coach + admin » a les droits d'un admin
 * mais apparaît comme « coach » dans les messages, questions et commentaires.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const MEMBRE = "00000000-0000-0000-0000-0000000000a1";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const MARTIN = "00000000-0000-0000-0000-0000000000ca";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);
const role = async (id: string) =>
  (await base.db.query("select role, affiche_coach from membres where id = $1", [id])).rows[0] as { role: string; affiche_coach: boolean };

beforeAll(async () => {
  base = await creerBaseDeTest("equipe");
  await base.db.query(
    "insert into auth.users (id, email) values ($1, 'membre@club.fr'), ($2, 'coach@club.fr'), ($3, 'admin@club.fr'), ($4, 'martin@club.fr')",
    [MEMBRE, COACH, ADMIN, MARTIN],
  );
  await base.db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
  await base.db.query("update membres set prenom = 'Martin', abonnement_fin = now() + interval '30 days' where id = $1", [MARTIN]);
});

afterAll(async () => {
  await base?.fermer();
});

describe("changement de rôle", () => {
  it("un membre ou un coach ne peut pas changer de rôle (ni le sien, ni celui d'un autre)", async () => {
    for (const qui of [MEMBRE, COACH]) {
      await expect(en(qui, "select admin_changer_role_equipe($1, 'admin')", [qui])).rejects.toThrow(/réservée à un administrateur/);
      await expect(en(qui, "update membres set role = 'admin', affiche_coach = true where id = $1", [qui])).rejects.toThrow(/permission denied/);
    }
    expect(await role(MEMBRE)).toEqual({ role: "membre", affiche_coach: false });
  });

  it("l'admin fait de Martin un « Coach + admin », noté au journal", async () => {
    await en(ADMIN, "select admin_changer_role_equipe($1, 'coach_admin')", [MARTIN]);
    expect(await role(MARTIN)).toEqual({ role: "admin", affiche_coach: true });
    const { rows } = await base.db.query("select action, detail, admin_id from journal_admin where membre_id = $1", [MARTIN]);
    expect(rows).toEqual([{ action: "role_change", detail: "coach_admin", admin_id: ADMIN }]);
  });

  it("refuse un rôle inconnu, et un admin ne peut pas se retirer lui-même l'administration", async () => {
    await expect(en(ADMIN, "select admin_changer_role_equipe($1, 'superadmin')", [MEMBRE])).rejects.toThrow(/Rôle inconnu/);
    await expect(en(ADMIN, "select admin_changer_role_equipe($1, 'coach')", [ADMIN])).rejects.toThrow(/propre accès/);
    await en(ADMIN, "select admin_changer_role_equipe($1, 'coach_admin')", [ADMIN]);
    expect(await role(ADMIN)).toEqual({ role: "admin", affiche_coach: true });
    await en(ADMIN, "select admin_changer_role_equipe($1, 'admin')", [ADMIN]);
  });
});

describe("Coach + admin : droits d'admin, présenté comme coach", () => {
  it("il a les droits d'un admin (journal, agenda)", async () => {
    const [j] = await en<{ n: number }>(MARTIN, "select count(*)::int as n from journal_admin");
    expect(j.n).toBeGreaterThan(0);
    await en(MARTIN, "insert into evenements (titre, type, debut) values ('Stage vélo', 'stage', '2027-04-03T08:00:00Z')");
  });

  it("ses messages, questions et commentaires portent le rôle « coach »", async () => {
    const [m] = await en<{ auteur: string; auteur_role: string }>(
      MARTIN,
      "insert into messages_club (canal, membre_id, texte) values ('annonces', $1, 'Bienvenue !') returning auteur, auteur_role",
      [MARTIN],
    );
    expect(m).toEqual({ auteur: "Martin", auteur_role: "coach" });
    const [q] = await en<{ auteur_role: string }>(MARTIN, "insert into questions_faq (texte) values ('Test ?') returning auteur_role");
    expect(q.auteur_role).toBe("coach");
  });

  it("un admin « simple » reste « admin »", async () => {
    const [m] = await en<{ auteur_role: string }>(
      ADMIN,
      "insert into messages_club (canal, membre_id, texte) values ('general', $1, 'Salut') returning auteur_role",
      [ADMIN],
    );
    expect(m.auteur_role).toBe("admin");
  });
});
