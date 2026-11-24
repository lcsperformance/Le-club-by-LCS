-- Le Club by LCS — zones cardio personnalisables.
-- Le membre peut désormais personnaliser ses zones de fréquence cardiaque comme celles de la course,
-- du vélo et de la natation : une ligne « cardio » dans la table zones (pourcentages de la FC au seuil).
-- Pas de ligne = valeurs du Club (frequence_cardiaque dans config/zones.json).
-- La sécurité par ligne de la table zones ne change pas : chacun lit et écrit seulement les siennes,
-- coach et admin les lisent.

alter type public.sport add value if not exists 'cardio';

comment on column public.zones.sport is
  'natation, velo, course ou cardio (zones de fréquence cardiaque, en % de la FC au seuil).';
