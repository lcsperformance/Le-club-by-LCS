-- Le Club by LCS — suppression du compte par le membre (Profil > « Supprimer mon compte »).
-- Le compte est effacé (toutes ses données suivent, par « on delete cascade »).
-- On garde seulement une trace anonyme : la date, et si un abonnement a été résilié à cette occasion.
-- Aucune donnée personnelle : ni e-mail, ni nom, ni identifiant.

create table public.comptes_supprimes (
  id                  bigint generated always as identity primary key,
  supprime_le         timestamptz not null default now(),
  abonnement_resilie  boolean not null default false
);

comment on table public.comptes_supprimes is 'Trace anonyme des comptes supprimés par leurs titulaires (date seulement).';

alter table public.comptes_supprimes enable row level security;
grant select on public.comptes_supprimes to authenticated;
grant insert on public.comptes_supprimes to service_role;
create policy "admin : lit les suppressions" on public.comptes_supprimes
  for select to authenticated using ((select public.role_actuel()) = 'admin');
