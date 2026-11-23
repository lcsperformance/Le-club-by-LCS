-- Le Club by LCS — gestion des Ressources par l'admin.
--
-- - Les thèmes et sous-rubriques quittent config/ressources.json pour deux tables (mêmes valeurs).
-- - Un thème ou une sous-rubrique qui contient encore des contenus ne peut pas être supprimé.
-- - Miniature facultative d'un contenu (stockage public « miniatures ») ; sinon celle de YouTube.
-- - Seul le rôle admin ajoute, modifie ou supprime (base et fichiers) ; il modère les commentaires,
--   chaque suppression étant notée dans le journal de l'admin.

-- ---------------------------------------------------------------------------
-- Thèmes et sous-rubriques
-- ---------------------------------------------------------------------------
create table public.themes_ressources (
  cle    text primary key check (cle ~ '^[a-z_]{1,30}$' and cle not in ('favoris', 'contenu')),
  nom    text not null check (char_length(nom) between 1 and 40 and nom = btrim(nom)),
  icone  text not null check (icone in ('nutrition', 'natation', 'velo', 'course', 'preparation')),
  ordre  smallint not null default 1 check (ordre between 1 and 99)
);

create table public.sous_rubriques (
  theme  text not null references public.themes_ressources (cle) on delete cascade,
  cle    text not null check (cle ~ '^[a-z_]{1,40}$'),
  nom    text not null check (char_length(nom) between 1 and 60 and nom = btrim(nom)),
  ordre  smallint not null default 1 check (ordre between 1 and 99),
  primary key (theme, cle)
);

comment on table public.themes_ressources is 'Thèmes de l''onglet Ressources (gérés par l''admin).';
comment on table public.sous_rubriques is 'Sous-rubriques d''un thème (gérées par l''admin).';

insert into public.themes_ressources (cle, nom, icone, ordre) values
  ('nutrition', 'Nutrition', 'nutrition', 1),
  ('natation', 'Natation', 'natation', 2),
  ('velo', 'Vélo', 'velo', 3),
  ('course', 'Course à pied', 'course', 4),
  ('preparation', 'Préparation', 'preparation', 5);

insert into public.sous_rubriques (theme, cle, nom, ordre) values
  ('nutrition', 'bases', 'Les bases de la nutrition', 1),
  ('nutrition', 'effort', 'Nutrition à l''effort', 2),
  ('natation', 'technique', 'Technique', 1),
  ('natation', 'eau_libre', 'Eau libre', 2),
  ('velo', 'position_materiel', 'Position et matériel', 1),
  ('velo', 'puissance', 'Travail de puissance', 2),
  ('course', 'technique', 'Technique de course', 1),
  ('course', 'sorties_longues', 'Sorties longues', 2),
  ('preparation', 'tests_zones', 'Tests et zones', 1),
  ('preparation', 'chaleur_transitions', 'Chaleur et transitions', 2);

-- Un contenu appartient à une sous-rubrique existante. Supprimer un thème supprime ses sous-rubriques,
-- mais la base refuse tant qu'il reste un contenu dedans.
alter table public.ressources
  add constraint ressource_dans_sa_sous_rubrique foreign key (theme, sous_rubrique)
  references public.sous_rubriques (theme, cle) on delete restrict;

-- ---------------------------------------------------------------------------
-- Miniature facultative (chemin dans le stockage public « miniatures »).
-- ---------------------------------------------------------------------------
alter table public.ressources
  add column miniature text check (miniature is null or (char_length(miniature) between 1 and 300));

