-- Le Club by LCS — prénom du membre.
-- Récupéré au paiement (nom saisi chez Stripe) s'il est vide, et modifiable par le membre
-- sur sa propre fiche (écran Profil). Affiché sur l'accueil (« Salut Caroline »).

alter table public.membres
  add column prenom text
    check (prenom is null or (length(btrim(prenom)) between 1 and 40));

-- Le membre peut modifier son prénom (comme son niveau et son profil), et rien d'autre.
grant update (prenom) on public.membres to authenticated;
-- Le serveur (webhook Stripe) a déjà le droit de mettre à jour la fiche (migration précédente).
