-- patch-planta-pipa.sql
-- Idempotente: aponta o empreendimento "Pipa Aruã" para o SVG estático
-- servido pelo Next.js em /branding/plantapipa.svg (whitelisted no proxy).
--
-- Uso:
--   psql "$DATABASE_URL" -f supabase/seeds/patch-planta-pipa.sql
-- ou cole no SQL Editor do Supabase (dashboard).

update public.empreendimentos
   set planta_implantacao_url = '/branding/plantapipa.svg'
 where nome = 'Pipa Aruã Resort Village'
   and (
     planta_implantacao_url is null
     or planta_implantacao_url = ''
     or planta_implantacao_url = '/plantapipa.svg'  -- corrige caminho antigo se já tiver sido aplicado
   );

-- Confere o resultado
select id, nome, planta_implantacao_url
  from public.empreendimentos
 where nome = 'Pipa Aruã Resort Village';
