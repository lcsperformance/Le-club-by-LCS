-- Le Club by LCS — le ressenti de séance ne demande plus de « douleur ou gêne ».
-- On ne collecte pas de données de santé : il reste le RPE (1 à 10) et un commentaire facultatif
-- (« Ton ressenti sur la séance »), lus seulement par le membre et l'encadrement du Club (coachs, admins).
-- Les droits de modification du membre (rpe, commentaire) ne changent pas.

alter table public.ressentis drop column douleur;

comment on table public.ressentis is
  'Séances faites et ressenti (RPE, commentaire) : visibles du membre et de l''encadrement (coachs, admins) seulement.';
