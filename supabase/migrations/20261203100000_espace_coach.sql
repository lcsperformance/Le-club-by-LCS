-- Le Club by LCS — espace coach : liste des athlètes limitée, historique en lecture seule.
--
-- Avant : le coach lisait la fiche entière de chaque membre (e-mail, identifiants Stripe, abonnement).
-- Désormais seul l'admin lit les fiches entières ; le coach passe par coach_athletes(), qui ne donne
-- que le prénom, le nom, le niveau, le profil, la date d'inscription et si l'accès est en cours.
-- Le coach garde la lecture seule des objectifs, tests, zones, records et ressentis (règles existantes) ;
-- il n'a aucun droit d'écriture sur les données des athlètes.

drop policy "encadrant : lit toutes les fiches" on public.membres;
create policy "admin : lit toutes les fiches" on public.membres
  for select to authenticated using (public.role_actuel() = 'admin');

create function public.coach_athletes()
returns table (
  id uuid,
  prenom text,
  nom text,
  niveau public.niveau,
  profil public.profil,
  date_inscription timestamptz,
  acces_en_cours boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.role_actuel() is null or public.role_actuel() not in ('coach', 'admin') then
    raise exception 'Réservé au coach et à l''équipe du Club.' using errcode = '42501';
  end if;
  return query
    select m.id, m.prenom, m.nom, m.niveau, m.profil, m.date_inscription,
           (not m.acces_coupe and (m.abonnement_fin > now() or m.acces_offert_jusqua > now())) is true
    from public.membres m
    where m.role = 'membre';
end;
$$;

revoke all on function public.coach_athletes() from public, anon;
grant execute on function public.coach_athletes() to authenticated;
