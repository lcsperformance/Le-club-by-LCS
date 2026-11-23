/**
 * PREUVE : seul le rôle admin ajoute, modifie ou supprime les thèmes, sous-rubriques, contenus et
 * fichiers des Ressources, et modère les commentaires. Un membre et un coach ne peuvent rien écrire.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const MEMBRE = "00000000-0000-0000-0000-0000000000a1";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";
const VIDEO = "de000000-0000-0000-0001-000000000001"; // Nutrition › Les bases, semaine 1

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);

beforeAll(async () => {
  base = await creerBaseDeTest("admin_ressources");
  await base.db.query(
    "insert into auth.users (id, email) values ($1, 'membre@club.fr'), ($2, 'coach@club.fr'), ($3, 'admin@club.fr')",
    [MEMBRE, COACH, ADMIN],
  );
  await base.db.query("update membres set role = 'coach' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin', prenom = 'Pauline' where id = $1", [ADMIN]);
});

afterAll(async () => {
  await base?.fermer();
});

describe("thèmes et sous-rubriques", () => {
  it("les 5 thèmes et leurs sous-rubriques sont en base, lisibles par tout membre", async () => {
    const themes = await en<{ nom: string }>(MEMBRE, "select nom from themes_ressources order by ordre");
    expect(themes.map((t) => t.nom)).toEqual(["Nutrition", "Natation", "Vélo", "Course à pied", "Préparation"]);
    expect((await en<{ n: number }>(MEMBRE, "select count(*)::int as n from sous_rubriques"))[0].n).toBe(10);
    await expect(en(null, "select * from themes_ressources")).rejects.toThrow(/permission denied/);
  });

  it("un membre ou un coach ne peut ni ajouter, ni renommer, ni supprimer", async () => {
    for (const qui of [MEMBRE, COACH]) {
      await expect(en(qui, "insert into themes_ressources (cle, nom, icone) values ('pirate', 'Pirate', 'velo')")).rejects.toThrow(
        /row-level security/,
      );
      await expect(en(qui, "insert into sous_rubriques (theme, cle, nom) values ('velo', 'pirate', 'Pirate')")).rejects.toThrow(
        /row-level security/,
      );
      expect(await en(qui, "update themes_ressources set nom = 'Pirate' returning cle")).toEqual([]);
      expect(await en(qui, "update sous_rubriques set nom = 'Pirate' returning cle")).toEqual([]);
      expect(await en(qui, "delete from sous_rubriques where theme = 'natation' and cle = 'eau_libre' returning cle")).toEqual([]);
    }
  });

  it("l'admin ajoute, renomme et supprime un thème vide (avec ses sous-rubriques)", async () => {
    await en(ADMIN, "insert into themes_ressources (cle, nom, icone, ordre) values ('mental', 'Mental', 'preparation', 6)");
    await en(ADMIN, "insert into sous_rubriques (theme, cle, nom) values ('mental', 'sommeil', 'Sommeil')");
    expect(await en(ADMIN, "update themes_ressources set nom = 'Mental & sommeil' where cle = 'mental' returning nom")).toEqual([
      { nom: "Mental & sommeil" },
    ]);
    expect(await en(ADMIN, "delete from themes_ressources where cle = 'mental' returning cle")).toEqual([{ cle: "mental" }]);
    expect(await en(ADMIN, "select * from sous_rubriques where theme = 'mental'")).toEqual([]);
  });

  it("supprimer un thème ou une sous-rubrique qui contient des contenus est refusé, même par l'admin", async () => {
    await expect(en(ADMIN, "delete from themes_ressources where cle = 'nutrition'")).rejects.toThrow(/violates foreign key/);
    await expect(en(ADMIN, "delete from sous_rubriques where theme = 'nutrition' and cle = 'bases'")).rejects.toThrow(/violates foreign key/);
    expect((await en<{ n: number }>(ADMIN, "select count(*)::int as n from ressources where theme = 'nutrition'"))[0].n).toBe(4);
  });

  it("un contenu ne peut pas être rangé dans une sous-rubrique qui n'existe pas", async () => {
    await expect(
      en(ADMIN, "insert into ressources (theme, sous_rubrique, titre, type, semaine_deblocage) values ('velo', 'inconnue', 'X', 'pdf', 1)"),
    ).rejects.toThrow(/violates foreign key/);
  });
});

describe("contenus", () => {
  it("un membre ou un coach ne peut ni ajouter, ni modifier, ni supprimer un contenu", async () => {
    for (const qui of [MEMBRE, COACH]) {
      await expect(
        en(qui, "insert into ressources (theme, sous_rubrique, titre, type, semaine_deblocage) values ('velo', 'puissance', 'Pirate', 'pdf', 1)"),
      ).rejects.toThrow(/row-level security/);
      // Modifier : refusé (aucune ligne touchée) ; débloquer un contenu en avance, par exemple, est impossible.
      expect(await en(qui, `update ressources set semaine_deblocage = 1 where id = '${VIDEO}' returning id`)).toEqual([]);
      expect(await en(qui, `update ressources set youtube_id = 'abcdefghijk' where id = '${VIDEO}' returning id`)).toEqual([]);
      expect(await en(qui, `delete from ressources where id = '${VIDEO}' returning id`)).toEqual([]);
    }
  });

  it("seul l'admin lit la fiche complète (lien, fichier, miniature)", async () => {
    for (const qui of [MEMBRE, COACH]) {
      await expect(en(qui, "select * from public.admin_ressources()")).rejects.toThrow(/réservée à un administrateur/);
    }
    expect((await en<{ n: number }>(ADMIN, "select count(*)::int as n from public.admin_ressources()"))[0].n).toBe(17);
  });

  it("l'admin ajoute une vidéo avec lien et miniature, la modifie, puis la supprime", async () => {
    const [c] = await en<{ id: string }>(
      ADMIN,
      `insert into ressources (theme, sous_rubrique, titre, type, semaine_deblocage, youtube_id, miniature)
       values ('velo', 'puissance', 'Intervalles au seuil', 'video', 2, 'dQw4w9WgXcQ', 'velo/miniature.webp') returning id`,
    );
    const [media] = await en<{ youtube_id: string; miniature: string }>(MEMBRE, `select * from public.ressources_medias() where id = '${c.id}'`);
    expect(media).toBeUndefined(); // semaine 2 : pas encore débloquée pour un membre inscrit aujourd'hui
    const [vuAdmin] = await en<{ miniature: string }>(ADMIN, `select miniature from public.ressources_medias() where id = '${c.id}'`);
    expect(vuAdmin.miniature).toBe("velo/miniature.webp");
    expect(await en(ADMIN, `update ressources set semaine_deblocage = 1 where id = '${c.id}' returning semaine_deblocage`)).toEqual([
      { semaine_deblocage: 1 },
    ]);
    const [ouvert] = await en<{ miniature: string }>(MEMBRE, `select miniature from public.ressources_medias() where id = '${c.id}'`);
    expect(ouvert.miniature).toBe("velo/miniature.webp");
    expect(await en(ADMIN, `delete from ressources where id = '${c.id}' returning id`)).toEqual([{ id: c.id }]);
  });

  it("une vidéo n'a pas de PDF, un PDF n'a pas de lien vidéo", async () => {
    await expect(en(ADMIN, `update ressources set fichier = 'a/b.pdf' where id = '${VIDEO}'`)).rejects.toThrow(/ressource_media_coherent/);
  });
});

describe("fichiers (stockage)", () => {
  it("un membre ou un coach ne peut déposer, remplacer ni supprimer aucun fichier", async () => {
    await base.db.query("insert into storage.objects (bucket_id, name) values ('miniatures', 'velo/existante.webp')");
    for (const qui of [MEMBRE, COACH]) {
      for (const bucket of ["ressources", "miniatures"]) {
        await expect(en(qui, `insert into storage.objects (bucket_id, name) values ('${bucket}', 'velo/pirate.pdf')`)).rejects.toThrow(
          /row-level security/,
        );
      }
      expect(await en(qui, "delete from storage.objects where name = 'velo/existante.webp' returning name")).toEqual([]);
      expect(await en(qui, "update storage.objects set name = 'velo/pirate.webp' returning name")).toEqual([]);
    }
  });

  it("l'admin dépose et supprime les PDF et les miniatures", async () => {
    await en(ADMIN, "insert into storage.objects (bucket_id, name) values ('ressources', 'velo/guide.pdf'), ('miniatures', 'velo/m.webp')");
    expect(
      await en(ADMIN, "delete from storage.objects where name in ('velo/guide.pdf', 'velo/m.webp', 'velo/existante.webp') returning name"),
    ).toHaveLength(3);
  });

  it("aucun autre espace de stockage n'est ouvert à l'admin par ces règles", async () => {
    await base.db.query("insert into storage.buckets (id, name) values ('autre', 'autre')");
    await expect(en(ADMIN, "insert into storage.objects (bucket_id, name) values ('autre', 'x.pdf')")).rejects.toThrow(/row-level security/);
  });
});

describe("modération des commentaires", () => {
  let cid: string;

  beforeAll(async () => {
    [{ id: cid }] = await en<{ id: string }>(MEMBRE, `insert into commentaires_ressources (ressource_id, texte) values ('${VIDEO}', 'Message à modérer') returning id`);
  });

  it("seul l'admin peut modérer : le coach ne supprime pas le commentaire d'un membre", async () => {
    for (const qui of [MEMBRE, COACH]) {
      await expect(en(qui, `select public.admin_supprimer_commentaire('${cid}')`)).rejects.toThrow(/réservée à un administrateur/);
    }
    expect(await en(COACH, `delete from commentaires_ressources where id = '${cid}' returning id`)).toEqual([]);
  });

  it("l'admin supprime le commentaire ; la suppression est notée dans le journal", async () => {
    await en(ADMIN, `select public.admin_supprimer_commentaire('${cid}')`);
    expect(await en(ADMIN, `select * from commentaires_ressources where id = '${cid}'`)).toEqual([]);
    const journal = await en<{ membre_id: string; admin_id: string; action: string; detail: string }>(
      ADMIN,
      "select membre_id, admin_id, action, detail from journal_admin where action = 'commentaire_supprime'",
    );
    expect(journal).toEqual([{ membre_id: MEMBRE, admin_id: ADMIN, action: "commentaire_supprime", detail: "Message à modérer" }]);
    await expect(en(ADMIN, `select public.admin_supprimer_commentaire('${cid}')`)).rejects.toThrow(/introuvable/);
  });
});
