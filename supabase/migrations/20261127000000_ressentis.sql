-- Le Club by LCS — ressenti de séance : DONNÉES DE SANTÉ (RPE, douleur, commentaire).
-- Une ligne = séance faite par le membre ce jour-là ; le ressenti (RPE, douleur, commentaire) s'y ajoute.
-- Accès restreint : le membre lit et écrit les siens ; le coach et l'admin les lisent (lecture seule) ;
-- jamais visibles par les autres membres ni par les visiteurs.

create table public.ressentis (
  id            uuid primary key default gen_random_uuid(),
  membre_id     uuid not null default auth.uid() references public.membres (id) on delete cascade,
  -- Si Martin retire une séance du programme, le ressenti du membre reste dans son historique.
  seance_id     uuid references public.seances (id) on delete set null,
  date_seance   date not null,
  rpe           smallint check (rpe between 1 and 10),  -- vide tant que le ressenti n'est pas donné
  douleur       boolean not null default false,
  commentaire   text check (commentaire is null or (char_length(commentaire) between 1 and 500 and commentaire = btrim(commentaire))),
  fait_le       timestamptz not null default now(),
  mis_a_jour    timestamptz not null default now(),
  unique (membre_id, seance_id, date_seance)
);

comment on table public.ressentis is
  'Séances faites et ressenti (RPE, douleur, commentaire) : données de santé, visibles du membre, du coach et de l''admin seulement.';

create index ressentis_membre_date on public.ressentis (membre_id, date_seance);

revoke all on public.ressentis from anon;
revoke all on public.ressentis from authenticated;
grant select, insert, delete on public.ressentis to authenticated;
-- Le membre ne change que son ressenti (jamais le membre, la séance ni la date d'une ligne existante).
grant update (rpe, douleur, commentaire, mis_a_jour) on public.ressentis to authenticated;

alter table public.ressentis enable row level security;

create policy "membre : lit ses ressentis" on public.ressentis
  for select to authenticated using (membre_id = (select auth.uid()));
create policy "membre : ajoute ses ressentis" on public.ressentis
  for insert to authenticated with check (membre_id = (select auth.uid()));
create policy "membre : modifie ses ressentis" on public.ressentis
  for update to authenticated
  using (membre_id = (select auth.uid())) with check (membre_id = (select auth.uid()));
create policy "membre : supprime ses ressentis" on public.ressentis
  for delete to authenticated using (membre_id = (select auth.uid()));

create policy "encadrant : lit tous les ressentis" on public.ressentis
  for select to authenticated using ((select public.est_encadrant()));
