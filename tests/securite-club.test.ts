/**
 * PREUVE : canaux du Club. Tout membre connecté lit et écrit en son nom ; « annonces » est réservé
 * à l'admin et au coach ; chacun supprime ses messages, l'admin n'importe lequel (noté au journal) ;
 * aucun canal ne peut être créé, donc aucune conversation privée n'est possible.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

const ALICE = "00000000-0000-0000-0000-0000000000a1";
const BRUNO = "00000000-0000-0000-0000-0000000000b2";
const COACH = "00000000-0000-0000-0000-0000000000c0";
const ADMIN = "00000000-0000-0000-0000-0000000000ad";

let base: BaseDeTest;
const en = <T>(qui: string | null, sql: string, params: unknown[] = []) => base.enTantQue<T>(qui, sql, params);
const ecrire = async (qui: string, canal: string, texte: string) =>
  (await en<{ id: string }>(qui, "insert into messages_club (canal, texte) values ($1, $2) returning id", [canal, texte]))[0].id;
const nonLus = async (qui: string) =>
  Object.fromEntries((await en<{ canal: string; non_lus: number }>(qui, "select * from public.canaux_non_lus()")).map((l) => [l.canal, l.non_lus]));

beforeAll(async () => {
  base = await creerBaseDeTest("club");
  await base.db.query(
    "insert into auth.users (id, email) values ($1, 'alice@club.fr'), ($2, 'bruno@club.fr'), ($3, 'coach@club.fr'), ($4, 'admin@club.fr')",
    [ALICE, BRUNO, COACH, ADMIN],
  );
  // Inscrits il y a une heure : les messages d'avant ne comptent pas comme non lus.
  await base.db.query("update membres set date_inscription = now() - interval '1 hour'");
  await base.db.query("update membres set prenom = 'Alice' where id = $1", [ALICE]);
  await base.db.query("update membres set role = 'coach', prenom = 'Martin' where id = $1", [COACH]);
  await base.db.query("update membres set role = 'admin' where id = $1", [ADMIN]);
});

afterAll(async () => {
  await base?.fermer();
});

describe("canaux", () => {
  it("les 9 canaux (blocs S, M, L, XL), annonces en lecture seule", async () => {
    const canaux = await en<{ cle: string; lecture_seule: boolean }>(ALICE, "select cle, lecture_seule from canaux order by ordre");
    expect(canaux.map((c) => c.cle)).toEqual(["annonces", "general", "presentations", "bloc-s", "bloc-m", "bloc-l", "bloc-xl", "nutrition-matos", "courses"]);
    expect(canaux.filter((c) => c.lecture_seule).map((c) => c.cle)).toEqual(["annonces"]);
  });

  it("aucun compte, même l'admin, ne peut créer, renommer ou supprimer un canal : pas de canal privé", async () => {
    for (const qui of [ALICE, COACH, ADMIN]) {
      await expect(en(qui, "insert into canaux (cle, nom, description, ordre) values ('prive', 'privé', 'Alice et le coach', 8)")).rejects.toThrow(
        /permission denied/,
      );
      await expect(en(qui, "update canaux set lecture_seule = false where cle = 'annonces'")).rejects.toThrow(/permission denied/);
      await expect(en(qui, "delete from canaux where cle = 'general'")).rejects.toThrow(/permission denied/);
    }
  });

  it("un message va forcément dans un canal collectif existant, sans destinataire", async () => {
    await expect(en(ALICE, "insert into messages_club (canal, texte) values ('alice-coach', 'En privé ?')")).rejects.toThrow(/foreign key/);
    const colonnes = await en<{ column_name: string }>(
      ALICE,
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'messages_club' order by column_name",
    );
    expect(colonnes.map((c) => c.column_name)).toEqual(["auteur", "auteur_role", "canal", "cree_le", "id", "membre_id", "texte"]);
  });

  it("un visiteur non connecté ne lit rien", async () => {
    await expect(en(null, "select * from canaux")).rejects.toThrow(/permission denied/);
    await expect(en(null, "select * from messages_club")).rejects.toThrow(/permission denied/);
  });
});

describe("écrire", () => {
  it("tout membre écrit dans un canal ouvert et lit les messages des autres", async () => {
    await ecrire(ALICE, "general", "Salut le Club !");
    const lus = await en<{ auteur: string; texte: string }>(BRUNO, "select auteur, texte from messages_club where canal = 'general'");
    expect(lus).toEqual([{ auteur: "Alice", texte: "Salut le Club !" }]);
  });

  it("prénom, rôle et heure ajoutés par la base, impossibles à usurper", async () => {
    await expect(en(BRUNO, "insert into messages_club (canal, texte, auteur) values ('general', 'Je suis le coach', 'Martin')")).rejects.toThrow(
      /permission denied/,
    );
    await expect(en(BRUNO, "insert into messages_club (canal, membre_id, texte) values ('general', $1, 'Au nom d''Alice')", [ALICE])).rejects.toThrow(
      /row-level security/,
    );
    const [b] = await en<{ auteur: string; auteur_role: string }>(BRUNO, "insert into messages_club (canal, texte) values ('general', 'Hello') returning auteur, auteur_role");
    expect(b).toEqual({ auteur: "Membre", auteur_role: "membre" });
  });

  it("annonces : refusé à un membre, permis au coach et à l'admin", async () => {
    await expect(ecrire(ALICE, "annonces", "Annonce pirate")).rejects.toThrow(/row-level security/);
    await ecrire(COACH, "annonces", "Séance de test samedi");
    await ecrire(ADMIN, "annonces", "Nouvelle vidéo en ligne");
    const [c] = await en<{ auteur: string; auteur_role: string }>(ALICE, "select auteur, auteur_role from messages_club where canal = 'annonces' order by cree_le limit 1");
    expect(c).toEqual({ auteur: "Martin", auteur_role: "coach" });
  });

  it("un message ne se modifie pas après coup", async () => {
    await expect(en(ALICE, "update messages_club set texte = 'Modifié' where auteur = 'Alice'")).rejects.toThrow(/permission denied/);
  });
});

describe("supprimer", () => {
  it("chacun supprime ses messages, pas ceux des autres (le coach non plus)", async () => {
    const id = await ecrire(ALICE, "presentations", "Moi c'est Alice, je prépare un M");
    expect(await en(BRUNO, "delete from messages_club where id = $1 returning id", [id])).toEqual([]);
    expect(await en(COACH, "delete from messages_club where id = $1 returning id", [id])).toEqual([]);
    expect(await en(ALICE, "delete from messages_club where id = $1 returning id", [id])).toEqual([{ id }]);
  });

  it("l'admin supprime n'importe quel message ; la suppression est notée dans le journal", async () => {
    const id = await ecrire(BRUNO, "courses", "Message à retirer");
    for (const qui of [ALICE, BRUNO, COACH]) {
      await expect(en(qui, "select public.admin_supprimer_message($1)", [id])).rejects.toThrow(/réservée à un administrateur/);
    }
    await en(ADMIN, "select public.admin_supprimer_message($1)", [id]);
    expect(await en(ADMIN, "select * from messages_club where id = $1", [id])).toEqual([]);
    expect(await en(ADMIN, "select membre_id, action, detail from journal_admin where action = 'message_supprime'")).toEqual([
      { membre_id: BRUNO, action: "message_supprime", detail: "#courses : Message à retirer" },
    ]);
  });
});

describe("non-lus", () => {
  it("compte les messages des autres depuis la dernière lecture, jamais les siens", async () => {
    await en(ALICE, "select public.marquer_canal_lu('bloc-m')");
    await ecrire(BRUNO, "bloc-m", "Séance au seuil ce soir ?");
    await ecrire(BRUNO, "bloc-m", "Je pars à 19 h");
    await ecrire(ALICE, "bloc-m", "Je viens !");
    expect((await nonLus(ALICE))["bloc-m"]).toBe(2);
    expect((await nonLus(BRUNO))["bloc-m"]).toBe(1);
  });

  it("ouvrir le canal le marque comme lu", async () => {
    await en(ALICE, "select public.marquer_canal_lu('bloc-m')");
    expect((await nonLus(ALICE))["bloc-m"]).toBe(0);
  });

  it("chacun ne lit que ses propres lectures, et ne les écrit que par la fonction prévue", async () => {
    expect(await en(BRUNO, "select * from lectures_canaux where membre_id = $1", [ALICE])).toEqual([]);
    await expect(en(BRUNO, "insert into lectures_canaux (membre_id, canal) values ($1, 'general')", [ALICE])).rejects.toThrow(/permission denied/);
    await expect(en(BRUNO, "update lectures_canaux set lu_jusqua = now()")).rejects.toThrow(/permission denied/);
    expect(await en(null, "select public.canaux_non_lus()").catch((e: Error) => e.message)).toMatch(/permission denied/);
  });
});
