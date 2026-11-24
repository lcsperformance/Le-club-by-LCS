-- Le Club by LCS — notification à la création d'un événement de l'agenda et quand sa date change
-- (hors FAQ en visio, qui ont leur rappel la veille). Réglage du Profil, modifiable par le membre.

alter table public.membres
  add column notif_evenements boolean not null default true;

grant update (notif_evenements) on public.membres to authenticated;

comment on column public.membres.notif_evenements is
  'Recevoir une notification quand un événement est ajouté à l''agenda ou change de date (hors FAQ).';
