-- Le Club by LCS — logo des partenaires (Avantages).
-- Le serveur récupère le logo sur le site du partenaire quand l'admin l'enregistre (ou l'admin en dépose
-- un à la main) et le garde dans le stockage public « logos » : les membres ne contactent jamais le site
-- du partenaire. Sans logo, la carte garde l'initiale.

alter table public.partenaires
  add column logo text check (logo is null or logo ~ '^[0-9a-f-]{36}\.(png|jpg|webp|ico)$');

comment on column public.partenaires.logo is 'Chemin du logo dans le stockage public « logos » (null : initiale).';

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('logos', 'logos', true, 1048576,
              array['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'])
      on conflict (id) do nothing;
    execute $p$
      create policy "admin : lit les logos" on storage.objects for select to authenticated
        using (bucket_id = 'logos' and public.role_actuel() = 'admin')
    $p$;
    execute $p$
      create policy "admin : dépose les logos" on storage.objects for insert to authenticated
        with check (bucket_id = 'logos' and public.role_actuel() = 'admin')
    $p$;
    execute $p$
      create policy "admin : remplace les logos" on storage.objects for update to authenticated
        using (bucket_id = 'logos' and public.role_actuel() = 'admin')
        with check (bucket_id = 'logos' and public.role_actuel() = 'admin')
    $p$;
    execute $p$
      create policy "admin : supprime les logos" on storage.objects for delete to authenticated
        using (bucket_id = 'logos' and public.role_actuel() = 'admin')
    $p$;
  end if;
end $$;
