-- Le Club by LCS — programme d'entraînement écrit par Martin.
--
-- seances        : une séance (sport, titre, durée), réutilisable d'une semaine à l'autre.
-- blocs_seance   : les étapes d'une séance, dans l'ordre (échauffement, corps de séance…), avec une zone.
-- programme      : rattache une séance à un jour d'une semaine du fil rouge ou d'un bloc,
--                  pour un niveau et un profil.
--
-- Ce n'est pas une donnée personnelle : tout membre connecté peut lire le programme,
-- personne ne peut l'écrire depuis l'app (Martin le remplit côté serveur).
-- Le programme n'est jamais proposé en PDF : il reste dans l'app.

create type public.sport_seance as enum ('natation', 'velo', 'course', 'renfo');
create type public.phase_programme as enum ('fil_rouge', 'S', 'M', 'L', 'XL');

create table public.seances (
  id             uuid primary key default gen_random_uuid(),
  sport          public.sport_seance not null,
  titre          text not null check (char_length(titre) between 1 and 80 and titre = btrim(titre)),
  duree_minutes  integer not null check (duree_minutes between 5 and 600)
);

comment on table public.seances is 'Séances du programme (sport, titre, durée en minutes).';

create table public.blocs_seance (
  id         uuid primary key default gen_random_uuid(),
  seance_id  uuid not null references public.seances (id) on delete cascade,
  ordre      smallint not null check (ordre between 1 and 30),
  libelle    text not null check (char_length(libelle) between 1 and 60 and libelle = btrim(libelle)),
  detail     text not null default '' check (char_length(detail) <= 200),
  zone       smallint check (zone between 1 and 5),  -- vide : pas de zone (renforcement, mobilité)
  unique (seance_id, ordre)
);

comment on table public.blocs_seance is 'Étapes d''une séance, dans l''ordre, avec leur zone (1 à 5) ou sans zone.';

create table public.programme (
  id         uuid primary key default gen_random_uuid(),
  phase      public.phase_programme not null,
  semaine    smallint not null check (semaine between 1 and 52),
  jour       smallint not null check (jour between 1 and 7),  -- 1 = lundi … 7 = dimanche
  niveau     public.niveau not null,
  profil     public.profil not null,
  seance_id  uuid not null references public.seances (id) on delete cascade,
  ordre      smallint not null default 1 check (ordre between 1 and 5),  -- plusieurs séances le même jour
  unique (phase, semaine, niveau, profil, jour, ordre)
);

comment on table public.programme is
  'Séance prévue un jour donné d''une semaine du fil rouge ou d''un bloc (S, M, L, XL), par niveau et par profil.';

create index programme_semaine on public.programme (niveau, profil, phase, semaine);
create index blocs_seance_seance on public.blocs_seance (seance_id, ordre);
create index programme_seance on public.programme (seance_id);

-- ---------------------------------------------------------------------------
-- Sécurité par ligne : lecture pour les membres connectés, aucune écriture depuis l'app.
-- ---------------------------------------------------------------------------
alter table public.seances enable row level security;
alter table public.blocs_seance enable row level security;
alter table public.programme enable row level security;

grant select on public.seances, public.blocs_seance, public.programme to authenticated;
-- Le serveur (clé secrète) remplit le programme.
grant select, insert, update, delete on public.seances, public.blocs_seance, public.programme to service_role;

create policy "connecté : lit les séances" on public.seances
  for select to authenticated using (true);
create policy "connecté : lit les blocs de séance" on public.blocs_seance
  for select to authenticated using (true);
create policy "connecté : lit le programme" on public.programme
  for select to authenticated using (true);
