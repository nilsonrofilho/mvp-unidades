-- pipa-arua.sql
-- Seed de demonstração: Pipa Aruã Resort Village (Tibau do Sul / RN).
-- Cria 1 empreendimento horizontal + 13 blocos × 8 casas = 104 unidades.
-- Identificador da unidade segue o padrão da apresentação: "<Bloco>-<Número>"
-- (ex.: "Farol-203" = Pipa Aruã, Bloco Farol, Casa Duplex Nº 03).
--
-- Idempotente: pode rodar várias vezes. Remove o empreendimento antigo (e suas
-- unidades em cascade) antes de recriar.
--
-- Uso:
--   psql "$DATABASE_URL" -f supabase/seeds/pipa-arua.sql
-- ou cole no SQL Editor do Supabase.

begin;

-- Limpa execução anterior (cascade derruba unidades, reservas, vendas, arquivos).
delete from public.empreendimentos where nome = 'Pipa Aruã Resort Village';
-- Clientes do seed (não cascateiam pelo empreendimento, então limpamos por email).
delete from public.clientes where email like '%@example.com';

-- 1) Empreendimento
with novo as (
  insert into public.empreendimentos (
    nome,
    tipo,
    status,
    endereco,
    cidade,
    estado,
    cep,
    data_entrega_prevista,
    planta_implantacao_url,
    descricao
  ) values (
    'Pipa Aruã Resort Village',
    'horizontal',
    'em_obras',
    'Rua Saberê, s/n — entre Av. Baía dos Golfinhos e Rua das Gameleiras',
    'Tibau do Sul',
    'RN',
    '59178-000',
    '2027-06-30',
    '/branding/plantapipa.svg',
    $$**Entre o natural e o essencial.** Qualidade de vida que cabe no seu momento.

Resort village em Pipa (Tibau do Sul/RN) com 104 unidades distribuídas em 13 blocos residenciais, organizados em 3 eixos principais. Cada bloco com identidade visual única e nomenclatura própria (Náutico, Veleiro, Falésias, Areia, Atlântico, Oceano, Enseada, Concha, Coral, Farol, Maré, Brisa, Duna).

**Zoneamento**
- Unidades habitacionais
- Área de lazer
- Área de apoio (acesso, estacionamento de visitantes)

**Infraestrutura de lazer**
- Prédio principal: recepção, mercadinho, restaurante, adega
- Piscina adulto com bar molhado e água salinizada/aquecida
- Piscina infantil e 2 jacuzzis
- 2 elevadores
- SPA, sauna, sala de massagem, relax
- Espaço Mulher
- Academia
- Rooftop com bar coberto, palco, lounge descoberto e vista mar
- Playground e salão de jogos
- Quadra de beach tennis / futevôlei e fireplace
- Redário e lagoa
- Viveiro de mudas e pet place
- Estacionamento coberto e estacionamento para visitantes$$
  )
  returning id
),

-- 2) Blocos (13)
blocos (nome, eixo, premium) as (
  values
    -- Eixo 3 (lateral oeste)
    ('Náutico',  3, true),
    ('Veleiro',  3, false),
    ('Falésias', 3, true),
    ('Areia',    3, false),
    ('Atlântico',3, false),
    ('Oceano',   3, false),
    -- Eixo 2 (centro)
    ('Enseada',  2, false),
    ('Concha',   2, false),
    ('Coral',    2, false),
    -- Eixo 1 (leste, junto ao lazer)
    ('Farol',    1, true),
    ('Maré',     1, false),
    ('Brisa',    1, false),
    ('Duna',     1, false)
),

-- 3) Casas por bloco: 4 térreas (101..104) + 4 duplex (201..204)
casas (numero, tipo) as (
  values
    (101, 'terrea'), (102, 'terrea'), (103, 'terrea'), (104, 'terrea'),
    (201, 'duplex'), (202, 'duplex'), (203, 'duplex'), (204, 'duplex')
),

-- 4) Produto cartesiano blocos × casas, com características e preço
expandido as (
  select
    n.id                                        as empreendimento_id,
    b.nome                                      as bloco,
    b.premium                                   as premium,
    c.numero                                    as numero,
    c.tipo                                      as tipo_casa,
    (b.nome || '-' || lpad(c.numero::text, 3, '0')) as identificador,
    -- ordem global determinística para distribuir status sem random()
    row_number() over (order by b.eixo, b.nome, c.numero) as ord
  from novo n
  cross join blocos b
  cross join casas c
)

