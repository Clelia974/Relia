-- Relia — Renomme la table de la liste d'attente Jordu → Zordi, suite au
-- changement de nom de marque (Jordu → Zordi). Idempotent : ne fait rien si
-- la table a déjà été renommée ou si elle n'existe pas encore (premier
-- déploiement direct sous le nom Zordi).
--
-- À exécuter manuellement dans Supabase → SQL Editor, après 012_jordu_waitlist.sql.

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'jordu_waitlist')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'zordi_waitlist') then
    alter table public.jordu_waitlist rename to zordi_waitlist;
  end if;
end $$;

update public.zordi_waitlist set source = 'zordi_landing' where source = 'jordu_landing';

alter table public.zordi_waitlist alter column source set default 'zordi_landing';

comment on table public.zordi_waitlist is
  'Inscriptions à la liste d''attente Zordi depuis la landing page /zordi — écrites uniquement par api/waitlist.ts (clé service_role). Ne pas confondre avec `users` (comptes Relia réels) : ce sont de simples emails collectés avant l''ouverture des tests Zordi.';