-- Les médias des contenus débloqués donnent aussi la miniature (jamais pour un contenu verrouillé).
drop function public.ressources_medias();
create function public.ressources_medias()
returns table (id uuid, youtube_id text, fichier_disponible boolean, miniature text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.youtube_id, r.fichier is not null, r.miniature
  from public.ressources r
  where public.ressource_debloquee(r.id);
$$;
revoke all on function public.ressources_medias() from public, anon;
grant execute on function public.ressources_medias() to authenticated;

-- Fiche complète d'un ou de tous les contenus (lien, fichier, miniature), pour l'écran de l'admin.
create function public.admin_ressources()
returns setof public.ressources
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  return query select * from public.ressources;
end;
$$;
revoke all on function public.admin_ressources() from public, anon;
grant execute on function public.admin_ressources() to authenticated;

-- ---------------------------------------------------------------------------
-- Droits : tout membre connecté lit les thèmes ; seul l'admin écrit.
-- ---------------------------------------------------------------------------
revoke all on public.themes_ressources, public.sous_rubriques from anon, authenticated;
grant select, insert, update, delete on public.themes_ressources, public.sous_rubriques to authenticated;
grant select on public.themes_ressources, public.sous_rubriques to service_role;

alter table public.themes_ressources enable row level security;
alter table public.sous_rubriques enable row level security;

create policy "connecté : lit les thèmes" on public.themes_ressources for select to authenticated using (true);
create policy "admin : ajoute un thème" on public.themes_ressources for insert to authenticated
  with check (public.role_actuel() = 'admin');
create policy "admin : modifie un thème" on public.themes_ressources for update to authenticated
  using (public.role_actuel() = 'admin') with check (public.role_actuel() = 'admin');
create policy "admin : supprime un thème" on public.themes_ressources for delete to authenticated
  using (public.role_actuel() = 'admin');

create policy "connecté : lit les sous-rubriques" on public.sous_rubriques for select to authenticated using (true);
create policy "admin : ajoute une sous-rubrique" on public.sous_rubriques for insert to authenticated
  with check (public.role_actuel() = 'admin');
create policy "admin : modifie une sous-rubrique" on public.sous_rubriques for update to authenticated
  using (public.role_actuel() = 'admin') with check (public.role_actuel() = 'admin');
create policy "admin : supprime une sous-rubrique" on public.sous_rubriques for delete to authenticated
  using (public.role_actuel() = 'admin');

-- Contenus : l'admin écrit toutes les colonnes ; la lecture des liens et fichiers passe par admin_ressources().
grant insert (theme, sous_rubrique, titre, type, semaine_deblocage, ordre, youtube_id, fichier, miniature),
      update (theme, sous_rubrique, titre, type, semaine_deblocage, ordre, youtube_id, fichier, miniature),
      delete
  on public.ressources to authenticated;

create policy "admin : ajoute un contenu" on public.ressources for insert to authenticated
  with check (public.role_actuel() = 'admin');
create policy "admin : modifie un contenu" on public.ressources for update to authenticated
  using (public.role_actuel() = 'admin') with check (public.role_actuel() = 'admin');
create policy "admin : supprime un contenu" on public.ressources for delete to authenticated
  using (public.role_actuel() = 'admin');

-- ---------------------------------------------------------------------------
-- Modération des commentaires : l'admin supprime par cette fonction, qui note la suppression.
-- ---------------------------------------------------------------------------
alter table public.journal_admin drop constraint journal_admin_action_check;
alter table public.journal_admin add constraint journal_admin_action_check check (action in (
  'acces_offert', 'acces_offert_retire', 'acces_coupe', 'acces_retabli', 'email_acces_renvoye', 'commentaire_supprime'));

create function public.admin_supprimer_commentaire(cid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.commentaires_ressources;
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  delete from public.commentaires_ressources where id = cid returning * into c;
  if not found then
    raise exception 'Commentaire introuvable.' using errcode = 'P0002';
  end if;
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values (c.membre_id, (select auth.uid()), 'commentaire_supprime', left(c.texte, 200));
end;
$$;
revoke all on function public.admin_supprimer_commentaire(uuid) from public, anon;
grant execute on function public.admin_supprimer_commentaire(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Stockage : PDF (privé, 50 Mo) et miniatures (publiques, 2 Mo). Dépôt et suppression : admin seulement.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    update storage.buckets set file_size_limit = 52428800, allowed_mime_types = array['application/pdf']
      where id = 'ressources';
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('miniatures', 'miniatures', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
      on conflict (id) do nothing;
    execute $p$
      create policy "admin : lit les fichiers des ressources" on storage.objects for select to authenticated
        using (bucket_id in ('ressources', 'miniatures') and public.role_actuel() = 'admin')
    $p$;
    execute $p$
      create policy "admin : dépose les fichiers des ressources" on storage.objects for insert to authenticated
        with check (bucket_id in ('ressources', 'miniatures') and public.role_actuel() = 'admin')
    $p$;
    execute $p$
      create policy "admin : remplace les fichiers des ressources" on storage.objects for update to authenticated
        using (bucket_id in ('ressources', 'miniatures') and public.role_actuel() = 'admin')
        with check (bucket_id in ('ressources', 'miniatures') and public.role_actuel() = 'admin')
    $p$;
    execute $p$
      create policy "admin : supprime les fichiers des ressources" on storage.objects for delete to authenticated
        using (bucket_id in ('ressources', 'miniatures') and public.role_actuel() = 'admin')
    $p$;
  end if;
end $$;
