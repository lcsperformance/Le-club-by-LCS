-- Le Club by LCS — la base ferme le contenu du Club aux comptes dont l'accès est terminé ou coupé.
--
-- Avant : les écrans renvoyaient un ancien membre vers « Abonnement », mais la base ne vérifiait que
-- « connecté » : avec sa session, il pouvait encore lire messages, questions, agenda, ressources, et
-- son ancienneté continuait de débloquer des contenus.
-- Désormais : acces_actif() (même règle que aAcces dans l'app) est exigé pour lire et écrire le contenu
-- partagé ; l'ancienneté s'arrête à la fin de l'accès. Un ancien membre garde ses propres données
-- (tests, zones, saison, records, ressentis) : il peut les télécharger ou supprimer son compte.

-- Accès en cours : l'équipe du Club (coach, admin), ou un membre dont l'accès n'est pas coupé
-- et dont l'abonnement ou l'accès offert court encore.
create function public.acces_actif()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select m.role in ('coach', 'admin')
        or (not m.acces_coupe and (m.abonnement_fin > now() or m.acces_offert_jusqua > now())) is true
    from public.membres m
    where m.id = (select auth.uid())
  ), false);
$$;

revoke all on function public.acces_actif() from public, anon;
grant execute on function public.acces_actif() to authenticated;

-- Ancienneté figée à la fin de l'accès : un ancien membre ne débloque plus rien.
create or replace function public.semaine_anciennete()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select ((least(now(), greatest(m.abonnement_fin, m.acces_offert_jusqua, m.date_inscription)) at time zone 'Europe/Paris')::date
          - (m.date_inscription at time zone 'Europe/Paris')::date) / 7 + 1
  from public.membres m where m.id = (select auth.uid());
$$;

-- Une ressource n'est débloquée que pendant l'accès (vidéos, PDF, commentaires, favoris).
create or replace function public.ressource_debloquee(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.est_encadrant(), false)
      or (public.acces_actif() and exists (
        select 1 from public.ressources r
        where r.id = rid and r.semaine_deblocage <= coalesce(public.semaine_anciennete(), 0)
      ));
$$;

-- Non-lus du Club : rien pour un compte sans accès.
create or replace function public.canaux_non_lus()
returns table(canal text, non_lus integer)
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
  where (select auth.uid()) is not null and public.acces_actif();
$$;

-- Lecture du contenu partagé : accès en cours exigé.
alter policy "connecté : lit les messages" on public.messages_club using ((select public.acces_actif()));
alter policy "connecté : lit les questions" on public.questions_faq using ((select public.acces_actif()));
alter policy "connecté : lit l'agenda" on public.evenements using ((select public.acces_actif()));
alter policy "connecté : lit les canaux" on public.canaux using ((select public.acces_actif()));
alter policy "connecté : lit le catalogue" on public.ressources using ((select public.acces_actif()));
alter policy "connecté : lit les thèmes" on public.themes_ressources using ((select public.acces_actif()));
alter policy "connecté : lit les sous-rubriques" on public.sous_rubriques using ((select public.acces_actif()));
alter policy "membre : lit les partenaires affichés" on public.partenaires
  using ((affiche and (select public.acces_actif())) or public.role_actuel() = 'admin');

-- Écriture : publier un message ou poser une question demande aussi un accès en cours
-- (les commentaires passent déjà par ressource_debloquee). Retirer les siens reste toujours possible.
alter policy "membre : écrit en son nom, annonces réservées à l'équipe" on public.messages_club
  with check (
    membre_id = (select auth.uid())
    and (select public.acces_actif())
    and (
      not exists (select 1 from public.canaux c where c.cle = messages_club.canal and c.lecture_seule)
      or public.role_actuel() in ('admin', 'coach')
    )
  );
alter policy "membre : pose une question en son nom" on public.questions_faq
  with check (membre_id = (select auth.uid()) and (select public.acces_actif()));
