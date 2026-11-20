-- Journal admin sans doublon : une action qui ne change rien (même date offerte, accès déjà coupé
-- ou déjà rétabli) n'écrit plus rien. Le « where … is distinct from » tient aussi quand deux appels
-- arrivent en même temps : le second attend le verrou de la ligne, puis ne trouve plus rien à changer.
-- « create or replace » garde les droits déjà accordés (admin seulement, vérifié dans chaque fonction).

create or replace function public.admin_offrir_acces(cible uuid, jusqua timestamptz)
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
  update public.membres set acces_offert_jusqua = jusqua
   where id = cible and acces_offert_jusqua is distinct from jusqua;
  if not found then
    return;
  end if;
  insert into public.journal_admin (membre_id, admin_id, action, detail)
  values (cible, (select auth.uid()),
          case when jusqua is null then 'acces_offert_retire' else 'acces_offert' end,
          case when jusqua is null then null else to_char(jusqua at time zone 'Europe/Paris', 'DD/MM/YYYY') end);
end;
$$;

create or replace function public.admin_couper_acces(cible uuid, coupe boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.verifier_admin_et_membre(cible);
  update public.membres set acces_coupe = coupe
   where id = cible and acces_coupe is distinct from coupe;
  if not found then
    return;
  end if;
  insert into public.journal_admin (membre_id, admin_id, action)
  values (cible, (select auth.uid()), case when coupe then 'acces_coupe' else 'acces_retabli' end);
end;
$$;
