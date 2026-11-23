-- Le Club by LCS — Ressources : contenus (PDF ou vidéo YouTube non répertoriée) classés par thème
-- et sous-rubrique (config/ressources.json), débloqués selon l'ancienneté du membre.
--
-- ressources               : le catalogue. Les membres en lisent le titre, le type et la semaine de
--                            déblocage ; le lien de la vidéo et le fichier PDF ne sont donnés que par
--                            ressources_medias(), et seulement pour les contenus débloqués.
-- suivi_ressources         : favori et « Vue » / « Téléchargé », privés à chaque membre.
-- commentaires_ressources  : commentaires sous les vidéos, lisibles par les membres (sans votes).

create type public.type_ressource as enum ('pdf', 'video');

create table public.ressources (
  id                  uuid primary key default gen_random_uuid(),
  theme               text not null check (theme ~ '^[a-z_]{1,30}$'),
  sous_rubrique       text not null check (sous_rubrique ~ '^[a-z_]{1,40}$'),
  titre               text not null check (char_length(titre) between 1 and 120 and titre = btrim(titre)),
  type                public.type_ressource not null,
  semaine_deblocage   smallint not null check (semaine_deblocage between 1 and 520),
  ordre               smallint not null default 1 check (ordre between 1 and 99),
  youtube_id          text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),  -- vidéo YouTube non répertoriée
  fichier             text check (char_length(fichier) between 1 and 300),  -- chemin du PDF dans le stockage « ressources »
  cree_le             timestamptz not null default now(),
  constraint ressource_media_coherent check (
    (type = 'video' and fichier is null) or (type = 'pdf' and youtube_id is null)
  )
);

comment on table public.ressources is
  'Ressources du Club. Lien vidéo et fichier : jamais lisibles directement, seulement via ressources_medias() une fois débloqués.';

create index ressources_theme on public.ressources (theme, sous_rubrique, ordre);

-- ---------------------------------------------------------------------------
-- Ancienneté et déblocage
-- ---------------------------------------------------------------------------

-- Semaine d'abonnement du membre connecté : 1 la première semaine après l'inscription, 2 la suivante…
-- (jours du calendrier à Paris). null si la personne n'est pas connectée.
create function public.semaine_anciennete()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select ((now() at time zone 'Europe/Paris')::date - (date_inscription at time zone 'Europe/Paris')::date) / 7 + 1
  from public.membres where id = (select auth.uid());
$$;

-- Vrai si le contenu est débloqué pour la personne connectée. L'équipe du Club voit tout.
create function public.ressource_debloquee(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.est_encadrant(), false)
      or exists (
        select 1 from public.ressources r
        where r.id = rid and r.semaine_deblocage <= coalesce(public.semaine_anciennete(), 0)
      );
$$;

