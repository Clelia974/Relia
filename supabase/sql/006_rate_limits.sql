-- Relia — Rate limiting pour les endpoints Vercel exposés (checkout,
-- portail de facturation, compteur d'offre de lancement).
--
-- À exécuter manuellement dans Supabase → SQL Editor, après
-- 005_launch_offer_counter.sql.
--
-- Pas besoin d'un service externe (Upstash/Redis) : Supabase est déjà en
-- place, et le volume de ces endpoints est faible — une fenêtre glissante
-- en Postgres suffit largement. Même principe atomique que
-- claim_launch_offer_slot() : un seul UPSERT ... RETURNING, jamais un
-- "lire le compteur puis écrire" qui laisserait une fenêtre de course
-- sous requêtes concurrentes.
--
-- Idempotent : peut être ré-exécuté sans erreur.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  request_count integer not null default 0
);

alter table public.rate_limits enable row level security;

-- Aucune policy pour anon/authenticated : jamais lu ni écrit directement
-- par le client, uniquement via la fonction security definer ci-dessous
-- (appelée avec la clé service_role depuis les fonctions Vercel).

comment on table public.rate_limits is
  'Une ligne par clé (ex: "checkout-session:1.2.3.4") : request_count compte les appels dans la fenêtre glissante courante (window_start). Écrite uniquement par check_rate_limit(), appelée depuis api/_lib/rateLimit.ts.';

-- `security definer` : contourne RLS pour l'UPSERT, mais reste appelée uniquement
-- depuis le serveur (clé service_role) — jamais exposée au client.
-- Fenêtre fixe (pas glissante au sens strict) : si la fenêtre en cours pour
-- cette clé est expirée, elle est réinitialisée à 1 ; sinon le compteur est
-- incrémenté. Une seule instruction atomique (INSERT ... ON CONFLICT DO
-- UPDATE ... RETURNING) : Postgres verrouille la ligne le temps de la
-- requête, donc deux appels simultanés ne peuvent jamais tous les deux
-- lire un compteur périmé.
create or replace function public.check_rate_limit(p_key text, p_max_requests integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, request_count)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set request_count = case
          when public.rate_limits.window_start <= v_now - (p_window_seconds || ' seconds')::interval
            then 1
          else public.rate_limits.request_count + 1
        end,
        window_start = case
          when public.rate_limits.window_start <= v_now - (p_window_seconds || ' seconds')::interval
            then v_now
          else public.rate_limits.window_start
        end
  returning request_count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
