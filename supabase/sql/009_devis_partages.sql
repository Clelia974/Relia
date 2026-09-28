-- Relia — Devis partagés : un instantané du devis au moment de l'envoi,
-- consultable par la cliente sans compte, via un lien à elle seule.
--
-- À exécuter manuellement dans Supabase → SQL Editor, après
-- 008_leads_venue_guests.sql.
--
-- Comme `leads`, une table dédiée et minimale plutôt qu'un accès direct
-- aux données de la décoratrice (mariages/devis vivent uniquement dans
-- son navigateur — cf. principe local-first de Relia) : seul CE devis
-- précis, figé au moment de l'envoi, jamais le reste de son espace de
-- travail. L'identifiant (uuid aléatoire) est le seul secret — jamais de
-- policy de liste, seulement une lecture par id exact.
--
-- Écriture (INSERT) : uniquement via api/devis/share.ts, avec la clé
-- service_role — jamais de policy d'insertion côté client. Contrairement
-- au formulaire de demande (public, sans compte), l'envoi d'un devis part
-- toujours d'une décoratrice connectée : la fonction vérifie son jeton
-- d'accès avant d'écrire.
--
-- Idempotent : peut être ré-exécuté sans erreur.

create table if not exists public.devis_partages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_email text,
  -- Instantané complet (lignes, totaux, coordonnées, configuration de l'entreprise) au moment de l'envoi —
  -- jamais mis à jour ensuite, même si le devis change côté décoratrice : la cliente voit ce qui lui a été envoyé.
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.devis_partages enable row level security;

-- Lecture publique par id exact uniquement — jamais de liste, l'id (uuid aléatoire) est le seul secret,
-- même principe qu'un lien "toute personne qui a le lien peut consulter".
drop policy if exists "devis_partages_select_public" on public.devis_partages;
create policy "devis_partages_select_public"
  on public.devis_partages for select
  to anon, authenticated
  using (true);

-- Aucune policy INSERT/UPDATE/DELETE : uniquement api/devis/share.ts (clé service_role).

create index if not exists devis_partages_user_idx on public.devis_partages (user_id, created_at desc);

comment on table public.devis_partages is
  'Instantané figé d''un devis envoyé à une cliente, consultable sans compte via /devis/:id — écrit uniquement par api/devis/share.ts (clé service_role, décoratrice authentifiée). Jamais mis à jour après création.';
