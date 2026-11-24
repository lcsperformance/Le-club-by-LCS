-- Le Club by LCS — notifications (annonces du Club, rappel la veille d'une FAQ en visio).
--
-- appareils_notifications : un appareil (téléphone, iPad, ordinateur) qui a accepté les notifications.
--   Adresse d'envoi et clés fournies par le navigateur : privées à chaque membre.
--   Le membre lit, ajoute et retire les siens ; personne d'autre (ni coach, ni admin) ne les lit.
--   Seul le serveur (clé secrète) les lit pour envoyer, et retire ceux qui n'existent plus.
-- membres.notif_annonces / notif_faq : réglages du Profil, modifiables par le membre.
-- rappels_faq_envoyes : une FAQ n'est rappelée qu'une fois (serveur seulement).

create table public.appareils_notifications (
  id         uuid primary key default gen_random_uuid(),
  membre_id  uuid not null default auth.uid() references public.membres (id) on delete cascade,
  endpoint   text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh     text not null check (char_length(p256dh) between 1 and 200),
  auth       text not null check (char_length(auth) between 1 and 100),
  cree_le    timestamptz not null default now()
);

comment on table public.appareils_notifications is
  'Appareils qui reçoivent les notifications du Club (privés à chaque membre ; lus par le serveur pour envoyer).';

create index appareils_notifications_membre on public.appareils_notifications (membre_id);

alter table public.appareils_notifications enable row level security;

grant select, insert, delete on public.appareils_notifications to authenticated;
grant select, delete on public.appareils_notifications to service_role;

create policy "membre : lit ses appareils" on public.appareils_notifications
  for select to authenticated using (membre_id = (select auth.uid()));
create policy "membre : ajoute ses appareils" on public.appareils_notifications
  for insert to authenticated with check (membre_id = (select auth.uid()));
create policy "membre : retire ses appareils" on public.appareils_notifications
  for delete to authenticated using (membre_id = (select auth.uid()));
-- Le serveur (service_role) passe outre la sécurité par ligne : il n'a que les droits accordés ci-dessus.

-- Réglages du membre (Profil > Notifications).
alter table public.membres
  add column notif_annonces boolean not null default true,
  add column notif_faq boolean not null default true;

grant update (notif_annonces, notif_faq) on public.membres to authenticated;

comment on column public.membres.notif_annonces is 'Recevoir une notification à chaque annonce du Club.';
comment on column public.membres.notif_faq is 'Recevoir un rappel la veille de chaque FAQ en visio.';

-- Rappels déjà envoyés : une seule fois par FAQ, même si la tâche du soir passe deux fois.
create table public.rappels_faq_envoyes (
  evenement_id  uuid primary key references public.evenements (id) on delete cascade,
  envoye_le     timestamptz not null default now()
);

-- Aucune règle pour les membres : seul le serveur y accède.
alter table public.rappels_faq_envoyes enable row level security;
grant select, insert on public.rappels_faq_envoyes to service_role;

-- Le serveur lit l'agenda pour trouver les FAQ du lendemain.
grant select on public.evenements to service_role;
