-- Relia — Contrats partagés : la décoratrice uploade son propre PDF
-- (rédigé/signé ailleurs — Relia ne génère aucun contrat), on lui donne un
-- lien de partage sans compte pour sa cliente. Même principe de secret
-- (uuid imprévisible) que devis_partages / factures_partages.
--
-- À exécuter manuellement dans Supabase → SQL Editor.
-- Idempotent : peut être ré-exécuté sans erreur.

-- Bucket public : la lecture d'un fichier ne demande aucune policy
-- (servie directement par l'URL publique), seul le chemin (préfixé par
-- l'uuid du contrat) doit rester imprévisible — jamais de listing public.
insert into storage.buckets (id, name, public)
values ('contrats', 'contrats', true)
on conflict (id) do nothing;

-- Écriture : uniquement sous son propre dossier (préfixe = son user id),
-- jamais dans celui d'une autre décoratrice.
drop policy if exists "contrats_insert_own_folder" on storage.objects;
create policy "contrats_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'contrats' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "contrats_select_own_folder" on storage.objects;
create policy "contrats_select_own_folder"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'contrats' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "contrats_delete_own_folder" on storage.objects;
create policy "contrats_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'contrats' and (storage.foldername(name))[1] = auth.uid()::text);

-- Métadonnées de partage — trace ce qui a été envoyé et à qui, et sert de
-- page d'atterrissage /contrat/:id (redirige vers le fichier public).
create table if not exists public.contrats_partages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_email text,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

alter table public.contrats_partages enable row level security;

drop policy if exists contrats_partages_select_public on public.contrats_partages;
create policy contrats_partages_select_public
  on public.contrats_partages for select
  to anon, authenticated
  using (true);

-- Aucune policy INSERT/UPDATE/DELETE : uniquement api/contrats/share.ts (clé service_role).

create index if not exists contrats_partages_user_idx on public.contrats_partages (user_id, created_at desc);

comment on table public.contrats_partages is
  'Métadonnées d''un contrat partagé (fichier uploadé par la décoratrice dans le bucket "contrats") — /contrat/:id redirige vers le fichier. Écrit uniquement par api/contrats/share.ts.';
