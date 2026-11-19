-- Le Club by LCS — rôles membre, coach, admin.
-- membre : voit et modifie ses propres données (niveau, profil, tests, zones, objectifs).
-- coach  : voit les données de tous les athlètes, en lecture seule.
-- admin  : voit tout et peut changer le rôle et le statut d'abonnement (via une fonction dédiée).

create type public.role_utilisateur as enum ('membre', 'coach', 'admin');

alter table public.membres
  add column role public.role_utilisateur not null default 'membre';

comment on column public.membres.role is
  'Rôle dans l''application. Jamais modifiable par la personne elle-même.';

-- Rôle de la personne connectée (null si non connectée).
-- security definer : lit la table sans repasser par la sécurité par ligne (évite une boucle).
create function public.role_actuel()
returns public.role_utilisateur
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.membres where id = (select auth.uid());
$$;

create function public.est_encadrant()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.role_actuel() in ('coach', 'admin'), false);
$$;

revoke all on function public.role_actuel(), public.est_encadrant() from public, anon;
grant execute on function public.role_actuel(), public.est_encadrant() to authenticated;

-- ---------------------------------------------------------------------------
-- Lecture seule pour le coach et l'admin (aucune règle d'écriture ajoutée).
-- ---------------------------------------------------------------------------
create policy "encadrant : lit toutes les fiches" on public.membres
  for select to authenticated using ((select public.est_encadrant()));
create policy "encadrant : lit tous les tests" on public.tests
  for select to authenticated using ((select public.est_encadrant()));
create policy "encadrant : lit toutes les zones" on public.zones
  for select to authenticated using ((select public.est_encadrant()));
create policy "encadrant : lit tous les objectifs" on public.objectifs
  for select to authenticated using ((select public.est_encadrant()));

-- ---------------------------------------------------------------------------
-- Actions réservées à l'admin.
-- Les droits par colonne empêchent tout le monde de modifier role et statut
-- directement : l'admin passe par ces fonctions, qui vérifient son rôle.
-- ---------------------------------------------------------------------------
create function public.admin_changer_role(cible uuid, nouveau_role public.role_utilisateur)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  if cible = (select auth.uid()) and nouveau_role <> 'admin' then
    raise exception 'Un administrateur ne peut pas retirer son propre rôle.' using errcode = '42501';
  end if;
  update public.membres set role = nouveau_role where id = cible;
  if not found then
    raise exception 'Personne introuvable.' using errcode = 'P0002';
  end if;
end;
$$;

create function public.admin_changer_statut(cible uuid, nouveau_statut public.statut_abonnement)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  update public.membres set statut_abonnement = nouveau_statut where id = cible;
  if not found then
    raise exception 'Personne introuvable.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_changer_role(uuid, public.role_utilisateur),
                      public.admin_changer_statut(uuid, public.statut_abonnement)
  from public, anon;
grant execute on function public.admin_changer_role(uuid, public.role_utilisateur),
                          public.admin_changer_statut(uuid, public.statut_abonnement)
  to authenticated;
