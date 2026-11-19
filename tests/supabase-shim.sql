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

-- Comme Supabase : par défaut, tout est accordé sur les nouvelles tables.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
