-- Le Club by LCS — abonnement Stripe.
-- Le serveur (clé secrète, webhook Stripe) est le seul à écrire ces informations ;
-- le membre peut les lire sur sa propre fiche (écran Profil).

alter table public.membres
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text,
  -- Fin de la période déjà payée : l'accès est ouvert jusqu'à cette date, même après
  -- une résiliation ou un paiement en échec.
  add column abonnement_fin timestamptz,
  add column annulation_prevue boolean not null default false;

comment on column public.membres.abonnement_fin is
  'Fin de la période payée chez Stripe : accès ouvert jusqu''à cette date.';

-- Les droits par colonne de la première migration ne donnent au membre que niveau et profil
-- en écriture : ces nouvelles colonnes restent en lecture seule pour lui.

-- Événements Stripe déjà traités : un même webhook reçu deux fois n'est appliqué qu'une fois.
create table public.stripe_evenements (
  id text primary key,          -- identifiant de l'événement Stripe (evt_…)
  type text not null,
  traite_le timestamptz not null default now()
);

alter table public.stripe_evenements enable row level security;
-- Aucune règle : personne d'autre que le serveur (clé secrète) n'y a accès.
revoke all on public.stripe_evenements from anon, authenticated;
