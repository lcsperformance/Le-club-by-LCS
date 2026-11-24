/**
 * Vérifie la sécurité par ligne sur une vraie base PostgreSQL locale (voir aide/base-de-test.ts).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";

let base: BaseDeTest;
let db: BaseDeTest["db"];
const enTantQue: BaseDeTest["enTantQue"] = (...args) => base.enTantQue(...args);

beforeAll(async () => {
  base = await creerBaseDeTest("rls");
  db = base.db;

  await db.query(
    "insert into auth.users (id, email) values ($1, 'a@club.fr'), ($2, 'b@club.fr'), ($3, 'coach@club.fr'), ($4, 'admin@club.fr')",
    [A, B, COACH, ADMIN],
  );
  await db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
  await db.query(
    `insert into public.tests (membre_id, date_test, ftp) values ($1, '2026-11-01', 250), ($2, '2026-11-02', 300);
     insert into public.zones (membre_id, sport, bornes) values ($1, 'velo', '[45, 57, 76, 91, 106, 120]'),
                                                              ($2, 'velo', '[45, 55, 76, 91, 106, 120]');
     insert into public.objectifs (membre_id, bloc, date_objectif) values ($1, 'M', '2027-06-14'), ($2, 'XL', '2027-09-05');
     insert into public.records (membre_id, epreuve, duree_secondes) values ($1, '10km', 2492), ($2, 'semi', 5530);`
      .replaceAll("$1", `'${A}'`).replaceAll("$2", `'${B}'`),
  );
});

afterAll(async () => {
  await base?.fermer();
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

  it("le membre ne peut pas modifier le niveau ni le profil d'un autre", async () => {
    const touchees = await enTantQue(
      A,
      "update membres set niveau = 'performer', profil = 'intensif' where id = $1 returning id",
      [B],
    );
    expect(touchees).toEqual([]);
    const [b] = await enTantQue<{ niveau: string | null; profil: string | null }>(B, "select niveau, profil from membres");
    expect(b).toEqual({ niveau: null, profil: null });
  });

  it("le membre ne peut pas lire le niveau ni le profil d'un autre", async () => {
    expect(await enTantQue(A, "select niveau, profil from membres where id = $1", [B])).toEqual([]);
  });
});

describe.each(["tests", "zones", "objectifs", "records"])("table %s", (table) => {
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

describe("rôles", () => {
  it("un nouveau compte a le rôle membre", async () => {
    const [m] = await enTantQue<{ role: string }>(A, "select role from membres");
    expect(m.role).toBe("membre");
  });

  it("un membre ne peut pas se donner un autre rôle", async () => {
    await expect(enTantQue(A, "update membres set role = 'admin'")).rejects.toThrow(/permission/);
    await expect(enTantQue(A, "select admin_changer_role($1, 'admin')", [A])).rejects.toThrow(/administrateur/);
  });

  it("un membre ne voit toujours que sa fiche", async () => {
    expect(await enTantQue(A, "select id from membres")).toEqual([{ id: A }]);
  });

  it.each(["tests", "zones", "objectifs"])("le coach lit %s de tous les athlètes", async (table) => {
    const rows = await enTantQue<{ m: string }>(COACH, `select membre_id as m from ${table}`);
    expect(rows.map((r) => r.m)).toEqual(expect.arrayContaining([A, B]));
  });

  it("le coach ne lit plus la fiche entière des membres (e-mail, Stripe) : seulement la sienne", async () => {
    expect(await enTantQue(COACH, "select id from membres")).toEqual([{ id: COACH }]);
    expect(await enTantQue(COACH, "select email from membres where id = $1", [A])).toEqual([]);
  });

  it.each(["tests", "zones", "objectifs"])("le coach ne peut rien modifier dans %s", async (table) => {
    await enTantQue(COACH, `delete from ${table}`);
    await enTantQue(COACH, `update ${table} set membre_id = membre_id`);
    expect(await enTantQue(B, `select 1 from ${table}`)).toHaveLength(1);
    await expect(
      enTantQue(COACH, "insert into objectifs (membre_id, bloc, date_objectif) values ($1, 'S', '2027-05-01')", [A]),
    ).rejects.toThrow(/row-level security/);
  });

  it("le coach ne peut pas modifier la fiche d'un athlète", async () => {
    await enTantQue(COACH, "update membres set niveau = 'performer' where id = $1", [B]);
    const [b] = await enTantQue<{ niveau: string | null }>(B, "select niveau from membres");
    expect(b.niveau).toBeNull();
    await expect(enTantQue(COACH, "select admin_changer_statut($1, 'actif')", [B])).rejects.toThrow(/administrateur/);
  });

  it("l'admin change le statut d'abonnement et le rôle", async () => {
    await enTantQue(ADMIN, "select admin_changer_statut($1, 'actif')", [B]);
    await enTantQue(ADMIN, "select admin_changer_role($1, 'coach')", [B]);
    const [b] = await enTantQue<{ statut_abonnement: string; role: string }>(B, "select statut_abonnement, role from membres where id = $1", [B]);
    expect(b).toEqual({ statut_abonnement: "actif", role: "coach" });
    await enTantQue(ADMIN, "select admin_changer_role($1, 'membre')", [B]);
  });

  it("l'admin ne peut pas retirer son propre rôle admin", async () => {
    await expect(enTantQue(ADMIN, "select admin_changer_role($1, 'membre')", [ADMIN])).rejects.toThrow(/propre rôle/);
  });

  it("un visiteur non connecté ne peut pas appeler les fonctions admin", async () => {
    await expect(enTantQue(null, "select admin_changer_statut($1, 'actif')", [B])).rejects.toThrow(/permission/);
  });
});

describe("tests de départ : un par jour", () => {
  const upsert = `insert into tests (date_test, allure_seuil_course, ftp, vitesse_critique_natation, fc_seuil)
    values ('2026-12-01', $1, 220, 105, 168)
    on conflict (membre_id, date_test) do update set
      allure_seuil_course = excluded.allure_seuil_course, ftp = excluded.ftp,
      vitesse_critique_natation = excluded.vitesse_critique_natation, fc_seuil = excluded.fc_seuil`;

  it("refaire ses tests le même jour remplace la saisie du jour", async () => {
    await enTantQue(A, upsert, [270]);
    await enTantQue(A, upsert, [265]);
    const rows = await enTantQue<{ allure_seuil_course: number }>(
      A,
      "select allure_seuil_course from tests where date_test = '2026-12-01'",
    );
    expect(rows).toEqual([{ allure_seuil_course: 265 }]);
  });

  it("deux membres peuvent faire leurs tests le même jour", async () => {
    await enTantQue(B, upsert, [300]);
    expect(await enTantQue(A, "select 1 from tests where date_test = '2026-12-01'")).toHaveLength(1);
    expect(await enTantQue(B, "select 1 from tests where date_test = '2026-12-01'")).toHaveLength(1);
  });

  it("un membre ne peut pas écraser le test du jour d'un autre", async () => {
    await expect(
      enTantQue(
        A,
        `insert into tests (membre_id, date_test, ftp) values ($1, '2026-12-01', 999)
         on conflict (membre_id, date_test) do update set ftp = excluded.ftp`,
        [B],
      ),
    ).rejects.toThrow(/row-level security|check constraint/);
    const [b] = await enTantQue<{ ftp: number }>(B, "select ftp from tests where date_test = '2026-12-01'");
    expect(b.ftp).toBe(220);
  });
});

describe("objectifs : nom de course facultatif", () => {
  it("le membre nomme sa course, ou la laisse sans nom", async () => {
    await enTantQue(A, "update objectifs set nom = 'Triathlon de Nice'");
    expect(await enTantQue(A, "select nom from objectifs")).toEqual([{ nom: "Triathlon de Nice" }]);
    await enTantQue(A, "update objectifs set nom = null");
    expect(await enTantQue(A, "select nom from objectifs")).toEqual([{ nom: null }]);
  });

  it.each([
    ["vide", ""],
    ["trop long", "x".repeat(61)],
    ["avec des espaces autour", " Nice "],
  ])("un nom %s est refusé par la base", async (_, nom) => {
    await expect(enTantQue(A, "update objectifs set nom = $1", [nom])).rejects.toThrow(/objectifs_nom_valide/);
  });

  it("le membre ne peut pas nommer l'objectif d'un autre", async () => {
    expect(await enTantQue(A, "update objectifs set nom = 'Piraté' where membre_id = $1 returning id", [B])).toEqual([]);
  });
});

describe("zones personnalisées : bornes cohérentes", () => {
  const essayer = (bornes: string) =>
    enTantQue(A, "insert into zones (sport, bornes) values ('natation', $1::jsonb)", [bornes]);

  it("accepte 6 entiers qui montent", async () => {
    await essayer("[80, 86, 93, 97, 102, 108]");
    await enTantQue(A, "delete from zones where sport = 'natation'");
  });

  it("accepte des zones cardio personnalisées", async () => {
    await enTantQue(A, "insert into zones (sport, bornes) values ('cardio', '[65, 80, 90, 94, 100, 106]'::jsonb)");
    const lignes = await enTantQue(B, "select * from zones where sport = 'cardio'");
    expect(lignes).toHaveLength(0);
    await enTantQue(A, "delete from zones where sport = 'cardio'");
  });

  it.each([
    ["des bornes qui ne montent pas", "[80, 93, 87, 97, 102, 108]"],
    ["deux bornes égales", "[80, 87, 87, 97, 102, 108]"],
    ["5 bornes seulement", "[80, 87, 93, 97, 102]"],
    ["un nombre à virgule", "[80, 87.5, 93, 97, 102, 108]"],
    ["un début sous 30 %", "[20, 87, 93, 97, 102, 108]"],
    ["l'ancien format", '[{"nom":"Z1","min":0,"max":140}]'],
  ])("refuse %s", async (_, bornes) => {
    await expect(essayer(bornes)).rejects.toThrow(/zones_bornes_valides/);
  });
});

describe("test facultatif de puissance max sur 5 min", () => {
  it("s'enregistre avec les autres mesures, ou vide", async () => {
    await enTantQue(A, "insert into tests (date_test, ftp, pma_5min) values ('2027-03-01', 220, 260)");
    await enTantQue(A, "insert into tests (date_test, ftp) values ('2027-03-02', 220)");
    const lignes = await enTantQue<{ pma_5min: number | null }>(
      A,
      "select pma_5min from tests where date_test in ('2027-03-01', '2027-03-02') order by date_test",
    );
    expect(lignes.map((l) => l.pma_5min)).toEqual([260, null]);
    expect(await enTantQue(B, "select pma_5min from tests where date_test = '2027-03-01'")).toHaveLength(0);
    await enTantQue(A, "delete from tests where date_test in ('2027-03-01', '2027-03-02')");
  });

  it("refuse une valeur impossible", async () => {
    await expect(enTantQue(A, "insert into tests (date_test, ftp, pma_5min) values ('2027-03-03', 220, 5000)")).rejects.toThrow(/pma_5min/);
  });
});

describe("historique des tests", () => {
  const saisir = (uid: string, date: string, ftp: number) =>
    enTantQue(
      uid,
      `insert into tests (date_test, ftp) values ($1, $2)
       on conflict (membre_id, date_test) do update set ftp = excluded.ftp`,
      [date, ftp],
    );

  it("chaque série reste avec sa date ; le même jour, la ligne est remplacée", async () => {
    await saisir(A, "2027-01-10", 200);
    await saisir(A, "2027-02-10", 210);
    await saisir(A, "2027-03-10", 215);
    await saisir(A, "2027-03-10", 218); // refait le même jour
    const rows = await enTantQue<{ date_test: string; ftp: number }>(
      A,
      "select to_char(date_test, 'YYYY-MM-DD') as date_test, ftp from tests where date_test >= '2027-01-01' order by date_test",
    );
    expect(rows).toEqual([
      { date_test: "2027-01-10", ftp: 200 },
      { date_test: "2027-02-10", ftp: 210 },
      { date_test: "2027-03-10", ftp: 218 },
    ]);
  });

  it("un membre ne voit pas l'historique d'un autre ; le coach le lit", async () => {
    const parB = await enTantQue(B, "select 1 from tests where membre_id = $1 and date_test >= '2027-01-01'", [A]);
    expect(parB).toHaveLength(0);
    const parCoach = await enTantQue(COACH, "select 1 from tests where membre_id = $1 and date_test >= '2027-01-01'", [A]);
    expect(parCoach).toHaveLength(3);
  });
});

describe("abonnement Stripe", () => {
  it("le membre lit l'état de son abonnement", async () => {
    const [m] = await enTantQue<{ statut_abonnement: string; abonnement_fin: string | null }>(
      A,
      "select statut_abonnement, abonnement_fin from membres where id = $1",
      [A],
    );
    expect(m).toEqual({ statut_abonnement: "inactif", abonnement_fin: null });
  });

  it.each([
    ["stripe_customer_id", "'cus_pirate'"],
    ["stripe_subscription_id", "'sub_pirate'"],
    ["abonnement_fin", "'2099-01-01'"],
    ["annulation_prevue", "true"],
    ["formule", "'annuelle'"],
  ])("le membre ne peut pas modifier %s (ni se prolonger lui-même)", async (colonne, valeur) => {
    await expect(enTantQue(A, `update membres set ${colonne} = ${valeur} where id = $1`, [A])).rejects.toThrow(
      /permission denied/,
    );
  });

  it("les événements Stripe traités sont invisibles et inaccessibles aux membres", async () => {
    await expect(enTantQue(A, "select * from stripe_evenements")).rejects.toThrow(/permission denied/);
    await expect(
      enTantQue(A, "insert into stripe_evenements (id, type) values ('evt_faux', 'invoice.paid')"),
    ).rejects.toThrow(/permission denied/);
    await expect(enTantQue(null, "select * from stripe_evenements")).rejects.toThrow(/permission denied/);
  });
});

describe("droits du serveur (clé secrète Supabase = rôle service_role)", () => {
  /** Requête exécutée comme le webhook Stripe : rôle service_role, sans membre connecté. */
  async function enTantQueServeur(sql: string, params: unknown[] = []) {
    await db.query("begin");
    try {
      await db.query("set local role service_role");
      const r = await db.query(sql, params);
      await db.query("rollback");
      return r.rows;
    } catch (e) {
      await db.query("rollback");
      throw e;
    }
  }

  it("peut noter un événement Stripe traité et le relire", async () => {
    await enTantQueServeur("insert into stripe_evenements (id, type) values ('evt_serveur', 'invoice.paid')");
    await enTantQueServeur("select id from stripe_evenements");
  });

  it("peut lire et mettre à jour l'abonnement d'un membre", async () => {
    const rows = await enTantQueServeur(
      `update membres set statut_abonnement = 'actif', abonnement_fin = now() + interval '30 days',
         stripe_customer_id = 'cus_x', stripe_subscription_id = 'sub_x', annulation_prevue = false,
         formule = 'annuelle'
       where id = $1 returning statut_abonnement`,
      [A],
    );
    expect(rows).toEqual([{ statut_abonnement: "actif" }]);
    await enTantQueServeur("select id, email, role from membres where email = 'a@club.fr'");
  });
});

