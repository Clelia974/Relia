-- Relia — Demandes entrantes ("leads") : formulaire public de contact,
-- une décoratrice par lien (identifiée par son user_id dans l'URL).
--
-- À exécuter manuellement dans Supabase → SQL Editor, après
-- 006_rate_limits.sql.
--
-- Contrairement au reste des données Relia (mariages, tâches...) qui
-- vivent uniquement dans le navigateur de la décoratrice (Zustand
-- persist), une demande entrante doit être reçue même quand elle n'a pas
-- l'app ouverte, depuis l'appareil d'une visiteuse qui n'a pas de compte.
-- C'est pour ça qu'elle a besoin d'une vraie ligne côté serveur — la
-- première donnée "métier" réellement stockée en base plutôt que dans le
-- navigateur.
--
-- Écriture (INSERT) : uniquement via api/leads.ts, avec la clé
-- service_role (contourne RLS) — jamais de policy d'insertion publique
-- ici. Le formulaire public n'écrit jamais directement dans Postgres ;
-- il passe par la fonction serverless, qui applique le rate limiting
-- (check_rate_limit, 006_rate_limits.sql) avant d'insérer. Une policy
-- "insert to anon" directe n'aurait pas ce garde-fou.
--
-- Idempotent : peut être ré-exécuté sans erreur.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  client_name text not null,
  client_phone text,
  client_email text,
  event_type text not null default 'autre',
  event_date date,
  budget_estimate numeric,
  message text,
  source text not null default 'autre',
  -- 'nouveau' : pas encore traitée · 'importe' : convertie en mariage (prospect) · 'ignore' : écartée sans suite.
  status text not null default 'nouveau',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Lecture/mise à jour/suppression : uniquement la décoratrice destinataire — jamais d'autre utilisatrice.
drop policy if exists "leads_owner_select" on public.leads;
create policy "leads_owner_select"
  on public.leads for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "leads_owner_update" on public.leads;
create policy "leads_owner_update"
  on public.leads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "leads_owner_delete" on public.leads;
create policy "leads_owner_delete"
  on public.leads for delete
  to authenticated
  using (user_id = auth.uid());

-- Aucune policy INSERT : les nouvelles demandes n'entrent que par
-- api/leads.ts (clé service_role, qui contourne RLS) — jamais depuis le
-- client, authentifié ou non.

create index if not exists leads_user_status_idx on public.leads (user_id, status, created_at desc);

comment on table public.leads is
  'Demandes entrantes reçues via le formulaire public /lead/new/:userId — écrites uniquement par api/leads.ts (clé service_role). La décoratrice les convertit en mariage (statut ''prospect'') depuis son espace, ce qui les fait ensuite vivre comme n''importe quel autre mariage (pipeline, devis, etc.) — ce tableau n''est qu''une boîte de réception temporaire, pas un second système de suivi.';
