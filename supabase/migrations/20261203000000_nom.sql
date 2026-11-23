-- Le Club by LCS — nom de famille du membre.
-- Récupéré au paiement (nom saisi chez Stripe, après le prénom) s'il est vide, et modifiable par le
-- membre sur sa propre fiche (écran Profil). Affiché au coach avec le prénom (« Caroline Dupont »).

alter table public.membres
  add column nom text
    check (nom is null or (length(btrim(nom)) between 1 and 60));

-- Le membre peut modifier son nom (comme son prénom), et rien d'autre.
grant update (nom) on public.membres to authenticated;
