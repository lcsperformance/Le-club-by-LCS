-- Le Club by LCS — Mes records : meilleur temps du membre sur 10 km, semi, marathon et triathlon S à XL.
-- Une ligne par membre et par épreuve ; pas de ligne = pas de record (tout est facultatif).
-- Le membre lit et modifie ses records ; le coach et l'admin les lisent (lecture seule).

create type public.epreuve as enum ('10km', 'semi', 'marathon', 'tri_s', 'tri_m', 'tri_l', 'tri_xl');

create table public.records (
  id              uuid primary key default gen_random_uuid(),
  membre_id       uuid not null default auth.uid() references public.membres (id) on delete cascade,
  epreuve         public.epreuve not null,
  duree_secondes  integer not null check (duree_secondes between 60 and 86400),
  mis_a_jour      timestamptz not null default now(),
  unique (membre_id, epreuve)
);

comment on table public.records is 'Records personnels du membre (temps en secondes), un par épreuve, tous facultatifs.';

revoke all on public.records from anon;
grant select, insert, update, delete on public.records to authenticated;

alter table public.records enable row level security;

create policy "membre : lit ses records" on public.records
  for select to authenticated using (membre_id = (select auth.uid()));
create policy "membre : ajoute ses records" on public.records
  for insert to authenticated with check (membre_id = (select auth.uid()));
create policy "membre : modifie ses records" on public.records
  for update to authenticated
  using (membre_id = (select auth.uid())) with check (membre_id = (select auth.uid()));
create policy "membre : supprime ses records" on public.records
  for delete to authenticated using (membre_id = (select auth.uid()));

create policy "encadrant : lit tous les records" on public.records
  for select to authenticated using ((select public.est_encadrant()));
