-- Le Club by LCS — test facultatif de puissance max sur 5 min (vélo, en watts).
-- Comparée à la FTP, elle sert à suggérer un profil au membre (extensif ou intensif) ;
-- le membre choisit toujours lui-même. Vide = test non fait.
-- La table tests garde sa sécurité par ligne : chacun lit et écrit les siens, coach et admin les lisent.

alter table public.tests
  add column pma_5min integer check (pma_5min between 50 and 900);

comment on column public.tests.pma_5min is 'Puissance max sur 5 min à vélo (W), facultative.';
