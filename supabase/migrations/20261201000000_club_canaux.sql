-- Le Club by LCS — canaux de discussion du Club, en direct.
--
-- canaux           : les 7 canaux, créés ici et nulle part ailleurs (aucun compte ne peut en créer) :
--                    il n'existe donc aucune conversation privée, ni entre membres ni avec le coach.
-- messages_club    : messages d'un canal. Prénom et rôle de l'auteur recopiés par la base.
-- lectures_canaux  : jusqu'où chaque membre a lu chaque canal (badges de non-lus).
--
-- Tout membre connecté lit tous les canaux et écrit en son nom, sauf dans « annonces »
-- (réservé à l'admin et au coach). Chacun supprime ses messages ; l'admin supprime n'importe
-- lequel par admin_supprimer_message(), noté dans le journal de l'admin.

create table public.canaux (
  cle            text primary key check (cle ~ '^[a-z-]{1,30}$'),
  nom            text not null check (char_length(nom) between 1 and 30),
  description    text not null check (char_length(description) between 1 and 80),
  lecture_seule  boolean not null default false,  -- seuls l'admin et le coach y publient
  ordre          smallint not null check (ordre between 1 and 99)
);

comment on table public.canaux is 'Canaux du Club (collectifs uniquement : pas de messages privés).';

insert into public.canaux (cle, nom, description, lecture_seule, ordre) values
  ('annonces', 'annonces', 'Rappels, nouveaux contenus, événements', true, 1),
  ('general', 'général', 'La discussion libre du Club', false, 2),
  ('presentations', 'présentations', 'Dis-nous qui tu es et ce que tu prépares', false, 3),
  ('bloc-m', 'bloc-m', 'Préparation triathlon M', false, 4),
  ('bloc-l', 'bloc-l', 'Préparation triathlon L', false, 5),
  ('nutrition-matos', 'nutrition-matos', 'Nutrition, matériel, bons plans', false, 6),
  ('courses', 'courses', 'Calendrier, résultats, retours de course', false, 7);

create table public.messages_club (
  id           uuid primary key default gen_random_uuid(),
  canal        text not null references public.canaux (cle) on delete cascade,
  membre_id    uuid not null default auth.uid() references public.membres (id) on delete cascade,
  auteur       text not null default '',
  auteur_role  public.role_utilisateur not null default 'membre',
  texte        text not null check (char_length(texte) between 1 and 1000 and texte = btrim(texte)),
  cree_le      timestamptz not null default now()
);

create index messages_club_canal on public.messages_club (canal, cree_le desc);

comment on table public.messages_club is 'Messages des canaux du Club, lisibles par tous les membres connectés.';

create table public.lectures_canaux (
  membre_id  uuid not null default auth.uid() references public.membres (id) on delete cascade,
  canal      text not null references public.canaux (cle) on delete cascade,
  lu_jusqua  timestamptz not null default now(),
  primary key (membre_id, canal)
);

comment on table public.lectures_canaux is 'Dernière lecture de chaque canal par chaque membre (privée).';

-- Prénom (« Membre » s'il est inconnu), rôle et heure : toujours ceux du compte connecté et de la base.
create function public.remplir_auteur_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(m.prenom, ''), 'Membre'), m.role into new.auteur, new.auteur_role
  from public.membres m where m.id = new.membre_id;
  new.cree_le := now();
  return new;
end;
$$;

create trigger auteur_du_message
  before insert on public.messages_club
  for each row execute function public.remplir_auteur_message();

-- ---------------------------------------------------------------------------
-- Non-lus et lecture
-- ---------------------------------------------------------------------------

-- Pour chaque canal : messages des autres arrivés depuis la dernière lecture (ou depuis l'inscription).
create function public.canaux_non_lus()
returns table (canal text, non_lus integer)
language sql
stable
security definer
set search_path = ''
as $$
  select c.cle, (
    select count(*)::integer from public.messages_club m
    where m.canal = c.cle
      and m.membre_id <> (select auth.uid())
      and m.cree_le > coalesce(
        (select l.lu_jusqua from public.lectures_canaux l where l.membre_id = (select auth.uid()) and l.canal = c.cle),
        (select mb.date_inscription from public.membres mb where mb.id = (select auth.uid()))
      )
  )
  from public.canaux c
  where (select auth.uid()) is not null;
$$;

-- Marque un canal comme lu jusqu'à maintenant, pour la personne connectée.
create function public.marquer_canal_lu(c text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.lectures_canaux (membre_id, canal, lu_jusqua)
  select (select auth.uid()), c, now()
  where (select auth.uid()) is not null and exists (select 1 from public.canaux where cle = c)
  on conflict (membre_id, canal) do update set lu_jusqua = excluded.lu_jusqua;
$$;

-- L'admin supprime n'importe quel message ; la suppression est notée dans le journal.
alter table public.journal_admin drop constraint journal_admin_action_check;
alter table public.journal_admin add constraint journal_admin_action_check check (action in (
  'acces_offert', 'acces_offert_retire', 'acces_coupe', 'acces_retabli', 'email_acces_renvoye',
  'commentaire_supprime', 'message_supprime'));

create function public.admin_supprimer_message(mid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.messages_club;
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  delete from public.messages_club where id = mid returning * into m;
  if not found then
    raise exception 'Message introuvable.' using errcode = 'P0002';
  end if;
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values (m.membre_id, (select auth.uid()), 'message_supprime', left('#' || m.canal || ' : ' || m.texte, 200));
end;
$$;

revoke all on function public.canaux_non_lus(), public.marquer_canal_lu(text), public.admin_supprimer_message(uuid) from public, anon;
grant execute on function public.canaux_non_lus(), public.marquer_canal_lu(text), public.admin_supprimer_message(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Droits et sécurité par ligne. Les visiteurs non connectés n'ont accès à rien.
-- ---------------------------------------------------------------------------
revoke all on public.canaux, public.messages_club, public.lectures_canaux from anon, authenticated;
grant select on public.canaux to authenticated;  -- aucune écriture : pas de nouveau canal, pas de canal privé
grant select, delete on public.messages_club to authenticated;
grant insert (canal, membre_id, texte) on public.messages_club to authenticated;  -- pas de modification
grant select on public.lectures_canaux to authenticated;  -- écriture par marquer_canal_lu()

alter table public.canaux enable row level security;
alter table public.messages_club enable row level security;
alter table public.lectures_canaux enable row level security;

create policy "connecté : lit les canaux" on public.canaux for select to authenticated using (true);

create policy "connecté : lit les messages" on public.messages_club for select to authenticated using (true);
create policy "membre : écrit en son nom, annonces réservées à l'équipe" on public.messages_club
  for insert to authenticated
  with check (
    membre_id = (select auth.uid())
    and (
      not exists (select 1 from public.canaux c where c.cle = canal and c.lecture_seule)
      or public.role_actuel() in ('admin', 'coach')
    )
  );
create policy "membre : supprime ses messages" on public.messages_club
  for delete to authenticated using (membre_id = (select auth.uid()));

create policy "membre : lit ses lectures" on public.lectures_canaux
  for select to authenticated using (membre_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Temps réel (Supabase Realtime ; absent de la base de test locale). La sécurité par ligne
-- s'applique aussi aux messages diffusés en direct.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages_club;
  end if;
end $$;
