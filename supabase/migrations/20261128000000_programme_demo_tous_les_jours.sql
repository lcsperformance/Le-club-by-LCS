-- Le Club by LCS — DÉMONSTRATION : une séance chaque jour de la semaine 1 du fil rouge, pour tester l'app
-- n'importe quel jour (Finisher lundi et vendredi, Challenger vendredi ; Performer avait déjà 7 jours).
-- Mêmes identifiants « de000000- » que le reste de la démo : supprimés avec elle.

insert into public.seances (id, sport, titre, duree_minutes) values
  ('de000000-0000-0000-0000-000000000106', 'natation', 'Aisance & respiration', 30),
  ('de000000-0000-0000-0000-000000000107', 'renfo', 'Mobilité & gainage', 20),
  ('de000000-0000-0000-0000-000000000207', 'course', 'Footing récupération', 35);

insert into public.blocs_seance (seance_id, ordre, libelle, detail, zone)
select ('de000000-0000-0000-0000-000000000' || s)::uuid, o, l, d, z
from (values
  ('106', 1, 'Échauffement', '200 m souple', 1),
  ('106', 2, 'Respiration', '8 × 25 m, respirer tous les 3 temps', 1),
  ('106', 3, 'Endurance', '4 × 100 m, récup 30 s', 2),
  ('107', 1, 'Mobilité hanches et épaules', '8 min', null),
  ('107', 2, 'Circuit gainage', '2 tours · 30 s par exercice', null),
  ('207', 1, 'Footing', '30 min très facile', 1),
  ('207', 2, 'Retour au calme', '5 min en marchant', null)
) as b (s, o, l, d, z);

insert into public.programme (phase, semaine, jour, ordre, niveau, profil, seance_id)
select 'fil_rouge', 1, j, 1, n::public.niveau, p.profil, ('de000000-0000-0000-0000-000000000' || s)::uuid
from (values
  ('finisher', 1, '106'),
  ('finisher', 5, '107'),
  ('challenger', 5, '207')
) as r (n, j, s)
cross join (values ('extensif'::public.profil), ('intensif'::public.profil)) as p (profil);
