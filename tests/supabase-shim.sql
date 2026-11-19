-- Reproduit le minimum de l'environnement Supabase pour tester la sécurité
-- en local : rôles, schéma auth, fonction auth.uid() et droits par défaut.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
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
