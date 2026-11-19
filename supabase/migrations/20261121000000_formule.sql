-- Le Club by LCS — formule d'abonnement : mensuelle (49 €/mois) ou annuelle (499 €/an).
-- Écrite seulement par le serveur (webhook Stripe), à partir de l'abonnement Stripe ;
-- le membre la lit sur sa fiche (carte « Mon abonnement ») mais ne peut pas la modifier :
-- les droits par colonne ne lui donnent en écriture que niveau, profil et prénom.

create type public.formule_abonnement as enum ('mensuelle', 'annuelle');

alter table public.membres
  add column formule public.formule_abonnement;

comment on column public.membres.formule is
  'Formule de l''abonnement Stripe en cours (null : pas encore d''abonnement).';