insert into public.unidades (
  empreendimento_id,
  identificador,
  andar,
  posicao_no_andar,
  area_privativa_m2,
  area_total_m2,
  qtd_quartos,
  qtd_suites,
  qtd_banheiros,
  qtd_vagas,
  preco_total,
  valor_condominio,
  status
)
select
  e.empreendimento_id,
  e.identificador,
  null                                  as andar,
  e.bloco                               as posicao_no_andar,
  case when e.tipo_casa = 'duplex' then 118.50 else 78.40 end as area_privativa_m2,
  case when e.tipo_casa = 'duplex' then 142.00 else 96.20 end as area_total_m2,
  case when e.tipo_casa = 'duplex' then 3 else 2 end          as qtd_quartos,
  case when e.tipo_casa = 'duplex' then 2 else 1 end          as qtd_suites,
  case when e.tipo_casa = 'duplex' then 3 else 2 end          as qtd_banheiros,
  case when e.tipo_casa = 'duplex' then 2 else 1 end          as qtd_vagas,
  -- preço base + ajuste por tipo + bônus se bloco premium
  ((case when e.tipo_casa = 'duplex' then 890000 else 620000 end)
    + (case when e.premium then 60000 else 0 end))::numeric(14,2)         as preco_total,
  case when e.tipo_casa = 'duplex' then 780.00 else 520.00 end             as valor_condominio,
  -- distribuição determinística ~70% disponível / ~15% reservada / ~15% vendida
  case (e.ord % 20)
    when  0 then 'reservada'::public.unidade_status
    when  3 then 'vendida'::public.unidade_status
    when  6 then 'reservada'::public.unidade_status
    when  9 then 'vendida'::public.unidade_status
    when 12 then 'reservada'::public.unidade_status
    when 15 then 'vendida'::public.unidade_status
    else        'disponivel'::public.unidade_status
  end as status
from expandido e;

-- 5) Pré-requisito: precisa de pelo menos 1 corretor/admin ativo para virar criado_por
--    de clientes e corretor_id de reservas/vendas. Se não houver, aborta.
do $$
begin
  if not exists (
    select 1 from public.profiles
    where ativo = true and role in ('admin','corretor')
  ) then
    raise exception 'Nenhum profile ativo encontrado. Crie ao menos um usuário antes de rodar este seed.';
  end if;
end$$;

-- 6) Clientes fake (15). criado_por = primeiro corretor/admin ativo (determinístico por nome).
with primeiro_corretor as (
  select id from public.profiles
  where ativo = true and role in ('admin','corretor')
  order by nome
  limit 1
),
novos_clientes as (
  insert into public.clientes (nome, cpf, telefone, email, renda, tipo_renda, criado_por)
  select c.nome, c.cpf, c.telefone, c.email, c.renda, c.tipo_renda::public.tipo_renda, pc.id
  from primeiro_corretor pc
  cross join (values
    ('Ana Beatriz Souza',       '123.456.789-01', '(84) 99101-0001', 'ana.souza@example.com',      9800,  'individual'),
    ('Bruno Carvalho',          '234.567.890-12', '(84) 99101-0002', 'bruno.carvalho@example.com', 12500, 'individual'),
    ('Carla Mendes',            '345.678.901-23', '(84) 99101-0003', 'carla.mendes@example.com',   15000, 'composta'),
    ('Diego Oliveira',          '456.789.012-34', '(84) 99101-0004', 'diego.oliveira@example.com', 11200, 'individual'),
    ('Eduarda Lima',            '567.890.123-45', '(84) 99101-0005', 'eduarda.lima@example.com',    9500, 'individual'),
    ('Felipe Ramos',            '678.901.234-56', '(84) 99101-0006', 'felipe.ramos@example.com',   18000, 'composta'),
    ('Gabriela Pinto',          '789.012.345-67', '(84) 99101-0007', 'gabriela.pinto@example.com', 13400, 'individual'),
    ('Henrique Tavares',        '890.123.456-78', '(84) 99101-0008', 'henrique.tavares@example.com',16200,'composta'),
    ('Isabela Rocha',           '901.234.567-89', '(84) 99101-0009', 'isabela.rocha@example.com',  10800, 'individual'),
    ('João Pedro Almeida',      '012.345.678-90', '(84) 99101-0010', 'joao.almeida@example.com',   14100, 'individual'),
    ('Larissa Costa',           '111.222.333-44', '(84) 99101-0011', 'larissa.costa@example.com',  17500, 'composta'),
    ('Marcelo Dias',            '222.333.444-55', '(84) 99101-0012', 'marcelo.dias@example.com',    9900, 'individual'),
    ('Natália Freitas',         '333.444.555-66', '(84) 99101-0013', 'natalia.freitas@example.com',12800, 'individual'),
    ('Otávio Barbosa',          '444.555.666-77', '(84) 99101-0014', 'otavio.barbosa@example.com', 21000, 'composta'),
    ('Patrícia Nogueira',       '555.666.777-88', '(84) 99101-0015', 'patricia.nogueira@example.com',13700,'individual')
  ) as c(nome, cpf, telefone, email, renda, tipo_renda)
  returning id, nome
),