describe("prénom", () => {
  it("le membre modifie son propre prénom", async () => {
    const rows = await enTantQue(A, "update membres set prenom = 'Caroline' where id = $1 returning prenom", [A]);
    expect(rows).toEqual([{ prenom: "Caroline" }]);
  });

  it("le membre ne peut ni lire ni modifier le prénom d'un autre", async () => {
    expect(await enTantQue(A, "update membres set prenom = 'Pirate' where id = $1 returning id", [B])).toEqual([]);
    expect(await enTantQue(A, "select prenom from membres where id = $1", [B])).toEqual([]);
    const [b] = await enTantQue<{ prenom: string | null }>(B, "select prenom from membres where id = $1", [B]);
    expect(b.prenom).toBeNull();
  });

  it("un prénom vide ou trop long est refusé par la base", async () => {
    await expect(enTantQue(A, "update membres set prenom = '   ' where id = $1", [A])).rejects.toThrow(/check constraint/);
    await expect(enTantQue(A, `update membres set prenom = '${"x".repeat(41)}' where id = $1`, [A])).rejects.toThrow(
      /check constraint/,
    );
  });
});

describe("programme d'entraînement (séances, blocs, rattachement)", () => {
  const TABLES = ["seances", "blocs_seance", "programme"];
  const SEANCE_DEMO = "de000000-0000-0000-0000-000000000201";

  async function enTantQueServeur(sql: string) {
    await db.query("begin");
    try {
      await db.query("set local role service_role");
      // Plusieurs instructions : on garde le résultat de la dernière.
      const r = (await db.query(sql)) as unknown as { rows: unknown[] } | { rows: unknown[] }[];
      return Array.isArray(r) ? r[r.length - 1].rows : r.rows;
    } finally {
      await db.query("rollback");
    }
  }

  it.each(TABLES)("%s : tout membre connecté lit le programme", async (table) => {
    const rows = await enTantQue<{ n: number }>(B, `select count(*)::int as n from ${table}`);
    expect(rows[0].n).toBeGreaterThan(0);
  });

  it.each(TABLES)("%s : un visiteur non connecté n'a accès à rien", async (table) => {
    await expect(enTantQue(null, `select * from ${table}`)).rejects.toThrow(/permission denied/);
  });

  it("un membre (même le coach ou l'admin) ne peut ni ajouter, ni modifier, ni supprimer de séance", async () => {
    for (const qui of [A, COACH, ADMIN]) {
      await expect(enTantQue(qui, "insert into seances (sport, titre, duree_minutes) values ('course', 'Pirate', 30)")).rejects.toThrow(
        /permission denied/,
      );
      await expect(enTantQue(qui, `update seances set titre = 'Pirate' where id = '${SEANCE_DEMO}'`)).rejects.toThrow(/permission denied/);
      await expect(enTantQue(qui, `delete from blocs_seance where seance_id = '${SEANCE_DEMO}'`)).rejects.toThrow(/permission denied/);
      await expect(enTantQue(qui, `delete from programme where seance_id = '${SEANCE_DEMO}'`)).rejects.toThrow(/permission denied/);
    }
  });

  it("le serveur (clé secrète) remplit le programme", async () => {
    const rows = await enTantQueServeur(`
      with s as (insert into seances (sport, titre, duree_minutes) values ('velo', 'Test serveur', 60) returning id),
           b as (insert into blocs_seance (seance_id, ordre, libelle, zone) select id, 1, 'Endurance', 2 from s)
      insert into programme (phase, semaine, jour, niveau, profil, seance_id)
      select 'M', 3, 2, 'finisher', 'intensif', id from s returning semaine`);
    expect(rows).toEqual([{ semaine: 3 }]);
  });

  it("la base refuse une séance, un bloc ou un rattachement incohérent", async () => {
    const refus = [
      "insert into seances (sport, titre, duree_minutes) values ('course', '', 30)",
      "insert into seances (sport, titre, duree_minutes) values ('course', 'Trop courte', 0)",
      `insert into blocs_seance (seance_id, ordre, libelle, zone) values ('${SEANCE_DEMO}', 9, 'Zone 6', 6)`,
      `insert into blocs_seance (seance_id, ordre, libelle) values ('${SEANCE_DEMO}', 1, 'Même ordre')`,
      `insert into programme (phase, semaine, jour, niveau, profil, seance_id) values ('fil_rouge', 1, 8, 'finisher', 'extensif', '${SEANCE_DEMO}')`,
      `insert into programme (phase, semaine, jour, niveau, profil, seance_id) values ('M', 0, 1, 'finisher', 'extensif', '${SEANCE_DEMO}')`,
      // Déjà une séance (ordre 1) le lundi de la semaine 1 du fil rouge, Challenger extensif.
      `insert into programme (phase, semaine, jour, niveau, profil, seance_id) values ('fil_rouge', 1, 1, 'challenger', 'extensif', '${SEANCE_DEMO}')`,
    ];
    for (const sql of refus) await expect(enTantQueServeur(sql), sql).rejects.toThrow(/violates|invalid input/);
  });

  it("supprimer une séance retire aussi ses blocs et ses rattachements", async () => {
    const rows = await enTantQueServeur(`
      delete from seances where id = '${SEANCE_DEMO}';
      select (select count(*) from blocs_seance where seance_id = '${SEANCE_DEMO}')::int as blocs,
             (select count(*) from programme where seance_id = '${SEANCE_DEMO}')::int as rattachements`);
    expect(rows).toEqual([{ blocs: 0, rattachements: 0 }]);
  });

  it("démonstration : une semaine 1 du fil rouge pour chaque niveau et chaque profil, une séance au moins chaque jour", async () => {
    const rows = await enTantQue<{ niveau: string; profil: string; n: number }>(
      A,
      `select niveau, profil, count(*)::int as n from programme
       where phase = 'fil_rouge' and semaine = 1 group by niveau, profil order by niveau, profil`,
    );
    expect(rows).toEqual([
      { niveau: "finisher", profil: "extensif", n: 7 },
      { niveau: "finisher", profil: "intensif", n: 7 },
      { niveau: "challenger", profil: "extensif", n: 7 },
      { niveau: "challenger", profil: "intensif", n: 7 },
      { niveau: "performer", profil: "extensif", n: 8 },
      { niveau: "performer", profil: "intensif", n: 8 },
    ]);
    const [sansBloc] = await enTantQue<{ n: number }>(
      A,
      "select count(*)::int as n from seances s where not exists (select 1 from blocs_seance b where b.seance_id = s.id)",
    );
    expect(sansBloc.n).toBe(0);
    const joursVides = await enTantQue<{ niveau: string; jour: number }>(
      A,
      `select n.niveau, j.jour from unnest(enum_range(null::niveau)) as n (niveau) cross join generate_series(1, 7) as j (jour)
       where not exists (select 1 from programme p where p.phase = 'fil_rouge' and p.semaine = 1 and p.niveau = n.niveau and p.jour = j.jour)`,
    );
    expect(joursVides).toEqual([]);
  });
});

