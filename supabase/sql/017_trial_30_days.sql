-- Essai gratuit porté de 14 à 30 jours pour les NOUVELLES inscriptions (les comptes existants gardent leur date).
-- À garder égal à TRIAL_DAYS dans src/features/landing/landingContent.ts.
-- Idempotent : peut être ré-exécuté sans erreur.
alter table public.users alter column trial_end_date set default (now() + interval '30 days');
