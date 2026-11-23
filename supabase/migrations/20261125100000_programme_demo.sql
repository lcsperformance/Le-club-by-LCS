-- Le Club by LCS — séances de DÉMONSTRATION : semaine 1 du fil rouge, une semaine par niveau,
-- identique pour les deux profils. À remplacer par les plans de Martin.
-- Les identifiants commencent tous par « de000000- » pour les retrouver (et les supprimer) facilement :
--   delete from public.seances where id::text like 'de000000-%';  (supprime aussi blocs et rattachements)

insert into public.seances (id, sport, titre, duree_minutes) values
  -- Finisher
  ('de000000-0000-0000-0000-000000000101', 'natation', 'Technique & aisance', 40),
  ('de000000-0000-0000-0000-000000000102', 'course', 'Footing endurance', 40),
  ('de000000-0000-0000-0000-000000000103', 'renfo', 'Gainage & stabilité', 25),
  ('de000000-0000-0000-0000-000000000104', 'velo', 'Sortie endurance', 90),
  ('de000000-0000-0000-0000-000000000105', 'course', 'Sortie longue', 55),
  -- Challenger
  ('de000000-0000-0000-0000-000000000201', 'natation', 'Technique & endurance', 45),
  ('de000000-0000-0000-0000-000000000202', 'course', 'Footing endurance', 50),
  ('de000000-0000-0000-0000-000000000203', 'renfo', 'Gainage & stabilité', 30),
  ('de000000-0000-0000-0000-000000000204', 'velo', 'Sweet spot', 75),
  ('de000000-0000-0000-0000-000000000205', 'velo', 'Sortie longue', 150),
  ('de000000-0000-0000-0000-000000000206', 'course', 'Sortie longue', 80),
  -- Performer
  ('de000000-0000-0000-0000-000000000301', 'natation', 'Seuil', 60),
  ('de000000-0000-0000-0000-000000000302', 'course', 'Fractionné', 60),
  ('de000000-0000-0000-0000-000000000303', 'renfo', 'Force & gainage', 30),
  ('de000000-0000-0000-0000-000000000304', 'velo', 'Sweet spot', 90),
  ('de000000-0000-0000-0000-000000000305', 'natation', 'Endurance', 50),
  ('de000000-0000-0000-0000-000000000306', 'course', 'Footing récupération', 45),
  ('de000000-0000-0000-0000-000000000307', 'velo', 'Sortie longue tempo', 180),
  ('de000000-0000-0000-0000-000000000308', 'course', 'Sortie longue', 90);

