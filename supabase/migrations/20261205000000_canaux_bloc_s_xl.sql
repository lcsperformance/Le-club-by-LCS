-- Le Club by LCS — canaux bloc-s et bloc-xl, à côté de bloc-m et bloc-l (blocs dans l'ordre S, M, L, XL).
-- Comme les autres canaux, ils ne sont créés que par migration : toujours aucun canal privé.

update public.canaux set ordre = ordre + 10 where ordre >= 4;

insert into public.canaux (cle, nom, description, lecture_seule, ordre) values
  ('bloc-s', 'bloc-s', 'Préparation triathlon S', false, 4),
  ('bloc-xl', 'bloc-xl', 'Préparation triathlon XL', false, 7);

update public.canaux set ordre = case cle
  when 'bloc-m' then 5
  when 'bloc-l' then 6
  when 'nutrition-matos' then 8
  when 'courses' then 9
  else ordre end
where ordre > 10;
