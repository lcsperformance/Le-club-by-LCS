-- Le Club by LCS — ressources de DÉMONSTRATION (celles de la maquette), sans vidéo ni fichier :
-- l'app affiche « Vidéo bientôt disponible » / « Fichier bientôt disponible ».
-- Identifiants « de000000-0000-0000-0001-… » : delete from public.ressources where id::text like 'de000000-0000-0000-0001-%';

insert into public.ressources (id, theme, sous_rubrique, ordre, titre, type, semaine_deblocage)
select ('de000000-0000-0000-0001-0000000000' || n)::uuid, t, s, o, titre, ty::public.type_ressource, w
from (values
  ('01', 'nutrition', 'bases', 1, 'Les macronutriments en 5 minutes', 'video', 1),
  ('02', 'nutrition', 'bases', 2, 'Guide : composer ses repas', 'pdf', 1),
  ('03', 'nutrition', 'effort', 1, 'Que manger pendant une sortie longue', 'video', 3),
  ('04', 'nutrition', 'effort', 2, 'Tableau des apports en glucides', 'pdf', 4),
  ('05', 'natation', 'technique', 1, 'Technique de nage : les bases', 'video', 3),
  ('06', 'natation', 'technique', 2, 'Les éducatifs de natation', 'pdf', 2),
  ('07', 'natation', 'eau_libre', 1, 'S''orienter en eau libre', 'video', 5),
  ('08', 'velo', 'position_materiel', 1, 'Régler sa position', 'video', 2),
  ('09', 'velo', 'position_materiel', 2, 'Checklist matériel vélo', 'pdf', 1),
  ('10', 'velo', 'puissance', 1, 'Comprendre sa puissance seuil (FTP)', 'video', 2),
  ('11', 'course', 'technique', 1, 'Cadence et foulée', 'video', 3),
  ('12', 'course', 'technique', 2, 'Checklist matériel course à pied', 'pdf', 3),
  ('13', 'course', 'sorties_longues', 1, 'Bien gérer une sortie longue', 'video', 6),
  ('14', 'preparation', 'tests_zones', 1, 'Faire ses tests : le protocole', 'video', 2),
  ('15', 'preparation', 'tests_zones', 2, 'Guide des zones d''entraînement', 'pdf', 1),
  ('16', 'preparation', 'chaleur_transitions', 1, 'Gérer la chaleur à l''entraînement', 'video', 5),
  ('17', 'preparation', 'chaleur_transitions', 2, 'Transitions vélo–course : le guide', 'pdf', 6)
) as r (n, t, s, o, titre, ty, w);
