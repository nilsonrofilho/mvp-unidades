-- 0002_vendas_cascade.sql
-- Corrige a FK vendas.unidade_id para cascatear na deleção da unidade.
--
-- Antes: `references public.unidades(id)`  → bloqueia delete de unidade
--                                            que tem venda, e por tabela
--                                            cascade também bloqueia o
--                                            delete do empreendimento pai.
-- Depois: `on delete cascade`               → seed `pipa-arua.sql` consegue
--                                            limpar e recriar sem precisar
--                                            apagar `vendas` manualmente.
--
-- Trade-off conhecido: deletar uma unidade agora também apaga as vendas
-- históricas vinculadas. Para um MVP/demo isso é aceitável. Se no futuro
-- você precisar preservar histórico de vendas mesmo quando o
-- empreendimento for excluído, mude para `on delete restrict` e use
-- soft-delete na `unidades`.
--
-- Idempotente: o drop tem `if exists` e a recriação sempre fixa o nome
-- esperado pelo Postgres (`<tabela>_<coluna>_fkey`).

alter table public.vendas
  drop constraint if exists vendas_unidade_id_fkey;

alter table public.vendas
  add constraint vendas_unidade_id_fkey
  foreign key (unidade_id)
  references public.unidades(id)
  on delete cascade;
