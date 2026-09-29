-- Relia — Table de la liste d'attente Zordi (ex-Jordu). La migration
-- 012_jordu_waitlist.sql n'a jamais été exécutée en base (table jamais
-- créée), donc on crée directement zordi_waitlist plutôt que de renommer
-- une table inexistante. Idempotent : peut être ré-exécuté sans erreur,
-- et renomme jordu_waitlist si jamais elle existe déjà ailleurs.
--
-- À exécuter manuellement dans Supabase → SQL Editor.

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'jordu_waitlist')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'zordi_waitlist') then
    alter table public.jordu_waitlist rename to zordi_waitlist;
  end if;
end $$;

create table if not exists public.zordi_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'zordi_landing',
  created_at timestamptz not null default now()
);

alter table public.zordi_waitlist enable row level security;

update public.zordi_waitlist set source = 'zordi_landing' where source = 'jordu_landing';

alter table public.zordi_waitlist alter column source set default 'zordi_landing';

comment on table public.zordi_waitlist is
  'Inscriptions à la liste d''attente Zordi depuis la landing page /zordi — écrites uniquement par api/waitlist.ts (clé service_role). Ne pas confondre avec `users` (comptes Relia réels) : ce sont de simples emails collectés avant l''ouverture des tests Zordi.';
