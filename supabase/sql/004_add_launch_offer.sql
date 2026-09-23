-- Relia — Offre de lancement (100 premières clientes) : 1 mois offert +
-- tarif verrouillé, tant qu'un vrai compteur alimente l'affichage sur la
-- landing plutôt qu'un chiffre codé en dur.
--
-- À exécuter manuellement dans Supabase → SQL Editor.
--
-- `is_launch_offer` distingue une cliente qui a payé via le prix Stripe
-- dédié à cette offre (VITE_STRIPE_PRICE_LAUNCH_OFFER) d'une cliente au
-- tarif standard — c'est ce qui est compté, jamais recalculé à partir du
-- prix courant sur Stripe (qui peut changer plus tard sans affecter les
-- clientes déjà verrouillées sur l'offre).
--
-- Idempotent : peut être ré-exécuté sans erreur.

alter table public.users
  add column if not exists is_launch_offer boolean not null default false;

comment on column public.users.is_launch_offer is
  'true si l''abonnement a été souscrit via le prix Stripe de l''offre de lancement (100 premières clientes) — renseigné par le webhook (checkout.session.completed, metadata.offer = launch_100), jamais par le client. Sert uniquement à compter les places prises (api/launch-offer-count.ts).';