insert into public.blocs_seance (seance_id, ordre, libelle, detail, zone)
select ('de000000-0000-0000-0000-000000000' || s)::uuid, o, l, d, z
from (values
  -- Finisher
  ('101', 1, 'Échauffement', '200 m souple', 1),
  ('101', 2, 'Éducatifs', '6 × 25 m, récup 20 s', 2),
  ('101', 3, 'Corps de séance', '6 × 100 m, récup 30 s', 2),
  ('101', 4, 'Retour au calme', '100 m souple', 1),
  ('102', 1, 'Échauffement', '10 min en douceur', 1),
  ('102', 2, 'Footing', '25 min régulier', 2),
  ('102', 3, 'Retour au calme', '5 min', 1),
  ('103', 1, 'Mobilité hanches', '5 min', null),
  ('103', 2, 'Circuit gainage', '2 tours · 30 s par exercice', null),
  ('103', 3, 'Fentes', '2 × 10 par jambe', null),
  ('104', 1, 'Mise en route', '15 min progressif', 1),
  ('104', 2, 'Endurance', '1 h 05 régulier, boire toutes les 15 min', 2),
  ('104', 3, 'Retour au calme', '10 min souple', 1),
  ('105', 1, 'Échauffement', '10 min', 1),
  ('105', 2, 'Endurance', '40 min', 2),
  ('105', 3, 'Retour au calme', '5 min', 1),
  -- Challenger
  ('201', 1, 'Échauffement', '300 m souple', 1),
  ('201', 2, 'Éducatifs', '6 × 50 m, récup 15 s', 2),
  ('201', 3, 'Corps de séance', '5 × 200 m, récup 20 s', 3),
  ('201', 4, 'Retour au calme', '200 m souple', 1),
  ('202', 1, 'Échauffement', '10 min en douceur', 1),
  ('202', 2, 'Footing', '30 min régulier', 2),
  ('202', 3, 'Lignes droites', '5 × 20 s, récup en marchant', 4),
  ('202', 4, 'Retour au calme', '5 min', 1),
  ('203', 1, 'Mobilité hanches', '5 min', null),
  ('203', 2, 'Circuit gainage', '3 tours · 40 s par exercice', null),
  ('203', 3, 'Fentes & montées de banc', '3 × 10 par jambe', null),
  ('204', 1, 'Échauffement', '15 min progressif', 2),
  ('204', 2, 'Corps de séance', '3 × 10 min, récup 5 min', 3),
  ('204', 3, 'Retour au calme', '10 min souple', 1),
  ('205', 1, 'Mise en route', '20 min progressif', 1),
  ('205', 2, 'Endurance', '1 h 50 régulier, boire toutes les 15 min', 2),
  ('205', 3, 'Retour au calme', '20 min', 1),
  ('206', 1, 'Échauffement', '10 min', 1),
  ('206', 2, 'Endurance', '55 min', 2),
  ('206', 3, 'Finish tempo', '10 min', 3),
  ('206', 4, 'Retour au calme', '5 min', 1),
  -- Performer
  ('301', 1, 'Échauffement', '400 m souple', 1),
  ('301', 2, 'Éducatifs', '8 × 50 m, récup 15 s', 2),
  ('301', 3, 'Corps de séance', '6 × 200 m, récup 20 s', 4),
  ('301', 4, 'Retour au calme', '200 m souple', 1),
  ('302', 1, 'Échauffement', '15 min + 3 accélérations', 1),
  ('302', 2, 'Fractionné', '8 × 400 m, récup 1 min 30', 5),
  ('302', 3, 'Retour au calme', '10 min', 1),
  ('303', 1, 'Mobilité', '5 min', null),
  ('303', 2, 'Squats & soulevés de terre', '4 × 6, charge lourde', null),
  ('303', 3, 'Circuit gainage', '3 tours · 45 s par exercice', null),
  ('304', 1, 'Échauffement', '15 min progressif', 2),
  ('304', 2, 'Corps de séance', '3 × 15 min, récup 5 min', 3),
  ('304', 3, 'Retour au calme', '15 min souple', 1),
  ('305', 1, 'Échauffement', '300 m souple', 1),
  ('305', 2, 'Corps de séance', '3 × 600 m, récup 30 s', 2),
  ('305', 3, 'Retour au calme', '200 m souple', 1),
  ('306', 1, 'Footing', '45 min très facile', 1),
  ('307', 1, 'Mise en route', '20 min progressif', 1),
  ('307', 2, 'Endurance', '1 h 30', 2),
  ('307', 3, 'Blocs tempo', '3 × 15 min, récup 5 min', 3),
  ('307', 4, 'Retour au calme', '15 min', 1),
  ('308', 1, 'Échauffement', '10 min', 1),
  ('308', 2, 'Endurance', '1 h 05', 2),
  ('308', 3, 'Finish tempo', '10 min', 3),
  ('308', 4, 'Retour au calme', '5 min', 1)
) as b (s, o, l, d, z);

-- Semaine 1 du fil rouge, mêmes séances pour les profils extensif et intensif.
insert into public.programme (phase, semaine, jour, ordre, niveau, profil, seance_id)
select 'fil_rouge', 1, j, o, n::public.niveau, p.profil, ('de000000-0000-0000-0000-000000000' || s)::uuid
from (values
  ('finisher', 2, 1, '101'),
  ('finisher', 3, 1, '102'),
  ('finisher', 4, 1, '103'),
  ('finisher', 6, 1, '104'),
  ('finisher', 7, 1, '105'),
  ('challenger', 1, 1, '201'),
  ('challenger', 2, 1, '202'),
  ('challenger', 3, 1, '203'),
  ('challenger', 4, 1, '204'),
  ('challenger', 6, 1, '205'),
  ('challenger', 7, 1, '206'),
  ('performer', 1, 1, '301'),
  ('performer', 2, 1, '302'),
  ('performer', 2, 2, '303'),
  ('performer', 3, 1, '304'),
  ('performer', 4, 1, '305'),
  ('performer', 5, 1, '306'),
  ('performer', 6, 1, '307'),
  ('performer', 7, 1, '308')
) as r (n, j, o, s)
cross join (values ('extensif'::public.profil), ('intensif'::public.profil)) as p (profil);
