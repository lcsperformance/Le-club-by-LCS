-- Le Club by LCS — gestion manuelle des accès par l'admin.
-- - accès offert jusqu'à une date (ambassadeur, geste commercial…), à part de l'abonnement Stripe :
--   le webhook ne touche jamais à ces colonnes ;
-- - accès coupé : bloque l'entrée dans l'app, même avec un abonnement payé ;
-- - journal de chaque action manuelle (qui, quoi, quand), lisible par l'admin seulement.
-- Toute écriture passe par des fonctions qui vérifient le rôle admin : un membre ou un coach
-- est refusé, même en appelant la base directement.

alter table public.membres
  add column acces_offert_jusqua timestamptz,
  add column acces_coupe boolean not null default false;

comment on column public.membres.acces_offert_jusqua is
  'Accès offert à la main par l''admin jusqu''à cette date (indépendant de Stripe).';
comment on column public.membres.acces_coupe is
  'Accès coupé par l''admin : aucune entrée dans l''app, même avec un abonnement payé.';
-- Les droits par colonne existants ne donnent au membre que niveau, profil et prénom en écriture :
-- ces colonnes restent en lecture seule pour lui (il lit sa propre fiche).

create table public.journal_admin (
  id         bigint generated always as identity primary key,
  membre_id  uuid not null references public.membres (id) on delete cascade,
  admin_id   uuid references public.membres (id) on delete set null,
  action     text not null check (action in (
               'acces_offert', 'acces_offert_retire', 'acces_coupe', 'acces_retabli', 'email_acces_renvoye')),
  detail     text check (detail is null or length(detail) <= 200),
  fait_le    timestamptz not null default now()
);

create index journal_admin_membre on public.journal_admin (membre_id, fait_le desc);

alter table public.journal_admin enable row level security;
revoke all on public.journal_admin from anon, authenticated, service_role;
grant select on public.journal_admin to authenticated;
create policy "admin : lit le journal" on public.journal_admin
  for select to authenticated using ((select public.role_actuel()) = 'admin');
-- Aucune règle d'écriture : seules les fonctions ci-dessous (security definer) y écrivent.

-- Vérifie que la personne connectée est admin et que la cible est un membre.
create function public.verifier_admin_et_membre(cible uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  role_cible public.role_utilisateur;
begin
  if public.role_actuel() is distinct from 'admin' then
    raise exception 'Action réservée à un administrateur.' using errcode = '42501';
  end if;
  select role into role_cible from public.membres where id = cible;
  if not found then
    raise exception 'Personne introuvable.' using errcode = 'P0002';
  end if;
  if role_cible <> 'membre' then
    raise exception 'Seul l''accès d''un membre se gère ici.' using errcode = '22023';
  end if;
end;
$$;

-- Ouvre l'accès jusqu'à une date ; null retire l'accès offert.
create function public.admin_offrir_acces(cible uuid, jusqua timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.verifier_admin_et_membre(cible);
  if jusqua is not null and jusqua <= now() then
    raise exception 'La date doit être dans le futur.' using errcode = '22023';
  end if;
  update public.membres set acces_offert_jusqua = jusqua where id = cible;
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values (cible, (select auth.uid()),
          case when jusqua is null then 'acces_offert_retire' else 'acces_offert' end,
          case when jusqua is null then null else to_char(jusqua at time zone 'Europe/Paris', 'DD/MM/YYYY') end);
end;
$$;

-- Coupe (true) ou rétablit (false) l'accès.
create function public.admin_couper_acces(cible uuid, coupe boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.verifier_admin_et_membre(cible);
  update public.membres set acces_coupe = coupe where id = cible;
  insert into public.journal_admin (membre_id, admin_id, action)
  values (cible, (select auth.uid()), case when coupe then 'acces_coupe' else 'acces_retabli' end);
end;
$$;

-- Note dans le journal le renvoi de l'e-mail d'accès (l'envoi lui-même est fait par le serveur).
create function public.admin_noter_email_acces(cible uuid, detail text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.verifier_admin_et_membre(cible);
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values (cible, (select auth.uid()), 'email_acces_renvoye', left(detail, 200));
end;
$$;

revoke all on function public.verifier_admin_et_membre(uuid),
                      public.admin_offrir_acces(uuid, timestamptz),
                      public.admin_couper_acces(uuid, boolean),
                      public.admin_noter_email_acces(uuid, text)
  from public, anon;
grant execute on function public.admin_offrir_acces(uuid, timestamptz),
                          public.admin_couper_acces(uuid, boolean),
                          public.admin_noter_email_acces(uuid, text)
  to authenticated;
