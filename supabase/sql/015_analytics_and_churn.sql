-- Mesure d'audience maison (sans cookie, sans IP, sans identifiant) + dates d'abonnement pour suivre le churn.
--
-- 1. users : subscribed_at (premier paiement validé), cancelled_at (annulation), billing_interval ('month' | 'year').
--    Renseignées uniquement par le webhook Stripe (api/stripe/webhook.ts), jamais par le client.
-- 2. analytics_events : une ligne anonyme par évènement (page vue, clic, section affichée, durée sur la page).
--    Aucune colonne d'identité : ni user_id, ni IP, ni user-agent, ni identifiant de session. Écrite uniquement
--    par api/track.ts (clé de service), lue uniquement par api/admin/kpis.ts.
--    Conservation : 13 mois maximum (purge automatique dans api/admin/kpis.ts), comme le recommande la CNIL.
--
-- Idempotent : peut être ré-exécuté sans erreur.

alter table public.users
  add column if not exists subscribed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists billing_interval text check (billing_interval in ('month', 'year'));

comment on column public.users.subscribed_at is
  'Date du premier checkout.session.completed — sert à calculer au bout de combien de jours une cliente annule.';
comment on column public.users.cancelled_at is
  'Date de customer.subscription.deleted — vide tant que l''abonnement est actif.';
comment on column public.users.billing_interval is
  'Périodicité choisie au paiement (metadata posée par api/stripe/checkout-session.ts) — sert à estimer le revenu mensuel récurrent.';

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  path text not null,
  props jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at desc);

-- RLS activée et AUCUNE policy : ni anon ni authenticated ne peuvent lire ou écrire (seule la clé de service, côté serveur).
alter table public.analytics_events enable row level security;

comment on table public.analytics_events is
  'Évènements de mesure d''audience, anonymes (aucune donnée personnelle). Conservés 13 mois maximum.';
