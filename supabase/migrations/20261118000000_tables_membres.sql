-- Le Club by LCS — tables de base et sécurité par ligne (RLS).
-- Règle : un membre ne voit et ne modifie que ses propres données.
-- L'accès du coach (lecture seule) sera ajouté dans une migration ultérieure.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.niveau as enum ('finisher', 'challenger', 'performer');
create type public.profil as enum ('extensif', 'intensif');
create type public.statut_abonnement as enum (
  'inactif',       -- compte créé, pas encore payé
  'actif',         -- abonnement en cours
  'impaye',        -- paiement en échec, en attente de régularisation
  'resilie'        -- abonnement arrêté
);
create type public.sport as enum ('natation', 'velo', 'course');
create type public.bloc as enum ('S', 'M', 'L', 'XL');

-- ---------------------------------------------------------------------------
-- Membres : une ligne par compte, créée automatiquement à l'inscription.
-- ---------------------------------------------------------------------------
create table public.membres (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text not null unique,
  niveau             public.niveau,   -- choisi par l'athlète lui-même
  profil             public.profil,   -- choisi par l'athlète lui-même
  date_inscription   timestamptz not null default now(),
  statut_abonnement  public.statut_abonnement not null default 'inactif'
);

comment on table public.membres is 'Athlètes abonnés au club.';
comment on column public.membres.statut_abonnement is
  'Modifiable uniquement côté serveur (Stripe), jamais par le membre.';

-- Création automatique de la fiche membre quand un compte est créé.
create function public.creer_membre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.membres (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger a_la_creation_du_compte
  after insert on auth.users
  for each row execute function public.creer_membre();

-- Garde l'e-mail synchronisé si le membre le change.
create function public.synchroniser_email_membre()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.membres set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger au_changement_email
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.synchroniser_email_membre();

-- ---------------------------------------------------------------------------
-- Tests de terrain
-- Unités : allure en secondes par km, FTP en watts,
--          vitesse critique en secondes par 100 m, FC en battements/min.
-- ---------------------------------------------------------------------------
create table public.tests (
  id                          uuid primary key default gen_random_uuid(),
  membre_id                   uuid not null default auth.uid()
                                references public.membres (id) on delete cascade,
  date_test                   date not null,
  allure_seuil_course         integer check (allure_seuil_course between 120 and 900),
  ftp                         integer check (ftp between 50 and 700),
  vitesse_critique_natation   integer check (vitesse_critique_natation between 45 and 300),
  fc_seuil                    integer check (fc_seuil between 80 and 230),
  cree_le                     timestamptz not null default now(),
  constraint au_moins_une_mesure check (
    coalesce(allure_seuil_course, ftp, vitesse_critique_natation, fc_seuil) is not null
  )
);

create index tests_membre_date on public.tests (membre_id, date_test desc);

-- ---------------------------------------------------------------------------
-- Zones personnalisées : une liste de zones par sport et par membre.
-- bornes = [{"nom": "Z1", "min": 0, "max": 150}, ...]
-- Unités : watts (vélo), secondes par km (course), secondes par 100 m (natation).
-- ---------------------------------------------------------------------------
create table public.zones (
  id           uuid primary key default gen_random_uuid(),
  membre_id    uuid not null default auth.uid()
                 references public.membres (id) on delete cascade,
  sport        public.sport not null,
  bornes       jsonb not null check (jsonb_typeof(bornes) = 'array'),
  mis_a_jour   timestamptz not null default now(),
  unique (membre_id, sport)
);

-- ---------------------------------------------------------------------------
-- Objectifs : course visée, avec la taille du bloc de préparation.
-- ---------------------------------------------------------------------------
create table public.objectifs (
  id             uuid primary key default gen_random_uuid(),
  membre_id      uuid not null default auth.uid()
                   references public.membres (id) on delete cascade,
  bloc           public.bloc not null,
  date_objectif  date not null,
  cree_le        timestamptz not null default now()
);

create index objectifs_membre_date on public.objectifs (membre_id, date_objectif);

-- ---------------------------------------------------------------------------
-- Droits : les visiteurs non connectés n'ont accès à rien.
-- Le membre ne peut modifier que son niveau et son profil dans sa fiche.
-- ---------------------------------------------------------------------------
revoke all on public.membres, public.tests, public.zones, public.objectifs from anon;

revoke all on public.membres from authenticated;
grant select on public.membres to authenticated;
grant update (niveau, profil) on public.membres to authenticated;

revoke all on public.tests, public.zones, public.objectifs from authenticated;
grant select, insert, update, delete
  on public.tests, public.zones, public.objectifs to authenticated;

-- ---------------------------------------------------------------------------
-- Sécurité par ligne
-- ---------------------------------------------------------------------------
alter table public.membres   enable row level security;
alter table public.tests     enable row level security;
alter table public.zones     enable row level security;
alter table public.objectifs enable row level security;

create policy "membre : lit sa fiche" on public.membres
  for select to authenticated using (id = (select auth.uid()));
create policy "membre : modifie sa fiche" on public.membres
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "membre : lit ses tests" on public.tests
  for select to authenticated using (membre_id = (select auth.uid()));
create policy "membre : ajoute ses tests" on public.tests
  for insert to authenticated with check (membre_id = (select auth.uid()));
create policy "membre : modifie ses tests" on public.tests
  for update to authenticated
  using (membre_id = (select auth.uid())) with check (membre_id = (select auth.uid()));
create policy "membre : supprime ses tests" on public.tests
  for delete to authenticated using (membre_id = (select auth.uid()));

create policy "membre : lit ses zones" on public.zones
  for select to authenticated using (membre_id = (select auth.uid()));
create policy "membre : ajoute ses zones" on public.zones
  for insert to authenticated with check (membre_id = (select auth.uid()));
create policy "membre : modifie ses zones" on public.zones
  for update to authenticated
  using (membre_id = (select auth.uid())) with check (membre_id = (select auth.uid()));
create policy "membre : supprime ses zones" on public.zones
  for delete to authenticated using (membre_id = (select auth.uid()));

create policy "membre : lit ses objectifs" on public.objectifs
  for select to authenticated using (membre_id = (select auth.uid()));
create policy "membre : ajoute ses objectifs" on public.objectifs
  for insert to authenticated with check (membre_id = (select auth.uid()));
create policy "membre : modifie ses objectifs" on public.objectifs
  for update to authenticated
  using (membre_id = (select auth.uid())) with check (membre_id = (select auth.uid()));
create policy "membre : supprime ses objectifs" on public.objectifs
  for delete to authenticated using (membre_id = (select auth.uid()));
