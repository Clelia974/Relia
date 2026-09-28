-- Relia — Liste d'attente OUI : la landing page "bis" (/oui) qui collecte
-- des emails en attendant que le MVP OUI soit prêt (avant le rebrand
-- RELIA → OUI). Table indépendante de `users` : ces adresses ne sont pas
-- des comptes Relia, juste des inscriptions à une liste d'attente.
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

create table if not exists public.oui_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'oui_landing',
  created_at timestamptz not null default now()
);

alter table public.oui_waitlist enable row level security;

-- Aucune policy (ni select, ni insert) : la table n'est accessible que via
-- la clé service_role côté serveur (api/waitlist.ts) ou directement dans
-- le SQL Editor Supabase.

comment on table public.oui_waitlist is
  'Inscriptions à la liste d''attente OUI depuis la landing page /oui — écrites uniquement par api/waitlist.ts (clé service_role). Ne pas confondre avec `users` (comptes Relia réels) : ce sont de simples emails collectés avant l''ouverture des tests OUI.';