describe("records", () => {
  it("le coach et l'admin lisent les records des athlètes, sans pouvoir les modifier", async () => {
    for (const qui of [COACH, ADMIN]) {
      const rows = await enTantQue<{ membre_id: string }>(qui, "select membre_id from records order by membre_id");
      expect(rows.map((r) => r.membre_id)).toEqual(expect.arrayContaining([A, B]));
      expect(await enTantQue(qui, "update records set duree_secondes = 600 where membre_id = $1 returning id", [A])).toEqual([]);
      expect(await enTantQue(qui, "delete from records where membre_id = $1 returning id", [A])).toEqual([]);
    }
  });

  it("un seul record par membre et par épreuve, et une durée plausible", async () => {
    await expect(enTantQue(A, "insert into records (epreuve, duree_secondes) values ('10km', 2400)")).rejects.toThrow(/duplicate key/);
    await expect(enTantQue(A, "insert into records (epreuve, duree_secondes) values ('marathon', 10)")).rejects.toThrow(/check constraint/);
    await expect(enTantQue(A, "insert into records (epreuve, duree_secondes) values ('100km', 30000)")).rejects.toThrow(/invalid input/);
  });

  it("le membre efface un record (tout est facultatif)", async () => {
    expect(await enTantQue(A, "delete from records where epreuve = '10km' returning epreuve")).toEqual([{ epreuve: "10km" }]);
  });
});