-- 7) Pool de corretores ativos (para round-robin)
corretores as (
  select id, row_number() over (order by nome) - 1 as idx,
         count(*) over () as total
  from public.profiles
  where ativo = true and role in ('admin','corretor')
),

-- 8) Pool de clientes (para round-robin)
clientes_pool as (
  select id, row_number() over (order by nome) - 1 as idx,
         count(*) over () as total
  from novos_clientes
),

-- 9) Unidades não-disponíveis do Pipa Aruã, com índice global
alvos as (
  select
    u.id                              as unidade_id,
    u.preco_total                     as preco,
    u.status                          as status_unidade,
    row_number() over (order by u.identificador) - 1 as idx
  from public.unidades u
  join public.empreendimentos e on e.id = u.empreendimento_id
  where e.nome = 'Pipa Aruã Resort Village'
    and u.status in ('reservada','vendida')
),

-- 10) Associa cada unidade-alvo a um cliente e a um corretor (round-robin)
pareado as (
  select
    a.unidade_id,
    a.preco,
    a.status_unidade,
    a.idx,
    (select id from clientes_pool where idx = a.idx % (select total from clientes_pool limit 1)) as cliente_id,
    (select id from corretores    where idx = a.idx % (select total from corretores    limit 1)) as corretor_id
  from alvos a
),

-- 11) Cria UMA reserva por unidade-alvo.
--     Status da reserva: 'ativa' se a unidade está 'reservada',
--     'convertida_em_venda' se 'vendida'.
reservas_inseridas as (
  insert into public.reservas (
    unidade_id, cliente_id, corretor_id,
    valor_proposta_total, valor_entrada, forma_pagamento, observacoes,
    status, criado_em
  )
  select
    p.unidade_id,
    p.cliente_id,
    p.corretor_id,
    p.preco,
    round(p.preco * 0.20, 2)                                          as valor_entrada,
    (case when p.idx % 2 = 0 then 'financiado' else 'a_vista' end)::public.forma_pagamento,
    'Seed de demonstração — Pipa Aruã'                                as observacoes,
    (case when p.status_unidade = 'vendida'
          then 'convertida_em_venda'
          else 'ativa' end)::public.reserva_status                    as status,
    -- espalha datas nos últimos 180 dias (determinístico, por idx)
    now() - ((p.idx * 5 + 7) || ' days')::interval                    as criado_em
  from pareado p
  returning id, unidade_id, cliente_id, corretor_id, valor_proposta_total, status, criado_em
)

-- 12) Para cada reserva já convertida, cria a venda correspondente.
insert into public.vendas (
  unidade_id, cliente_id, corretor_id, reserva_origem_id,
  valor_final, data_venda, criado_em
)
select
  r.unidade_id,
  r.cliente_id,
  r.corretor_id,
  r.id,
  r.valor_proposta_total                                              as valor_final,
  (r.criado_em + interval '14 days')::date                            as data_venda,
  r.criado_em + interval '14 days'                                    as criado_em
from reservas_inseridas r
where r.status = 'convertida_em_venda';

commit;

-- Conferência
select
  e.nome,
  count(u.*)                                                              as total_unidades,
  count(*) filter (where u.status = 'disponivel')                         as disponiveis,
  count(*) filter (where u.status = 'reservada')                          as reservadas,
  count(*) filter (where u.status = 'vendida')                            as vendidas,
  (select count(*) from public.reservas r
     join public.unidades uu on uu.id = r.unidade_id
     where uu.empreendimento_id = e.id and r.status = 'ativa')             as reservas_ativas,
  (select count(*) from public.vendas v
     join public.unidades uu on uu.id = v.unidade_id
     where uu.empreendimento_id = e.id)                                    as vendas_registradas
from public.empreendimentos e
left join public.unidades u on u.empreendimento_id = e.id
where e.nome = 'Pipa Aruã Resort Village'
group by e.nome, e.id;
