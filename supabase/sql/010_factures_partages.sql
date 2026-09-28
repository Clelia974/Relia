-- Relia — Factures partagées : un instantané de la facture au moment de
-- l'envoi, consultable par la cliente sans compte, via un lien à elle
-- seule. Même principe que devis_partages (009_devis_partages.sql).
--
-- À exécuter manuellement dans Supabase → SQL Editor.
--
-- Écriture (INSERT) : uniquement via api/factures/share.ts, avec la clé
-- service_role — jamais de policy d'insertion côté client. La décoratrice
-- est toujours authentifiée (une facture n'existe que pour un mariage
-- déjà signé).
--
-- Idempotent : peut être ré-exécuté sans erreur.

create table if not exists public.factures_partages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_email text,
  -- Instantané complet (lignes, totaux, coordonnées, configuration de l'entreprise) au moment de l'envoi —
  -- jamais mis à jour ensuite, même si la facture change côté décoratrice : la cliente voit ce qui lui a été envoyé.
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.factures_partages enable row level security;

-- Lecture publique par id exact uniquement — jamais de liste, l'id (uuid aléatoire) est le seul secret.
drop policy if exists factures_partages_select_public on public.factures_partages;
create policy factures_partages_select_public
  on public.factures_partages for select
  to anon, authenticated
  using (true);

-- Aucune policy INSERT/UPDATE/DELETE : uniquement api/factures/share.ts (clé service_role).

create index if not exists factures_partages_user_idx on public.factures_partages (user_id, created_at desc);

comment on table public.factures_partages is
  'Instantané figé d''une facture envoyée à une cliente, consultable sans compte via /facture/:id — écrit uniquement par api/factures/share.ts (clé service_role, décoratrice authentifiée). Jamais mis à jour après création.';
