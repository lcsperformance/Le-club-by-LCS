-- Le Club by LCS — « Coach + admin » : certains coachs ont les droits d'un admin
-- tout en étant présentés comme « Coach » aux membres.
--
-- Droits : inchangés, donnés par membres.role ('admin' pour un coach + admin).
-- Affichage : membres.affiche_coach = true → l'auteur recopié dans les messages du Club,
-- les questions et les commentaires est « coach », pas « admin ».
-- Changement de rôle : seulement par admin_changer_role_equipe() (vérifie le rôle admin, noté dans journal_admin).

alter table public.membres
  add column affiche_coach boolean not null default false;

comment on column public.membres.affiche_coach is
  'Admin présenté comme « Coach » aux membres (Coach + admin). Sans effet pour les autres rôles.';

-- Rôle montré aux membres.
create function public.role_affiche(r public.role_utilisateur, affiche_coach boolean)
returns public.role_utilisateur
language sql
immutable
set search_path = ''
as $$
  select case when r = 'admin' and affiche_coach then 'coach'::public.role_utilisateur else r end;
$$;

-- Les trois recopies de l'auteur utilisent le rôle montré.
create or replace function public.remplir_auteur_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(m.prenom, ''), 'Membre'), public.role_affiche(m.role, m.affiche_coach) into new.auteur, new.auteur_role
  from public.membres m where m.id = new.membre_id;
  new.cree_le := now();
  return new;
end;
$$;

create or replace function public.remplir_auteur_commentaire()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(m.prenom, ''), 'Membre'), public.role_affiche(m.role, m.affiche_coach) into new.auteur, new.auteur_role
  from public.membres m where m.id = new.membre_id;
  new.cree_le := now();
  return new;
end;
$$;

create or replace function public.remplir_auteur_question()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(m.prenom, ''), 'Membre'), public.role_affiche(m.role, m.affiche_coach) into new.auteur, new.auteur_role
  from public.membres m where m.id = new.membre_id;
  new.cree_le := now();
  new.traitee_le := null;
  return new;
end;
$$;

-- Journal : changement de rôle.
alter table public.journal_admin drop constraint journal_admin_action_check;
alter table public.journal_admin add constraint journal_admin_action_check check (action in (
  'acces_offert', 'acces_offert_retire', 'acces_coupe', 'acces_retabli', 'email_acces_renvoye',
  'commentaire_supprime', 'message_supprime', 'role_change'));

-- Rôle d'équipe : 'membre', 'coach', 'coach_admin' ou 'admin'.
create function public.admin_changer_role_equipe(cible uuid, choix text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  nouveau public.role_utilisateur;
  coach_affiche boolean;
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  if choix not in ('membre', 'coach', 'coach_admin', 'admin') then
    raise exception 'Rôle inconnu.' using errcode = '22023';
  end if;
  nouveau := case when choix = 'coach_admin' then 'admin' else choix end::public.role_utilisateur;
  coach_affiche := choix = 'coach_admin';
  if cible = (select auth.uid()) and nouveau <> 'admin' then
    raise exception 'Tu ne peux pas retirer ton propre accès à l''administration.' using errcode = '22023';
  end if;
  update public.membres set role = nouveau, affiche_coach = coach_affiche where id = cible;
  if not found then
    raise exception 'Personne introuvable.' using errcode = 'P0002';
  end if;
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values (cible, (select auth.uid()), 'role_change', choix);
end;
$$;

revoke all on function public.admin_changer_role_equipe(uuid, text) from public, anon;
grant execute on function public.admin_changer_role_equipe(uuid, text) to authenticated;
