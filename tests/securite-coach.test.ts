/**
 * PREUVE : espace coach en lecture seule.
 * - Le coach ne lit plus la fiche entière des membres (e-mail, Stripe, abonnement) : seulement, par
 *   coach_athletes(), prénom, nom, niveau, profil, date d'inscription et « accès en cours ».
 * - Il lit les objectifs et les séances (RPE, douleur, commentaire) des athlètes, sans rien pouvoir modifier.
 * - Un membre n'a pas accès à cette liste ; l'admin garde la fiche entière.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const ACTIF = "00000000-0000-0000-0000-0000000000a1";
const ANCIEN = "00000000-0000-0000-0000-0000000000a2";
const OFFERT = "00000000-0000-0000-0000-0000000000a3";
const COUPE = "00000000-0000-0000-0000-0000000000a4";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const SEANCE = "de000000-0000-0000-0000-000000000202";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);

beforeAll(async () => {
  base = await creerBaseDeTest("coach");
  await base.db.query(
    `insert into auth.users (id, email) values ($1, 'actif@club.fr'), ($2, 'ancien@club.fr'), ($3, 'offert@club.fr'),
       ($4, 'coupe@club.fr'), ($5, 'coach@club.fr'), ($6, 'admin@club.fr')`,
    [ACTIF, ANCIEN, OFFERT, COUPE, COACH, ADMIN],
  );
  await base.db.query(
    `update membres set prenom = 'Caroline', nom = 'Dupont', niveau = 'challenger', profil = 'intensif',
       abonnement_fin = now() + interval '20 days', stripe_customer_id = 'cus_secret' where id = '${ACTIF}';
     update membres set prenom = 'Ancien', abonnement_fin = now() - interval '2 days' where id = '${ANCIEN}';
     update membres set prenom = 'Léa', acces_offert_jusqua = now() + interval '1 month' where id = '${OFFERT}';
     update membres set prenom = 'Marc', abonnement_fin = now() + interval '20 days', acces_coupe = true where id = '${COUPE}';
     update membres set role = 'coach' where id = '${COACH}';
     update membres set role = 'admin' where id = '${ADMIN}';
     insert into objectifs (membre_id, bloc, date_objectif) values ('${ACTIF}', 'L', '2027-05-30');
     insert into ressentis (membre_id, seance_id, date_seance, rpe, douleur, commentaire)
       values ('${ACTIF}', '${SEANCE}', '2027-01-05', 5, true, 'Gêne au mollet droit');`,
  );
});

afterAll(async () => {
  await base?.fermer();
});

describe("liste des athlètes", () => {
  it("le coach ne reçoit que prénom, nom, niveau, profil, inscription et accès en cours", async () => {
    const lignes = await en<Record<string, unknown>>(COACH, "select * from public.coach_athletes() order by prenom");
    expect(Object.keys(lignes[0]).sort()).toEqual(["acces_en_cours", "date_inscription", "id", "niveau", "nom", "prenom", "profil"]);
    expect(lignes.map((l) => [l.prenom, l.acces_en_cours])).toEqual([
      ["Ancien", false],
      ["Caroline", true],
      ["Léa", true], // accès offert
      ["Marc", false], // accès coupé, même payé
    ]);
    expect(lignes.find((l) => l.prenom === "Caroline")).toMatchObject({ nom: "Dupont", niveau: "challenger", profil: "intensif" });
  });

  it("seulement les membres : ni le coach ni l'admin dans la liste", async () => {
    const ids = (await en<{ id: string }>(COACH, "select id from public.coach_athletes()")).map((l) => l.id);
    expect(ids).not.toContain(COACH);
    expect(ids).not.toContain(ADMIN);
  });

  it("un membre ou un visiteur n'a pas accès à cette liste", async () => {
    await expect(en(ACTIF, "select * from public.coach_athletes()")).rejects.toThrow(/Réservé au coach/);
    await expect(en(null, "select * from public.coach_athletes()")).rejects.toThrow(/permission denied/);
  });

  it("le coach ne lit plus l'e-mail ni les identifiants Stripe ; l'admin, si", async () => {
    expect(await en(COACH, "select email, stripe_customer_id from membres where id = $1", [ACTIF])).toEqual([]);
    expect(await en(ADMIN, "select stripe_customer_id from membres where id = $1", [ACTIF])).toEqual([{ stripe_customer_id: "cus_secret" }]);
  });
});

describe("fiche en lecture seule", () => {
  it("le coach lit les objectifs et les séances avec RPE, douleur et commentaire", async () => {
    expect(await en(COACH, "select bloc from objectifs where membre_id = $1", [ACTIF])).toEqual([{ bloc: "L" }]);
    expect(
      await en(COACH, "select r.rpe, r.douleur, r.commentaire, s.titre from ressentis r join seances s on s.id = r.seance_id where r.membre_id = $1", [ACTIF]),
    ).toEqual([{ rpe: 5, douleur: true, commentaire: "Gêne au mollet droit", titre: "Footing endurance" }]);
  });

  it("le coach ne peut rien modifier, ajouter ni supprimer", async () => {
    expect(await en(COACH, "update membres set niveau = 'performer' where id = $1 returning id", [ACTIF])).toEqual([]);
    expect(await en(COACH, "update objectifs set bloc = 'S' where membre_id = $1 returning id", [ACTIF])).toEqual([]);
    expect(await en(COACH, "delete from objectifs where membre_id = $1 returning id", [ACTIF])).toEqual([]);
    expect(await en(COACH, "update ressentis set rpe = 1 where membre_id = $1 returning id", [ACTIF])).toEqual([]);
    expect(await en(COACH, "delete from ressentis where membre_id = $1 returning id", [ACTIF])).toEqual([]);
    for (const sql of [
      `insert into objectifs (membre_id, bloc, date_objectif) values ('${ACTIF}', 'S', '2027-06-01')`,
      `insert into ressentis (membre_id, seance_id, date_seance, rpe) values ('${ACTIF}', '${SEANCE}', '2027-01-06', 9)`,
      `insert into tests (membre_id, date_test, ftp) values ('${ACTIF}', '2027-01-06', 300)`,
      `insert into records (membre_id, epreuve, duree_secondes) values ('${ACTIF}', '10km', 2400)`,
    ]) {
      await expect(en(COACH, sql), sql).rejects.toThrow(/row-level security/);
    }
    // Rien n'a changé pour l'athlète.
    expect(await en(ACTIF, "select rpe, douleur from ressentis")).toEqual([{ rpe: 5, douleur: true }]);
    expect(await en(ACTIF, "select niveau from membres")).toEqual([{ niveau: "challenger" }]);
  });

  it("aucun message privé : le coach ne peut pas créer de canal en tête-à-tête", async () => {
    await expect(en(COACH, `insert into canaux (cle, nom, description, ordre) values ('coach-caroline', 'privé', 'Coach et Caroline', 9)`)).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("nom de famille", () => {
  it("le membre modifie son nom, pas celui d'un autre ; la base refuse un nom trop long", async () => {
    expect(await en(ACTIF, "update membres set nom = 'Dupont-Moreau' where id = $1 returning nom", [ACTIF])).toEqual([{ nom: "Dupont-Moreau" }]);
    expect(await en(ACTIF, "update membres set nom = 'Pirate' where id = $1 returning id", [OFFERT])).toEqual([]);
    await expect(en(ACTIF, `update membres set nom = '${"x".repeat(61)}' where id = $1`, [ACTIF])).rejects.toThrow(/check constraint/);
  });
});