describe("ressentis de séance (données de santé)", () => {
  const SEANCE = "de000000-0000-0000-0000-000000000203";

  beforeAll(async () => {
    await db.query(
      `insert into seances (id, sport, titre, duree_minutes) values ($1, 'course', 'Séance retirée plus tard', 30);
       insert into ressentis (membre_id, seance_id, date_seance, rpe, commentaire)
       values ($2, $1, '2027-01-11', 7, 'Dur'), ($3, $1, '2027-01-11', 3, null);`
        .replaceAll("$1", "'de000000-0000-0000-0000-0000000009ff'")
        .replaceAll("$2", `'${A}'`)
        .replaceAll("$3", `'${B}'`),
    );
  });

  it("le membre marque une séance faite, puis donne son ressenti", async () => {
    await enTantQue(A, "insert into ressentis (seance_id, date_seance) values ($1, '2027-01-12')", [SEANCE]);
    const [r] = await enTantQue<{ rpe: number }>(
      A,
      "update ressentis set rpe = 6, commentaire = 'Bien' where seance_id = $1 and date_seance = '2027-01-12' returning rpe",
      [SEANCE],
    );
    expect(r.rpe).toBe(6);
  });

  it("une séance ne se marque qu'une fois par jour", async () => {
    await expect(enTantQue(A, "insert into ressentis (seance_id, date_seance) values ($1, '2027-01-12')", [SEANCE])).rejects.toThrow(
      /duplicate key/,
    );
  });

  it("le membre ne change que son ressenti : ni la séance, ni la date, ni le membre", async () => {
    for (const col of ["seance_id = null", "date_seance = '2027-01-01'", `membre_id = '${B}'`]) {
      await expect(enTantQue(A, `update ressentis set ${col}`), col).rejects.toThrow(/permission denied/);
    }
  });

  it("RPE de 1 à 10 et commentaire de 500 caractères au plus", async () => {
    await expect(enTantQue(A, "update ressentis set rpe = 11")).rejects.toThrow(/check constraint/);
    await expect(enTantQue(A, `update ressentis set commentaire = '${"x".repeat(501)}'`)).rejects.toThrow(/check constraint/);
  });

  it("le coach et l'admin lisent les ressentis en lecture seule", async () => {
    for (const qui of [COACH, ADMIN]) {
      const rows = await enTantQue<{ membre_id: string }>(qui, "select membre_id from ressentis");
      expect(rows.map((r) => r.membre_id)).toEqual(expect.arrayContaining([A, B]));
      expect(await enTantQue(qui, "update ressentis set rpe = 1 where membre_id = $1 returning id", [A])).toEqual([]);
      expect(await enTantQue(qui, "delete from ressentis where membre_id = $1 returning id", [A])).toEqual([]);
    }
  });

  it("un autre membre et un visiteur ne voient rien", async () => {
    expect(await enTantQue(B, "select * from ressentis where membre_id = $1", [A])).toEqual([]);
    await expect(enTantQue(null, "select * from ressentis")).rejects.toThrow(/permission denied/);
  });

  it("si une séance est retirée du programme, le ressenti reste dans l'historique du membre", async () => {
    await db.query("delete from seances where id = 'de000000-0000-0000-0000-0000000009ff'");
    const rows = await enTantQue<{ seance_id: string | null; rpe: number }>(A, "select seance_id, rpe from ressentis where rpe = 7");
    expect(rows).toEqual([{ seance_id: null, rpe: 7 }]);
  });
});

