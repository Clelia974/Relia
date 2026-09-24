-- Relia — Offre de lancement : compteur atomique pour ne jamais dépasser
-- 100 places, même si deux souscriptions arrivent au même instant.
--
-- À exécuter manuellement dans Supabase → SQL Editor, après
-- 004_add_launch_offer.sql.
--
-- Pourquoi une table dédiée plutôt qu'un simple `count(*) from users where
-- is_launch_offer = true` : un COUNT lu puis un UPDATE écrit séparément
-- n'est jamais atomique — deux webhooks Stripe traités en parallèle
-- pourraient tous les deux lire "99" et tous les deux passer, dépassant
-- la limite. Une seule ligne, incrémentée par un UPDATE ... WHERE ...
-- RETURNING, est atomique par construction en Postgres (verrou de ligne
-- automatique le temps de la requête) : au plus 100 UPDATE peuvent
-- réussir, quel que soit le nombre de webhooks reçus en même temps.
--
-- Idempotent : peut être ré-exécuté sans erreur ni réinitialiser le compte déjà en cours.

create table if not exists public.launch_offer_counter (
  id smallint primary key default 1,
  redeemed_count integer not null default 0,
  constraint launch_offer_counter_single_row check (id = 1)
);

insert into public.launch_offer_counter (id, redeemed_count)
values (1, 0)
on conflict (id) do nothing;

alter table public.launch_offer_counter enable row level security;

-- Lecture publique (affichage du nombre de places restantes sur la landing) — jamais d'écriture depuis le client, uniquement via la clé service_role (webhook).
drop policy if exists "launch_offer_counter_select_public" on public.launch_offer_counter;
create policy "launch_offer_counter_select_public"
  on public.launch_offer_counter for select
  to anon, authenticated
  using (true);

comment on table public.launch_offer_counter is
  'Ligne unique (id=1) : redeemed_count est incrémenté atomiquement par api/stripe/webhook.ts (via la fonction claim_launch_offer_slot) au moment où une souscription à l''offre de lancement est confirmée. Source de vérité du nombre de places prises — public.users.is_launch_offer reste utile pour retrouver quelles clientes en profitent, mais n''est plus recompté à chaque affichage.';

-- `security definer` : s'exécute avec les droits du propriétaire de la fonction (contourne RLS pour l'UPDATE),
-- mais reste appelée uniquement depuis le webhook via la clé service_role — jamais exposée au client.
-- L'UPDATE ... WHERE redeemed_count < 100 RETURNING est une seule instruction atomique : Postgres verrouille
-- la ligne le temps de la requête, donc deux appels simultanés ne peuvent jamais faire dépasser 100 réussites.
create or replace function public.claim_launch_offer_slot()
returns integer
language sql
security definer
set search_path = public
as $$
  update public.launch_offer_counter
  set redeemed_count = redeemed_count + 1
  where id = 1 and redeemed_count < 100
  returning redeemed_count;
$$;

revoke all on function public.claim_launch_offer_slot() from public;
grant execute on function public.claim_launch_offer_slot() to service_role;
