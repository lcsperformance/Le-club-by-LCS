-- Le Club by LCS — l'admin ajoute, modifie et supprime les canaux du Club.
-- Les canaux restent COLLECTIFS : un canal est lisible par tous les membres qui ont un accès en cours
-- (même règle qu'avant), il n'existe ni liste d'invités ni canal entre deux personnes : toujours
-- aucun message privé. Personne n'écrit directement dans la table : seulement par les fonctions
-- ci-dessous, qui vérifient le rôle admin et notent chaque action dans journal_admin.
-- « annonces » est protégé (notifications) : ni supprimé, ni ouvert à l'écriture des membres.

alter table public.journal_admin drop constraint journal_admin_action_check;
alter table public.journal_admin add constraint journal_admin_action_check check (action in (
  'acces_offert', 'acces_offert_retire', 'acces_coupe', 'acces_retabli', 'email_acces_renvoye',
  'commentaire_supprime', 'message_supprime', 'role_change',
  'canal_cree', 'canal_modifie', 'canal_supprime'));

-- Vérifications communes (rôle admin, nom, description, ordre).
create function public.verifier_canal_admin(p_nom text, p_description text, p_ordre smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  if p_nom is null or char_length(btrim(p_nom)) not between 1 and 30 then
    raise exception 'Le nom du canal doit faire de 1 à 30 caractères.' using errcode = '22023';
  end if;
  if p_description is null or char_length(btrim(p_description)) not between 1 and 80 then
    raise exception 'La description doit faire de 1 à 80 caractères.' using errcode = '22023';
  end if;
  if p_ordre is null or p_ordre not between 1 and 99 then
    raise exception 'L''ordre doit être entre 1 et 99.' using errcode = '22023';
  end if;
end;
$$;

create function public.admin_creer_canal(p_cle text, p_nom text, p_description text, p_lecture_seule boolean, p_ordre smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.verifier_canal_admin(p_nom, p_description, p_ordre);
  -- « questions » et « agenda » sont déjà des pages du Club (/club/questions, /club/agenda).
  if p_cle is null or p_cle !~ '^[a-z]+(-[a-z]+)*$' or char_length(p_cle) > 30 or p_cle in ('questions', 'agenda') then
    raise exception 'Adresse de canal invalide.' using errcode = '22023';
  end if;
  if exists (select 1 from public.canaux where cle = p_cle) then
    raise exception 'Un canal porte déjà ce nom.' using errcode = '23505';
  end if;
  insert into public.canaux (cle, nom, description, lecture_seule, ordre)
  values (p_cle, btrim(p_nom), btrim(p_description), coalesce(p_lecture_seule, false), p_ordre);
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values ((select auth.uid()), (select auth.uid()), 'canal_cree', left('#' || p_cle || ' : ' || btrim(p_nom), 200));
end;
$$;

create function public.admin_modifier_canal(p_cle text, p_nom text, p_description text, p_lecture_seule boolean, p_ordre smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.verifier_canal_admin(p_nom, p_description, p_ordre);
  if p_cle = 'annonces' and not coalesce(p_lecture_seule, false) then
    raise exception 'Le canal « annonces » reste réservé à l''équipe du Club.' using errcode = '22023';
  end if;
  update public.canaux
  set nom = btrim(p_nom), description = btrim(p_description), lecture_seule = coalesce(p_lecture_seule, false), ordre = p_ordre
  where cle = p_cle;
  if not found then
    raise exception 'Canal introuvable.' using errcode = 'P0002';
  end if;
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values ((select auth.uid()), (select auth.uid()), 'canal_modifie', left('#' || p_cle || ' : ' || btrim(p_nom), 200));
end;
$$;

-- Suppression définitive : le canal et tous ses messages. Il faut retaper son nom pour confirmer.
create function public.admin_supprimer_canal(p_cle text, p_confirmation text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.canaux;
  n integer;
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  if p_cle = 'annonces' then
    raise exception 'Le canal « annonces » ne peut pas être supprimé.' using errcode = '22023';
  end if;
  select * into c from public.canaux where cle = p_cle;
  if not found then
    raise exception 'Canal introuvable.' using errcode = 'P0002';
  end if;
  if p_confirmation is null or btrim(p_confirmation) <> c.nom then
    raise exception 'Pour confirmer, tape exactement le nom du canal.' using errcode = '22023';
  end if;
  select count(*)::int into n from public.messages_club where canal = p_cle;
  delete from public.canaux where cle = p_cle;  -- messages et lectures suivent (on delete cascade)
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values ((select auth.uid()), (select auth.uid()), 'canal_supprime', left('#' || p_cle || ' : ' || c.nom || ' (' || n || ' messages)', 200));
  return n;
end;
$$;

revoke all on function public.verifier_canal_admin(text, text, smallint) from public, anon, authenticated;
revoke all on function public.admin_creer_canal(text, text, text, boolean, smallint),
  public.admin_modifier_canal(text, text, text, boolean, smallint),
  public.admin_supprimer_canal(text, text) from public, anon;
grant execute on function public.admin_creer_canal(text, text, text, boolean, smallint),
  public.admin_modifier_canal(text, text, text, boolean, smallint),
  public.admin_supprimer_canal(text, text) to authenticated;
