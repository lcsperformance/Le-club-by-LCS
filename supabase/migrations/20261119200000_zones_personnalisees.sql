-- Le Club by LCS — zones personnalisées par le membre.
-- bornes = les 6 bornes en pourcentage (début de Z1 … fin de Z5), comme dans config/zones.json.
-- Pas de ligne pour un sport = le membre suit les valeurs du Club.

-- Vérifie qu'une liste de bornes est cohérente : 6 nombres entiers qui montent, entre 30 et 300.
create function public.bornes_valides(b jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(b) = 'array'
    and jsonb_array_length(b) = 6
    and not exists (
      select 1
      from jsonb_array_elements(b) with ordinality as e(valeur, rang)
      where jsonb_typeof(e.valeur) <> 'number'
         or (e.valeur)::text !~ '^\d+$'
         or (e.valeur)::int < 30
         or (e.valeur)::int > 300
         or (e.rang > 1 and (e.valeur)::int <= (b -> (e.rang::int - 2))::int)
    );
$$;

-- Remplace la vérification d'origine (« une liste ») par la vérification complète.
alter table public.zones drop constraint if exists zones_bornes_check;
alter table public.zones add constraint zones_bornes_valides check (public.bornes_valides(bornes));

comment on column public.zones.bornes is
  '6 bornes en % (début de Z1 … fin de Z5), entiers croissants entre 30 et 300.';
