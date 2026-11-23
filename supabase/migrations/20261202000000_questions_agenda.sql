-- Le Club by LCS — boîte à questions (FAQ en visio) et agenda des événements.
--
-- questions_faq : questions posées par les membres pour la FAQ en visio. Lisibles par tous les membres
--                 (« Posée par Thomas »), sans votes (aucune colonne prévue pour). Chacun pose et retire
--                 les siennes ; seul l'admin les marque traitées ou supprime celles des autres.
-- evenements    : agenda du Club (FAQ en visio, webinaires…), lu par tous, écrit par l'admin seul.

-- ---------------------------------------------------------------------------
-- Boîte à questions
-- ---------------------------------------------------------------------------
create table public.questions_faq (
  id           uuid primary key default gen_random_uuid(),
  membre_id    uuid not null default auth.uid() references public.membres (id) on delete cascade,
  auteur       text not null default '',
  auteur_role  public.role_utilisateur not null default 'membre',
  texte        text not null check (char_length(texte) between 1 and 300 and texte = btrim(texte)),
  cree_le      timestamptz not null default now(),
  traitee_le   timestamptz  -- vide : à traiter ; sinon traitée en FAQ (date du traitement)
);

create index questions_faq_date on public.questions_faq (cree_le);

comment on table public.questions_faq is 'Questions pour la FAQ en visio : lisibles par tous les membres, sans votes.';

-- Prénom (« Membre » s'il est inconnu) et rôle de l'auteur, toujours ceux du compte connecté.
create function public.remplir_auteur_question()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(m.prenom, ''), 'Membre'), m.role into new.auteur, new.auteur_role
  from public.membres m where m.id = new.membre_id;
  new.cree_le := now();
  new.traitee_le := null;
  return new;
end;
$$;

create trigger auteur_de_la_question
  before insert on public.questions_faq
  for each row execute function public.remplir_auteur_question();

revoke all on public.questions_faq from anon, authenticated;
grant select, delete on public.questions_faq to authenticated;
grant insert (membre_id, texte) on public.questions_faq to authenticated;
grant update (traitee_le) on public.questions_faq to authenticated;  -- l'admin seul, par la règle ci-dessous

alter table public.questions_faq enable row level security;

create policy "connecté : lit les questions" on public.questions_faq for select to authenticated using (true);
create policy "membre : pose une question en son nom" on public.questions_faq for insert to authenticated
  with check (membre_id = (select auth.uid()));
create policy "admin : marque une question traitée" on public.questions_faq for update to authenticated
  using (public.role_actuel() = 'admin') with check (public.role_actuel() = 'admin');
create policy "auteur ou admin : retire une question" on public.questions_faq for delete to authenticated
  using (membre_id = (select auth.uid()) or public.role_actuel() = 'admin');

-- ---------------------------------------------------------------------------
-- Agenda
-- ---------------------------------------------------------------------------
create type public.type_evenement as enum ('faq', 'webinaire', 'stage', 'autre');

create table public.evenements (
  id                 uuid primary key default gen_random_uuid(),
  titre              text not null check (char_length(titre) between 1 and 80 and titre = btrim(titre)),
  type               public.type_evenement not null,
  debut              timestamptz not null,
  fin                timestamptz check (fin is null or fin > debut),
  lieu               text check (lieu is null or char_length(lieu) between 1 and 120),
  lien               text check (lien is null or (char_length(lien) <= 300 and lien ~ '^https://')),
  description        text check (description is null or char_length(description) between 1 and 500),
  -- Dates pas encore fixées : la période s'affiche à la place (« Printemps · dates à venir »).
  dates_a_confirmer  boolean not null default false,
  periode            text check (periode is null or char_length(periode) between 1 and 40),
  constraint periode_si_a_confirmer check (not dates_a_confirmer or periode is not null)
);

create index evenements_debut on public.evenements (debut);

comment on table public.evenements is 'Agenda du Club (heures enregistrées en UTC, affichées à l''heure de Paris).';

revoke all on public.evenements from anon, authenticated;
grant select, insert, update, delete on public.evenements to authenticated;

alter table public.evenements enable row level security;

create policy "connecté : lit l'agenda" on public.evenements for select to authenticated using (true);
create policy "admin : ajoute un événement" on public.evenements for insert to authenticated
  with check (public.role_actuel() = 'admin');
create policy "admin : modifie un événement" on public.evenements for update to authenticated
  using (public.role_actuel() = 'admin') with check (public.role_actuel() = 'admin');
create policy "admin : supprime un événement" on public.evenements for delete to authenticated
  using (public.role_actuel() = 'admin');

-- Exemples (à modifier depuis /admin/agenda). Heures de Paris.
insert into public.evenements (titre, type, debut, fin, lieu, description, dates_a_confirmer, periode) values
  ('FAQ en visio', 'faq', '2027-01-14 19:30 Europe/Paris', '2027-01-14 20:30 Europe/Paris', 'En visio',
   'Martin répond en direct aux questions déposées dans la boîte à questions. Le lien est publié dans # annonces.', false, null),
  ('Webinaire : bien démarrer sa saison', 'webinaire', '2027-01-21 20:00 Europe/Paris', '2027-01-21 21:00 Europe/Paris', 'En visio',
   'Fil rouge, blocs et tests de départ : comment organiser son année.', false, null),
  ('FAQ en visio', 'faq', '2027-01-28 19:30 Europe/Paris', '2027-01-28 20:30 Europe/Paris', 'En visio',
   'Martin répond en direct aux questions déposées dans la boîte à questions. Le lien est publié dans # annonces.', false, null);
