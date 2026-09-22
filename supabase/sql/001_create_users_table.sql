-- Relia — Étape 1 (Auth), Sprint 4 : profil utilisateur (trial / abonnement).
--
-- À exécuter manuellement dans Supabase → SQL Editor (projet
-- onpvqzewpyedbfnltqif). Rien n'est exécuté automatiquement par l'app.
--
-- Ce script :
--   1. crée public.users (id = auth.users.id, email, trial_end_date,
--      subscription_status, created_at, updated_at) ;
--   2. active RLS + 2 policies minimales : un utilisateur authentifié peut
--      lire et modifier UNIQUEMENT sa propre ligne (SELECT, UPDATE — pas
--      d'INSERT/DELETE côté client) ;
--   3. crée la ligne automatiquement à l'inscription via un trigger sur
--      auth.users (AFTER INSERT), pour ne PAS avoir besoin d'une policy
--      INSERT côté client — la seule chose que ce script touche sur
--      auth.users est ce trigger ; aucune colonne existante n'est modifiée.
--   4. tient updated_at à jour automatiquement.
--
-- Idempotent : peut être ré-exécuté sans erreur ni duplication.

-- 1. Table ----------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  -- 14 jours d'essai à partir de l'inscription, cf. Sprint 4.
  trial_end_date timestamptz not null default (now() + interval '14 days'),
  -- text + check plutôt qu'un vrai type enum Postgres : plus simple à faire
  -- évoluer plus tard (ajouter une valeur = juste changer le check).
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is
  'Profil applicatif (trial/abonnement) lié 1:1 à auth.users — jamais de données de connexion ici, uniquement du métier Relia.';

-- 2. Row Level Security -----------------------------------------------------

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Volontairement AUCUNE policy insert/delete pour le rôle authenticated :
-- la ligne est créée par le trigger ci-dessous (via security definer, donc
-- indépendant de RLS), jamais directement par le client.

-- 3. Création automatique du profil à l'inscription -------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Seule modification touchant auth.users : ce trigger (pas de colonne
-- ajoutée/modifiée sur la table elle-même).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. updated_at automatique --------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();
