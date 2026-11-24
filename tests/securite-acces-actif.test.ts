/**
 * PREUVE : le contenu partagé du Club (messages, questions, agenda, canaux, ressources, partenaires)
 * n'est lisible qu'avec un accès en cours, même en interrogeant la base directement avec sa session.
 * Un ancien membre ou un membre coupé n'y a plus accès, ne publie plus et ne débloque plus rien,
 * mais garde ses propres données (pour les télécharger ou supprimer son compte).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const ACTIF = "00000000-0000-0000-0000-0000000000a1";
const ANCIEN = "00000000-0000-0000-0000-0000000000a2";
const COUPE = "00000000-0000-0000-0000-0000000000a3";
const OFFERT = "00000000-0000-0000-0000-0000000000a4";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const SEANCE = "de000000-0000-0000-0000-000000000201";
const VIDEO = "de000000-0000-0000-0001-000000000001"; // ressource de démo débloquée dès la semaine 1

let base: BaseDeTest;
const en = <T>(qui: string, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);

const CONTENU_PARTAGE = ["messages_club", "questions_faq", "evenements", "canaux", "themes_ressources", "sous_rubriques", "partenaires"];

beforeAll(async () => {
  base = await creerBaseDeTest("accesactif");
  await base.db.query(
    `insert into auth.users (id, email) values ($1, 'actif@club.fr'), ($2, 'ancien@club.fr'), ($3, 'coupe@club.fr'), ($4, 'offert@club.fr'), ($5, 'coach@club.fr')`,
    [ACTIF, ANCIEN, COUPE, OFFERT, COACH],
  );
  await base.db.query(
    `update membres set abonnement_fin = now() + interval '20 days' where id = $1;
     update membres set date_inscription = now() - interval '70 days', abonnement_fin = now() - interval '21 days' where id = $2;
     update membres set abonnement_fin = now() + interval '20 days', acces_coupe = true where id = $3;
     update membres set acces_offert_jusqua = now() + interval '20 days' where id = $4;
     update membres set role = 'coach' where id = $5;`
      .replaceAll("$1", `'${ACTIF}'`)
      .replaceAll("$2", `'${ANCIEN}'`)
      .replaceAll("$3", `'${COUPE}'`)
      .replaceAll("$4", `'${OFFERT}'`)
      .replaceAll("$5", `'${COACH}'`),
  );
  await base.db.query("insert into messages_club (canal, membre_id, texte) values ('general', $1, 'Bonjour le Club')", [ACTIF]);
  await base.db.query("insert into questions_faq (membre_id, texte) values ($1, 'Combien de séances par semaine ?')", [ACTIF]);
  await base.db.query("insert into tests (membre_id, date_test, ftp) values ($1, '2026-09-01', 210)", [ANCIEN]);
  await base.db.query("insert into ressentis (membre_id, seance_id, date_seance, rpe, commentaire) values ($1, $2, '2026-09-02', 6, 'Bien')", [ANCIEN, SEANCE]);
});

afterAll(async () => {
  await base?.fermer();
});

describe.each([
  ["un ancien membre (abonnement terminé)", ANCIEN],
  ["un membre dont l'accès est coupé", COUPE],
])("%s", (_, qui) => {
  it.each(CONTENU_PARTAGE)("ne lit plus rien dans %s", async (table) => {
    expect(await en(qui, `select * from ${table}`)).toEqual([]);
  });

  it("ne lit plus le catalogue des ressources ni leurs vidéos et PDF", async () => {
    expect(await en(qui, "select id from ressources")).toEqual([]);
    expect(await en(qui, "select * from ressources_medias()")).toEqual([]);
    expect(await en(qui, "select fichier_ressource($1) as f", [VIDEO])).toEqual([{ f: null }]);
    expect(await en(qui, "select ressource_debloquee($1) as ok", [VIDEO])).toEqual([{ ok: false }]);
  });

  it("n'a plus de non-lus et ne peut plus rien publier", async () => {
    expect(await en(qui, "select * from canaux_non_lus()")).toEqual([]);
    await expect(en(qui, "insert into messages_club (canal, membre_id, texte) values ('general', $1, 'Encore là')", [qui])).rejects.toThrow(
      /row-level security/,
    );
    await expect(en(qui, "insert into questions_faq (membre_id, texte) values ($1, 'Et moi ?')", [qui])).rejects.toThrow(/row-level security/);
    await expect(
      en(qui, "insert into commentaires_ressources (ressource_id, membre_id, texte) values ($1, $2, 'Super')", [VIDEO, qui]),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("un ancien membre garde ses propres données", () => {
  it("il lit toujours ses tests et ses séances (pour les télécharger)", async () => {
    expect(await en(ANCIEN, "select ftp from tests")).toEqual([{ ftp: 210 }]);
    expect(await en(ANCIEN, "select rpe, commentaire from ressentis")).toEqual([{ rpe: 6, commentaire: "Bien" }]);
  });

  it("son ancienneté s'est arrêtée à la fin de son accès : il ne débloque plus rien", async () => {
    // Inscrit il y a 10 semaines, accès terminé il y a 3 semaines : il reste en semaine 8, pas 11.
    expect(await en(ANCIEN, "select semaine_anciennete() as s")).toEqual([{ s: 8 }]);
  });
});

describe.each([
  ["un membre abonné", ACTIF],
  ["un membre à qui l'accès est offert", OFFERT],
  ["le coach", COACH],
])("%s", (_, qui) => {
  it("lit les messages, les questions, les canaux et le catalogue", async () => {
    expect(await en(qui, "select texte from messages_club")).toEqual([{ texte: "Bonjour le Club" }]);
    expect((await en(qui, "select id from questions_faq")).length).toBe(1);
    expect((await en(qui, "select cle from canaux")).length).toBe(9);
    expect((await en(qui, "select id from ressources")).length).toBeGreaterThan(0);
    expect(await en(qui, "select ressource_debloquee($1) as ok", [VIDEO])).toEqual([{ ok: true }]);
  });
});
