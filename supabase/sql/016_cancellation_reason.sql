-- Motif de résiliation donné par la cliente dans le portail Stripe (liste de choix) + commentaire libre éventuel.
-- Renseignés uniquement par le webhook Stripe (customer.subscription.deleted), jamais par le client.
-- Idempotent : peut être ré-exécuté sans erreur.
alter table public.users add column if not exists cancellation_reason text;
alter table public.users add column if not exists cancellation_comment text;
