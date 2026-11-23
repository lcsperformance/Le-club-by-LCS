/**
 * PREUVE : les ressources se débloquent selon l'ancienneté, et le fichier d'un contenu verrouillé
 * est inaccessible, même pour un membre qui connaît son adresse.
 *
 * Bruno est inscrit depuis 2 semaines (14 jours : il est dans sa 3e semaine d'abonnement).
 * Contenus de démonstration utilisés :
 *   - « Guide : composer ses repas » (PDF, débloqué semaine 1)
 *   - « Les macronutriments en 5 minutes » (vidéo, débloquée semaine 1)
 *   - « Tableau des apports en glucides » (PDF, débloqué semaine 4)
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const BRUNO = "00000000-0000-0000-0000-0000000000b2";
const PDF_SEMAINE_1 = "de000000-0000-0000-0001-000000000002";
const VIDEO_SEMAINE_1 = "de000000-0000-0000-0001-000000000001";
const PDF_SEMAINE_4 = "de000000-0000-0000-0001-000000000004";
const FICHIER_SEMAINE_1 = "nutrition/guide-repas.pdf";
const FICHIER_SEMAINE_4 = "nutrition/tableau-glucides.pdf";

let base: BaseDeTest;
const bruno = <T>(sql: string, params: unknown[] = []) => base.enTantQue<T>(BRUNO, sql, params);

beforeAll(async () => {
  base = await creerBaseDeTest("ressources");
  await base.db.query("insert into auth.users (id, email) values ($1, 'bruno@club.fr')", [BRUNO]);
  await base.db.query("update membres set date_inscription = now() - interval '14 days' where id = $1", [BRUNO]);
  await base.db.query(
    `update ressources set fichier = '${FICHIER_SEMAINE_1}' where id = '${PDF_SEMAINE_1}';
     update ressources set fichier = '${FICHIER_SEMAINE_4}' where id = '${PDF_SEMAINE_4}';
     update ressources set youtube_id = 'abcdefghijk' where id = '${VIDEO_SEMAINE_1}';
     insert into storage.objects (bucket_id, name) values ('ressources', '${FICHIER_SEMAINE_1}'), ('ressources', '${FICHIER_SEMAINE_4}');`,
  );
});

afterAll(async () => {
  await base?.fermer();
});

describe("membre inscrit depuis 2 semaines", () => {
  it("est dans sa 3e semaine d'abonnement", async () => {
    expect(await bruno("select public.semaine_anciennete() as semaine")).toEqual([{ semaine: 3 }]);
  });

  it("voit en clair un contenu débloqué à la semaine 1 : vidéo et PDF", async () => {
    expect(await bruno(`select public.ressource_debloquee('${PDF_SEMAINE_1}') as ok`)).toEqual([{ ok: true }]);
    const medias = await bruno<{ id: string; youtube_id: string | null; fichier_disponible: boolean }>(
      `select * from public.ressources_medias() where id in ('${PDF_SEMAINE_1}', '${VIDEO_SEMAINE_1}') order by id`,
    );
    expect(medias).toEqual([
      { id: VIDEO_SEMAINE_1, youtube_id: "abcdefghijk", fichier_disponible: false, miniature: null },
      { id: PDF_SEMAINE_1, youtube_id: null, fichier_disponible: true, miniature: null },
    ]);
    expect(await bruno(`select public.fichier_ressource('${PDF_SEMAINE_1}') as f`)).toEqual([{ f: FICHIER_SEMAINE_1 }]);
  });

  it("voit verrouillé un contenu débloqué à la semaine 4 : titre et semaine d'ouverture, rien d'autre", async () => {
    expect(await bruno(`select titre, semaine_deblocage from ressources where id = '${PDF_SEMAINE_4}'`)).toEqual([
      { titre: "Tableau des apports en glucides", semaine_deblocage: 4 },
    ]);
    expect(await bruno(`select public.ressource_debloquee('${PDF_SEMAINE_4}') as ok`)).toEqual([{ ok: false }]);
    expect(await bruno(`select * from public.ressources_medias() where id = '${PDF_SEMAINE_4}'`)).toEqual([]);
  });

  it("ne peut pas avancer son ancienneté en changeant sa date d'inscription", async () => {
    await expect(bruno("update membres set date_inscription = now() - interval '1 year' where id = $1", [BRUNO])).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("fichier d'un contenu verrouillé, même en connaissant son adresse", () => {
  it("la base ne donne pas son chemin", async () => {
    expect(await bruno(`select public.fichier_ressource('${PDF_SEMAINE_4}') as f`)).toEqual([{ f: null }]);
    await expect(bruno(`select fichier from ressources where id = '${PDF_SEMAINE_4}'`)).rejects.toThrow(/permission denied/);
  });

  it("le stockage refuse le fichier quand on le demande par son adresse exacte", async () => {
    // Le stockage Supabase ne crée un lien de téléchargement que si le membre peut lire la ligne du fichier.
    expect(
      await bruno(`select name from storage.objects where bucket_id = 'ressources' and name = '${FICHIER_SEMAINE_4}'`),
    ).toEqual([]);
    expect(await bruno(`select public.fichier_debloque('${FICHIER_SEMAINE_4}') as ok`)).toEqual([{ ok: false }]);
    // Contre-épreuve : le fichier d'un contenu débloqué, lui, est accessible.
    expect(await bruno(`select name from storage.objects where bucket_id = 'ressources'`)).toEqual([{ name: FICHIER_SEMAINE_1 }]);
  });

  it("un visiteur non connecté n'atteint aucun fichier", async () => {
    expect(await base.enTantQue(null, "select name from storage.objects where bucket_id = 'ressources'")).toEqual([]);
  });

  it("le contenu s'ouvre de lui-même en semaine 4", async () => {
    await base.db.query("update membres set date_inscription = now() - interval '21 days' where id = $1", [BRUNO]);
    expect(await bruno(`select public.fichier_ressource('${PDF_SEMAINE_4}') as f`)).toEqual([{ f: FICHIER_SEMAINE_4 }]);
    expect(
      await bruno(`select name from storage.objects where bucket_id = 'ressources' and name = '${FICHIER_SEMAINE_4}'`),
    ).toEqual([{ name: FICHIER_SEMAINE_4 }]);
  });
});
