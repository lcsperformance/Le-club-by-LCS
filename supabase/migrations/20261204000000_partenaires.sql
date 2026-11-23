-- Le Club by LCS — Avantages : remises des partenaires, réservées aux membres.
-- Lues par les membres connectés (seulement les partenaires affichés) ; écrites par l'admin seul.

create table public.partenaires (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null check (char_length(nom) between 1 and 40 and nom = btrim(nom)),
  remise       smallint not null check (remise between 1 and 90),  -- en pourcentage : 15 = « −15 % »
  description  text not null check (char_length(description) between 1 and 80 and description = btrim(description)),
  code         text not null check (code ~ '^[A-Za-z0-9_-]{3,30}$'),
  lien         text check (lien is null or (char_length(lien) <= 300 and lien ~ '^https://')),
  ordre        smallint not null default 1 check (ordre between 1 and 99),
  affiche      boolean not null default true,   -- false : masqué aux membres (préparation, partenariat terminé)
  exemple      boolean not null default false   -- code d'exemple, à remplacer par le vrai
);

comment on table public.partenaires is 'Avantages du Club : remises des partenaires, codes réservés aux membres connectés.';

revoke all on public.partenaires from anon, authenticated;
grant select, insert, update, delete on public.partenaires to authenticated;

alter table public.partenaires enable row level security;

create policy "membre : lit les partenaires affichés" on public.partenaires
  for select to authenticated using (affiche or public.role_actuel() = 'admin');
create policy "admin : ajoute un partenaire" on public.partenaires for insert to authenticated
  with check (public.role_actuel() = 'admin');
create policy "admin : modifie un partenaire" on public.partenaires for update to authenticated
  using (public.role_actuel() = 'admin') with check (public.role_actuel() = 'admin');
create policy "admin : supprime un partenaire" on public.partenaires for delete to authenticated
  using (public.role_actuel() = 'admin');

-- Exemples (codes à remplacer depuis /admin/partenaires).
insert into public.partenaires (nom, remise, description, code, ordre, exemple) values
  ('Pyrène', 15, 'sur les produits Pyrène', 'LECLUB15', 1, true),
  ('Onatera', 10, 'sur les produits Onatera', 'LECLUB10', 2, true);

-- /ressources/calculateur : l'adresse ne doit jamais être prise par un thème des Ressources.
alter table public.themes_ressources drop constraint themes_ressources_cle_check;
alter table public.themes_ressources add constraint themes_ressources_cle_check
  check (cle ~ '^[a-z_]{1,30}$' and cle not in ('favoris', 'contenu', 'calculateur'));