describe("ressources : déblocage, liens protégés, suivi et commentaires", () => {
  const VIDEO_S1 = "de000000-0000-0000-0001-000000000001"; // vidéo, semaine 1
  const PDF_S1 = "de000000-0000-0000-0001-000000000002"; // PDF, semaine 1
  const VIDEO_S3 = "de000000-0000-0000-0001-000000000003"; // vidéo, semaine 3
  const VIDEO_S5 = "de000000-0000-0000-0001-000000000007"; // vidéo, semaine 5

  beforeAll(async () => {
    // A est inscrit depuis 15 jours (semaine 3), B depuis aujourd'hui (semaine 1).
    await db.query("update membres set date_inscription = now() - interval '15 days', prenom = 'Alice' where id = $1", [A]);
    await db.query("update membres set date_inscription = now(), prenom = null where id = $1", [B]);
    await db.query(
      `update ressources set youtube_id = 'abcdefghijk' where id in ('${VIDEO_S1}', '${VIDEO_S3}', '${VIDEO_S5}');
       update ressources set fichier = 'nutrition/guide.pdf' where id = '${PDF_S1}';`,
    );
  });

  it("semaine d'ancienneté calculée par la base", async () => {
    expect(await enTantQue(A, "select public.semaine_anciennete() as s")).toEqual([{ s: 3 }]);
    expect(await enTantQue(B, "select public.semaine_anciennete() as s")).toEqual([{ s: 1 }]);
  });

  it("tout membre lit le catalogue (titres, semaines), jamais le lien de la vidéo ni le fichier", async () => {
    const rows = await enTantQue<{ n: number }>(B, "select count(*)::int as n from ressources");
    expect(rows[0].n).toBeGreaterThanOrEqual(17);
    await expect(enTantQue(B, "select youtube_id from ressources")).rejects.toThrow(/permission denied/);
    await expect(enTantQue(B, "select fichier from ressources")).rejects.toThrow(/permission denied/);
    await expect(enTantQue(null, "select titre from ressources")).rejects.toThrow(/permission denied/);
  });

  it("liens donnés seulement pour les contenus débloqués", async () => {
    const ids = async (qui: string) =>
      (await enTantQue<{ id: string }>(qui, "select id from public.ressources_medias()")).map((m) => m.id);
    expect(await ids(A)).toEqual(expect.arrayContaining([VIDEO_S1, VIDEO_S3]));
    expect(await ids(A)).not.toContain(VIDEO_S5);
    expect(await ids(B)).toContain(VIDEO_S1);
    expect(await ids(B)).not.toContain(VIDEO_S3);
    expect((await ids(COACH)).length).toBeGreaterThanOrEqual(17); // l'équipe voit tout
    const [m] = await enTantQue<Record<string, unknown>>(B, `select * from public.ressources_medias() where id = '${PDF_S1}'`);
    expect(m).toEqual({ id: PDF_S1, youtube_id: null, fichier_disponible: true, miniature: null }); // jamais le chemin du fichier
  });

  it("chemin du PDF seulement s'il est débloqué", async () => {
    expect(await enTantQue(B, `select public.fichier_ressource('${PDF_S1}') as f`)).toEqual([{ f: "nutrition/guide.pdf" }]);
    expect(await enTantQue(B, `select public.fichier_ressource('${VIDEO_S3}') as f`)).toEqual([{ f: null }]);
    expect(await enTantQue(B, "select public.fichier_debloque('nutrition/guide.pdf') as ok")).toEqual([{ ok: true }]);
  });

  it("favori ou « Vue » refusé sur un contenu verrouillé", async () => {
    await expect(enTantQue(B, `insert into suivi_ressources (ressource_id, favori) values ('${VIDEO_S3}', true)`)).rejects.toThrow(
      /row-level security/,
    );
    await enTantQue(A, `insert into suivi_ressources (ressource_id, favori) values ('${VIDEO_S3}', true)`);
    await enTantQue(A, `update suivi_ressources set consulte_le = now() where ressource_id = '${VIDEO_S3}'`);
    expect(await enTantQue(B, "select * from suivi_ressources where membre_id = $1", [A])).toEqual([]);
  });

  it("commentaire : prénom et rôle de l'auteur ajoutés par la base, impossibles à usurper", async () => {
    const [c] = await enTantQue<{ auteur: string; auteur_role: string }>(
      A,
      `insert into commentaires_ressources (ressource_id, texte) values ('${VIDEO_S1}', 'Merci !') returning auteur, auteur_role`,
    );
    expect(c).toEqual({ auteur: "Alice", auteur_role: "membre" });
    await expect(
      enTantQue(A, `insert into commentaires_ressources (ressource_id, texte, auteur) values ('${VIDEO_S1}', 'x', 'Martin')`),
    ).rejects.toThrow(/permission denied/);
    const [sansPrenom] = await enTantQue<{ auteur: string }>(
      B,
      `insert into commentaires_ressources (ressource_id, texte) values ('${VIDEO_S1}', 'Top') returning auteur`,
    );
    expect(sansPrenom.auteur).toBe("Membre");
  });

  it("commentaire refusé sur une vidéo verrouillée, sur un PDF ou au nom d'un autre", async () => {
    for (const sql of [
      `insert into commentaires_ressources (ressource_id, texte) values ('${VIDEO_S3}', 'Trop tôt')`,
      `insert into commentaires_ressources (ressource_id, texte) values ('${PDF_S1}', 'Sur un PDF')`,
      `insert into commentaires_ressources (ressource_id, membre_id, texte) values ('${VIDEO_S1}', '${A}', 'Au nom de A')`,
    ]) {
      await expect(enTantQue(B, sql), sql).rejects.toThrow(/row-level security/);
    }
  });

  it("les membres lisent les commentaires des vidéos qu'ils ont débloquées, pas les autres", async () => {
    await enTantQue(A, `insert into commentaires_ressources (ressource_id, texte) values ('${VIDEO_S3}', 'Semaine 3')`);
    const textes = (await enTantQue<{ texte: string }>(B, "select texte from commentaires_ressources")).map((c) => c.texte);
    expect(textes).toEqual(expect.arrayContaining(["Merci !", "Top"]));
    expect(textes).not.toContain("Semaine 3");
    await expect(enTantQue(null, "select * from commentaires_ressources")).rejects.toThrow(/permission denied/);
  });

  it("chacun supprime ou modifie ses commentaires, pas ceux des autres ; l'admin peut tout supprimer", async () => {
    expect(await enTantQue(B, "delete from commentaires_ressources where texte = 'Merci !' returning id")).toEqual([]);
    expect(await enTantQue(B, "update commentaires_ressources set texte = 'Pirate' where texte = 'Merci !' returning id")).toEqual([]);
    expect(await enTantQue(COACH, "delete from commentaires_ressources where texte = 'Merci !' returning id")).toEqual([]);
    expect(await enTantQue(ADMIN, "delete from commentaires_ressources where texte = 'Merci !' returning texte")).toEqual([
      { texte: "Merci !" },
    ]);
    expect(await enTantQue(B, "delete from commentaires_ressources where texte = 'Top' returning texte")).toEqual([{ texte: "Top" }]);
  });
});
