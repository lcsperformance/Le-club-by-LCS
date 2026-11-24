-- Le Club by LCS — acceptation des CGV et de la politique de confidentialité à la première connexion.
-- Le membre ne peut que noter son propre accord, à la date du jour, par accepter_conditions() :
-- il n'écrit jamais ces colonnes directement (date et version fiables).

alter table public.membres
  add column conditions_version text check (conditions_version is null or conditions_version ~ '^\d{4}-\d{2}-\d{2}$'),
  add column conditions_acceptees_le timestamptz;

comment on column public.membres.conditions_version is 'Version (date) des CGV et de la politique de confidentialité acceptées.';
comment on column public.membres.conditions_acceptees_le is 'Date et heure de l''acceptation.';

create function public.accepter_conditions(version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Connexion requise.' using errcode = '42501';
  end if;
  if version !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Version inconnue.' using errcode = '22023';
  end if;
  update public.membres
     set conditions_version = version, conditions_acceptees_le = now()
   where id = (select auth.uid());
end;
$$;

revoke all on function public.accepter_conditions(text) from public, anon;
grant execute on function public.accepter_conditions(text) to authenticated;
