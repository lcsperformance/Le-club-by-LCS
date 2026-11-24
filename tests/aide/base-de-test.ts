/**
 * Base PostgreSQL de test, avec le minimum de Supabase (rôles, auth.uid) et toutes les migrations.
 * Chaque fichier de test crée sa propre base, supprimée à la fin.
 * Variable TEST_DATABASE_URL (défaut : postgres://postgres:postgres@localhost:5432/postgres).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const ADMIN_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

export type BaseDeTest = {
  /** Connexion « administrateur » (contourne la sécurité par ligne) : pour préparer et vérifier. */
  db: Client;
  /** Exécute une requête en tant que membre connecté (null = visiteur non connecté). */
  enTantQue: <T>(uid: string | null, sql: string, params?: unknown[]) => Promise<T[]>;
  /**
   * Donne un abonnement en cours (un an) à tous les membres qui n'en ont pas : la base ne leur ouvre
   * le contenu du Club (messages, ressources, agenda…) que pendant leur accès (acces_actif).
   */
  abonnerTous: () => Promise<void>;
  fermer: () => Promise<void>;
};

export async function creerBaseDeTest(nom: string): Promise<BaseDeTest> {
  const nomBase = `club_${nom}_${process.pid}`;
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${nomBase}`);
  await admin.query(`create database ${nomBase}`);

  const url = new URL(ADMIN_URL);
  url.pathname = `/${nomBase}`;
  const db = new Client({ connectionString: url.toString() });
  await db.connect();

  await db.query(readFileSync(join(__dirname, "..", "supabase-shim.sql"), "utf8"));
  const dossier = join(__dirname, "..", "..", "supabase", "migrations");
  for (const f of readdirSync(dossier).filter((f) => f.endsWith(".sql")).sort()) {
    await db.query(readFileSync(join(dossier, f), "utf8"));
  }

  async function enTantQue<T>(uid: string | null, sql: string, params: unknown[] = []) {
    await db.query("begin");
    try {
      await db.query(uid ? "set local role authenticated" : "set local role anon");
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid ?? ""]);
      const res = await db.query(sql, params);
      await db.query("commit");
      return res.rows as T[];
    } catch (e) {
      await db.query("rollback");
      throw e;
    }
  }

  async function fermer() {
    await db.end();
    await admin.query(`drop database if exists ${nomBase}`);
    await admin.end();
  }

  async function abonnerTous() {
    await db.query("update membres set abonnement_fin = now() + interval '1 year' where role = 'membre' and abonnement_fin is null");
  }

  return { db, enTantQue, abonnerTous, fermer };
}
