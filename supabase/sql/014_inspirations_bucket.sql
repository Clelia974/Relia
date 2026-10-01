-- SilkyPlace — Images du moodboard et du portfolio de clôture.
--
-- Bucket PRIVÉ : contrairement aux contrats (envoyés à la cliente via un lien
-- public), ces images sont des inspirations (souvent trouvées sur Pinterest,
-- Instagram…) et des photos de mariage — jamais servies publiquement. L'app
-- les affiche via des URL signées à durée limitée.
--
-- Rangement : <user id>/<mariage id>/<id de l'image>.<ext> — chaque
-- décoratrice ne lit et n'écrit que dans son propre dossier.
--
-- À exécuter manuellement dans Supabase → SQL Editor.
-- Idempotent : peut être ré-exécuté sans erreur.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inspirations',
  'inspirations',
  false,
  10485760, -- 10 Mo max par fichier (les images sont déjà réduites côté navigateur avant l'envoi)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "inspirations_select_own_folder" on storage.objects;
create policy "inspirations_select_own_folder"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'inspirations' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "inspirations_insert_own_folder" on storage.objects;
create policy "inspirations_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'inspirations' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "inspirations_update_own_folder" on storage.objects;
create policy "inspirations_update_own_folder"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'inspirations' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "inspirations_delete_own_folder" on storage.objects;
create policy "inspirations_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'inspirations' and (storage.foldername(name))[1] = auth.uid()::text);
