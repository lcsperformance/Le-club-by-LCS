-- Ma saison : nom de la course, facultatif (« Triathlon de Nice »). Sans nom : « Triathlon M ».
-- Les droits sur la table (sécurité par ligne : chacun ses objectifs) couvrent la nouvelle colonne.
alter table public.objectifs
  add column nom text
  constraint objectifs_nom_valide check (nom is null or (char_length(nom) between 1 and 60 and nom = btrim(nom)));

comment on column public.objectifs.nom is
  'Nom de la course choisi par le membre (facultatif, 60 caractères au plus, sans espace au début ni à la fin).';
