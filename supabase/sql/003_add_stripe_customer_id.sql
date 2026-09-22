-- Relia — Étape 3 (Paiement) : lier public.users à un client Stripe.
--
-- À exécuter manuellement dans Supabase → SQL Editor.
--
-- Nécessaire pour corriger un bug du webhook proposé initialement : les
-- événements `customer.subscription.deleted` et `invoice.payment_failed`
-- n'ont PAS de `client_reference_id` (ce champ n'existe que sur
-- `checkout.session.completed`) — seulement un `customer` (l'id client
-- Stripe). Sans le stocker ici au moment du checkout, ces événements ne
-- pourraient jamais être reliés à la bonne utilisatrice.
--
-- Idempotent : peut être ré-exécuté sans erreur.

alter table public.users
  add column if not exists stripe_customer_id text;

create unique index if not exists users_stripe_customer_id_key
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.users.stripe_customer_id is
  'Id client Stripe (cus_...), renseigné par le webhook au premier checkout.session.completed — sert à relier les événements suivants (annulation, échec de paiement), qui ne portent que le customer, jamais le user_id Supabase.';
