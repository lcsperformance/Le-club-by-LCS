/**
 * Migrations de la base Supabase, suivies dans supabase_migrations.schema_migrations
 * (la même table que la CLI Supabase, pour pouvoir passer à `supabase db push` plus tard).
 *
 *   node scripts/migrations.mjs etat       → liste les migrations appliquées et en attente
 *   node scripts/migrations.mjs appliquer  → applique celles en attente, une par une
 *
 * Variables : SUPABASE_PROJECT_REF (référence du projet) et SUPABASE_ACCESS_TOKEN
 * (jeton personnel Supabase, ou n'importe quelle valeur si un proxy l'ajoute pour vous).
 */
import { readdirSync, readFileSync } from "node:fs";

const REF = process.env.SUPABASE_PROJECT_REF;
const JETON = process.env.SUPABASE_ACCESS_TOKEN;
if (!REF || !JETON) {
  console.error("Renseigne SUPABASE_PROJECT_REF et SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}

const DOSSIER = new URL("../supabase/migrations/", import.meta.url);

async function requete(sql) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${JETON}` },
    body: JSON.stringify({ query: sql }),
  });
  const corps = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(corps.message ?? `Erreur ${r.status}`);
  return corps;
}

const texteSql = (t) => `'${t.replaceAll("'", "''")}'`;

async function appliquees() {
  await requete(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key, statements text[], name text
    );`);
  const lignes = await requete("select version from supabase_migrations.schema_migrations order by version");
  return new Set(lignes.map((l) => l.version));
}

function locales() {
  return readdirSync(DOSSIER)
    .filter((f) => /^\d{14}_.+\.sql$/.test(f))
    .sort()
    .map((f) => ({ fichier: f, version: f.slice(0, 14), nom: f.slice(15, -4) }));
}

const commande = process.argv[2];
const faites = await appliquees();
const enAttente = locales().filter((m) => !faites.has(m.version));

if (commande === "etat") {
  for (const m of locales()) console.log(`${faites.has(m.version) ? "✓ appliquée " : "… en attente"}  ${m.fichier}`);
} else if (commande === "appliquer") {
  if (!enAttente.length) console.log("Aucune migration en attente.");
  for (const m of enAttente) {
    const sql = readFileSync(new URL(m.fichier, DOSSIER), "utf8");
    // Migration et enregistrement dans la même transaction : tout ou rien.
    await requete(`begin;
${sql}
insert into supabase_migrations.schema_migrations (version, name, statements)
  values (${texteSql(m.version)}, ${texteSql(m.nom)}, array[${texteSql(sql)}]);
commit;`);
    console.log(`✓ ${m.fichier}`);
  }
} else if (commande === "marquer-appliquee") {
  // Pour les migrations appliquées à la main avant ce script : les noter sans les rejouer.
  const version = process.argv[3];
  const m = locales().find((x) => x.version === version);
  if (!m) throw new Error(`Migration ${version} introuvable.`);
  const sql = readFileSync(new URL(m.fichier, DOSSIER), "utf8");
  await requete(`insert into supabase_migrations.schema_migrations (version, name, statements)
    values (${texteSql(m.version)}, ${texteSql(m.nom)}, array[${texteSql(sql)}]) on conflict do nothing`);
  console.log(`✓ ${m.fichier} notée comme appliquée`);
} else {
  console.log("Usage : node scripts/migrations.mjs etat | appliquer | marquer-appliquee <version>");
}
