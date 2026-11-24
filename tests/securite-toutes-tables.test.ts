/**
 * CONTRÔLE GÉNÉRAL : chaque table de la base a la sécurité par ligne activée, un visiteur non connecté
 * n'y a aucun droit, et chaque table est rangée dans une catégorie connue (qui la lit).
 * Une nouvelle table fait échouer ce test tant qu'elle n'est pas ajoutée ci-dessous, avec ses preuves.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerBaseDeTest, type BaseDeTest } from "./aide/base-de-test";

/** Qui lit chaque table (détail et preuves dans les fichiers tests/securite-*.test.ts). */
const TABLES: Record<string, string> = {
  // Données personnelles : le membre (les siennes) ; l'encadrement en lecture seule.
  membres: "le membre (sa fiche) ; l'admin (toutes) ; le coach par coach_athletes()",
  tests: "le membre ; coach et admin en lecture",
  zones: "le membre ; coach et admin en lecture",
  objectifs: "le membre ; coach et admin en lecture",
  records: "le membre ; coach et admin en lecture",
  ressentis: "le membre (RPE, commentaire) ; coach et admin en lecture",
  // Privé à chaque membre.
  suivi_ressources: "le membre seulement",
  lectures_canaux: "le membre seulement",
  appareils_notifications: "le membre seulement",
  // Contenu partagé : comptes avec un accès en cours (acces_actif).
  messages_club: "accès en cours",
  questions_faq: "accès en cours",
  canaux: "accès en cours",
  evenements: "accès en cours",
  ressources: "accès en cours (liens et fichiers : contenus débloqués)",
  themes_ressources: "accès en cours",
  sous_rubriques: "accès en cours",
  commentaires_ressources: "accès en cours, vidéo débloquée",
  partenaires: "accès en cours (affichés) ; admin (tous)",
  // Programme : le serveur seulement (titre, sport et durée des séances pour les membres).
  programme: "serveur",
  blocs_seance: "serveur",
  seances: "membres : titre, sport, durée ; contenu : serveur",
  // Administration et serveur.
  journal_admin: "admin",
  comptes_supprimes: "admin",
  stripe_evenements: "serveur",
  rappels_faq_envoyes: "serveur",
};

let base: BaseDeTest;

beforeAll(async () => {
  base = await creerBaseDeTest("touteslestables");
});

afterAll(async () => {
  await base?.fermer();
});

describe("toutes les tables", () => {
  it("chaque table de la base est connue (sinon : l'ajouter ici, avec ses tests de sécurité)", async () => {
    const { rows } = await base.db.query(
      "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1",
    );
    expect(rows.map((r) => r.relname)).toEqual(Object.keys(TABLES).sort());
  });

  it("la sécurité par ligne est activée partout", async () => {
    const { rows } = await base.db.query(
      "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity",
    );
    expect(rows).toEqual([]);
  });

  it("un visiteur non connecté n'a aucun droit sur aucune table", async () => {
    const { rows } = await base.db.query(
      `select c.relname, p.droit from pg_class c join pg_namespace n on n.oid = c.relnamespace
       cross join unnest(array['select', 'insert', 'update', 'delete']) as p (droit)
       where n.nspname = 'public' and c.relkind = 'r' and has_table_privilege('anon', c.oid, p.droit)`,
    );
    expect(rows).toEqual([]);
  });

  it("aucune vue publique ne contourne ces règles", async () => {
    const { rows } = await base.db.query("select table_name from information_schema.views where table_schema = 'public'");
    expect(rows).toEqual([]);
  });

  it("les fonctions qui passent outre la sécurité ont un chemin de recherche verrouillé", async () => {
    const { rows } = await base.db.query(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prosecdef and not coalesce(array_to_string(p.proconfig, ',') like '%search_path%', false)`,
    );
    expect(rows).toEqual([]);
  });
});
