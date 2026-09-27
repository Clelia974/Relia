-- Relia — Ajoute lieu et nombre d'invités aux demandes entrantes, pour
-- pré-remplir directement la fiche client à la conversion en mariage.
--
-- À exécuter manuellement dans Supabase → SQL Editor, après
-- 007_leads.sql.
--
-- Idempotent : peut être ré-exécuté sans erreur.

alter table public.leads add column if not exists venue text;
alter table public.leads add column if not exists guest_count integer;
