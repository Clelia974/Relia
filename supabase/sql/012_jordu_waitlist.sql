-- Relia — Liste d'attente Jordu : la landing page "bis" (/jordu) qui collecte
-- des emails en attendant que le MVP Jordu soit prêt (nom retenu après
-- RELIA → OUI → Jordu, "aujourd'hui" en créole réunionnais). Table
-- indépendante de `users` : ces adresses ne sont pas des comptes Relia,
-- juste des inscriptions à une liste d'attente.
--
-- Si la table `oui_waitlist` (ancienne migration 012_oui_waitlist.sql,
-- nom de marque abandonné) a déjà été créée en base, elle peut être
-- supprimée manuellement (`drop table if exists public.oui_waitlist;`)
-- avant d'exécuter celle-ci — elle ne contenait au plus que quelques
-- inscriptions de test, jamais annoncée publiquement.
--
-- À exécuter manuellement dans Supabase → SQL Editor, après
-- 006_rate_limits.sql.
--
-- Écriture (INSERT) : uniquement via api/waitlist.ts, avec la clé
-- service_role (contourne RLS) — jamais de policy d'insertion publique
-- ici, même logique que 007_leads.sql. Aucune policy de lecture non plus :
-- ce tableau ne se consulte que depuis le SQL Editor Supabase.
--
-- Idempotent : peut être ré-exécuté sans erreur.

create table if not exists public.jordu_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'jordu_landing',
  created_at timestamptz not null default now()
);

alter table public.jordu_waitlist enable row level security;

-- Aucune policy (ni select, ni insert) : la table n'est accessible que via
-- la clé service_role côté serveur (api/waitlist.ts) ou directement dans
-- le SQL Editor Supabase.

comment on table public.jordu_waitlist is
  'Inscriptions à la liste d''attente Jordu depuis la landing page /jordu — écrites uniquement par api/waitlist.ts (clé service_role). Ne pas confondre avec `users` (comptes Relia réels) : ce sont de simples emails collectés avant l''ouverture des tests Jordu.';
