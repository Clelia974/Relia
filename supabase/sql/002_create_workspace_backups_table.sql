-- Relia — Étape 2 (Cloud Backup) : une sauvegarde cloud par utilisateur.
--
-- À exécuter manuellement dans Supabase → SQL Editor (projet
-- onpvqzewpyedbfnltqif). Rien n'est exécuté automatiquement par l'app.
--
-- Corrige un bug du schéma initialement proposé : `upsert(...,
-- { onConflict: 'user_id' })` exige une contrainte d'unicité sur cette
-- colonne pour fonctionner — sans elle, chaque sauvegarde aurait inséré
-- une nouvelle ligne au lieu de remplacer la précédente. Ici, `user_id`
-- est directement la clé primaire : une seule ligne par utilisatrice,
-- upsert correct par construction, pas besoin de préciser `onConflict`
-- côté client.
--
-- Nommée `workspace_backups` (pas `weddings`) : chaque ligne contient
-- l'intégralité de l'espace de travail local (tous les mariages, tâches,
-- prestataires, finances...) sérialisé en un seul blob JSON — pas un
-- mariage individuel.
--
-- Idempotent : peut être ré-exécuté sans erreur ni duplication.

create table if not exists public.workspace_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Snapshot complet du Workspace (cf. src/schemas/workspace.ts), tel que sérialisé côté client — validé/migré à la lecture (migrateWorkspace), jamais fait confiance aveuglément.
  data jsonb not null,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.workspace_backups is
  'Une ligne par utilisatrice = un snapshot complet de son espace de travail local (push manuel depuis /parametres). Jamais consultée depuis la Vue Jour J (aucun appel réseau là-bas).';

alter table public.workspace_backups enable row level security;

drop policy if exists "workspace_backups_select_own" on public.workspace_backups;
create policy "workspace_backups_select_own"
  on public.workspace_backups for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT + UPDATE (pas de trigger ici, contrairement à public.users : la
-- sauvegarde est explicitement déclenchée par l'utilisatrice, bouton
-- "Sauvegarder" dans /parametres).
drop policy if exists "workspace_backups_insert_own" on public.workspace_backups;
create policy "workspace_backups_insert_own"
  on public.workspace_backups for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "workspace_backups_update_own" on public.workspace_backups;
create policy "workspace_backups_update_own"
  on public.workspace_backups for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Pas de policy DELETE : aucune fonctionnalité "supprimer ma sauvegarde" pour l'instant — à ajouter explicitement si besoin plus tard.