-- Lien de la vidéo et présence du PDF, pour les seuls contenus débloqués (jamais le chemin du fichier).
create function public.ressources_medias()
returns table (id uuid, youtube_id text, fichier_disponible boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.youtube_id, r.fichier is not null
  from public.ressources r
  where public.ressource_debloquee(r.id);
$$;

-- Vrai si ce fichier du stockage appartient à un contenu débloqué pour la personne connectée.
create function public.fichier_debloque(chemin text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.ressources r where r.fichier = chemin and public.ressource_debloquee(r.id));
$$;

-- Chemin du PDF d'un contenu débloqué (null sinon), pour créer un lien de téléchargement temporaire.
create function public.fichier_ressource(rid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.fichier from public.ressources r where r.id = rid and r.type = 'pdf' and public.ressource_debloquee(r.id);
$$;

revoke all on function public.semaine_anciennete(), public.ressource_debloquee(uuid), public.ressources_medias(),
  public.fichier_debloque(text), public.fichier_ressource(uuid) from public, anon;
grant execute on function public.semaine_anciennete(), public.ressource_debloquee(uuid), public.ressources_medias(),
  public.fichier_debloque(text), public.fichier_ressource(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Suivi : favori, « Vue » (vidéo) ou « Téléchargé » (PDF). Une ligne par membre et par contenu.
-- ---------------------------------------------------------------------------
create table public.suivi_ressources (
  id             uuid primary key default gen_random_uuid(),
  membre_id      uuid not null default auth.uid() references public.membres (id) on delete cascade,
  ressource_id   uuid not null references public.ressources (id) on delete cascade,
  favori         boolean not null default false,
  consulte_le    timestamptz,  -- vidéo marquée vue ou PDF téléchargé ; vide sinon
  mis_a_jour     timestamptz not null default now(),
  unique (membre_id, ressource_id)
);

comment on table public.suivi_ressources is 'Favoris et contenus vus ou téléchargés : privés à chaque membre.';

-- ---------------------------------------------------------------------------
-- Commentaires sous les vidéos. Le prénom et le rôle de l'auteur sont recopiés à l'écriture
-- (la fiche des autres membres reste illisible).
-- ---------------------------------------------------------------------------
create table public.commentaires_ressources (
  id             uuid primary key default gen_random_uuid(),
  ressource_id   uuid not null references public.ressources (id) on delete cascade,
  membre_id      uuid not null default auth.uid() references public.membres (id) on delete cascade,
  auteur         text not null default '',
  auteur_role    public.role_utilisateur not null default 'membre',
  texte          text not null check (char_length(texte) between 1 and 500 and texte = btrim(texte)),
  cree_le        timestamptz not null default now()
);

create index commentaires_ressource on public.commentaires_ressources (ressource_id, cree_le);

comment on table public.commentaires_ressources is 'Commentaires sous les vidéos, lisibles par les membres qui ont débloqué la vidéo. Pas de votes.';

-- Prénom (« Membre » s'il est inconnu) et rôle de l'auteur, toujours ceux du compte connecté.
create function public.remplir_auteur_commentaire()
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

create trigger auteur_du_commentaire
  before insert on public.commentaires_ressources
  for each row execute function public.remplir_auteur_commentaire();

-- ---------------------------------------------------------------------------
-- Droits : les visiteurs non connectés n'ont accès à rien.
-- ---------------------------------------------------------------------------
revoke all on public.ressources, public.suivi_ressources, public.commentaires_ressources from anon, authenticated;

-- Catalogue : jamais les colonnes youtube_id ni fichier.
grant select (id, theme, sous_rubrique, titre, type, semaine_deblocage, ordre) on public.ressources to authenticated;
grant select, insert, delete on public.suivi_ressources to authenticated;
grant update (favori, consulte_le, mis_a_jour) on public.suivi_ressources to authenticated;
grant select, insert (ressource_id, membre_id, texte), delete on public.commentaires_ressources to authenticated;
grant update (texte) on public.commentaires_ressources to authenticated;

-- Le serveur (clé secrète) gère le catalogue.
grant select, insert, update, delete on public.ressources to service_role;
grant select on public.suivi_ressources, public.commentaires_ressources to service_role;

alter table public.ressources enable row level security;
alter table public.suivi_ressources enable row level security;
alter table public.commentaires_ressources enable row level security;

create policy "connecté : lit le catalogue" on public.ressources
  for select to authenticated using (true);

create policy "membre : lit son suivi" on public.suivi_ressources
  for select to authenticated using (membre_id = (select auth.uid()));
create policy "membre : suit un contenu débloqué" on public.suivi_ressources
  for insert to authenticated
  with check (membre_id = (select auth.uid()) and public.ressource_debloquee(ressource_id));
create policy "membre : modifie son suivi" on public.suivi_ressources
  for update to authenticated
  using (membre_id = (select auth.uid()))
  with check (membre_id = (select auth.uid()) and public.ressource_debloquee(ressource_id));
create policy "membre : supprime son suivi" on public.suivi_ressources
  for delete to authenticated using (membre_id = (select auth.uid()));

create policy "connecté : lit les commentaires des vidéos débloquées" on public.commentaires_ressources
  for select to authenticated using (public.ressource_debloquee(ressource_id));
create policy "membre : commente une vidéo débloquée" on public.commentaires_ressources
  for insert to authenticated
  with check (
    membre_id = (select auth.uid())
    and public.ressource_debloquee(ressource_id)
    and exists (select 1 from public.ressources r where r.id = ressource_id and r.type = 'video')
  );
create policy "membre : modifie ses commentaires" on public.commentaires_ressources
  for update to authenticated
  using (membre_id = (select auth.uid())) with check (membre_id = (select auth.uid()));
create policy "auteur ou admin : supprime un commentaire" on public.commentaires_ressources
  for delete to authenticated
  using (membre_id = (select auth.uid()) or public.role_actuel() = 'admin');

-- ---------------------------------------------------------------------------
-- Stockage privé des PDF (absent de la base de test locale : créé seulement sur Supabase).
-- Un membre ne peut lire un fichier que si le contenu correspondant est débloqué pour lui.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('ressources', 'ressources', false)
      on conflict (id) do nothing;
    execute $p$
      create policy "membre : lit les PDF débloqués" on storage.objects
        for select to authenticated
        using (bucket_id = 'ressources' and public.fichier_debloque(name))
    $p$;
  end if;
end $$;
