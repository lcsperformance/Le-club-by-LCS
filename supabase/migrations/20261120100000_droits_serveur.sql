-- Le Club by LCS — droits du serveur (clé secrète Supabase = rôle service_role).
-- Sur ce projet, les nouvelles tables ne donnent aucun droit de lecture ou d'écriture par défaut :
-- le webhook Stripe recevait « permission denied ». On accorde au serveur le strict nécessaire.
-- (service_role contourne la sécurité par ligne : il n'est utilisé que côté serveur.)

-- Webhook Stripe : retrouver et mettre à jour la fiche d'un membre.
grant select, update on public.membres to service_role;

-- Webhook Stripe : noter les événements déjà traités.
grant select, insert on public.stripe_evenements to service_role;
