-- Le Club by LCS — un seul test de départ par membre et par jour.
-- Refaire ses tests le même jour remplace la saisie du jour (comme dans la maquette),
-- grâce à un « upsert » sur (membre_id, date_test).

alter table public.tests
  add constraint tests_un_par_jour unique (membre_id, date_test);

-- L'index (membre_id, date_test desc) devient redondant avec la contrainte.
drop index if exists public.tests_membre_date;
