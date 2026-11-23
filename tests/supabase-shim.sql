-- Reproduit le minimum de l'environnement Supabase pour tester la sécurité
-- en local : rôles, schéma auth, fonction auth.uid() et droits par défaut.
-- Les rôles sont communs à tout le serveur PostgreSQL : plusieurs fichiers de tests peuvent
-- essayer de les créer au même instant. On ignore donc l'erreur « existe déjà ».
do $$ begin
  begin create role anon nologin; exception when duplicate_object or unique_violation then null; end;
  begin create role authenticated nologin; exception when duplicate_object or unique_violation then null; end;
  begin create role service_role nologin bypassrls; exception when duplicate_object or unique_violation then null; end;
end $$;

create schema auth;
create table auth.users (id uuid primary key, email text);

create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;

-- Comme le projet Supabase réel : les nouvelles tables ne donnent AUCUN droit de lecture ou
-- d'écriture par défaut (seulement truncate, references, trigger, maintain). Chaque migration
-- doit accorder explicitement les droits nécessaires, y compris au serveur (service_role).
alter default privileges in schema public grant truncate, references, trigger on tables to anon, authenticated, service_role;

-- Stockage de fichiers (minimum de Supabase Storage) : comme sur Supabase, les membres connectés ont
-- les droits sur storage.objects et la sécurité par ligne décide de ce qu'ils peuvent lire.
-- Le stockage ne crée un lien de téléchargement que si la personne peut lire la ligne du fichier.
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean not null default false);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null
);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
