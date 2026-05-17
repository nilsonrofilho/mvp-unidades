-- 0001_schema.sql
-- Core schema: enums, tables, indexes, triggers.

-- Enums
create type public.user_role as enum ('admin', 'corretor');
create type public.empreendimento_tipo as enum ('vertical', 'horizontal');
create type public.empreendimento_status as enum ('lancamento', 'em_obras', 'pronto');
create type public.unidade_status as enum ('disponivel', 'reservada', 'vendida');
create type public.tipo_renda as enum ('individual', 'composta');
create type public.forma_pagamento as enum ('a_vista', 'financiado');
create type public.reserva_status as enum ('ativa', 'cancelada', 'convertida_em_venda');

-- profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  role public.user_role not null default 'corretor',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- empreendimentos
create table public.empreendimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo public.empreendimento_tipo not null,
  status public.empreendimento_status not null default 'em_obras',
  endereco text,
  cidade text,
  estado text check (char_length(estado) = 2),
  cep text,
  data_entrega_prevista date,
  foto_capa_url text,
  descricao text,
  qtd_andares int,
  qtd_unidades_por_andar int,
  planta_implantacao_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- unidades
create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  identificador text not null,
  andar int,
  posicao_no_andar text,
  area_privativa_m2 numeric(10,2),
  area_total_m2 numeric(10,2),
  qtd_quartos int,
  qtd_suites int,
  qtd_banheiros int,
  qtd_vagas int,
  preco_total numeric(14,2),
  valor_condominio numeric(10,2),
  status public.unidade_status not null default 'disponivel',
  foto_url text,
  coordenadas_poligono jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empreendimento_id, identificador)
);

create index idx_unidades_empreendimento on public.unidades(empreendimento_id);
create index idx_unidades_status on public.unidades(status);

-- clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  telefone text not null,
  email text,
  renda numeric(14,2),
  tipo_renda public.tipo_renda not null default 'individual',
  nome_2 text,
  cpf_2 text,
  renda_2 numeric(14,2),
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

-- reservas
create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id),
  corretor_id uuid not null references public.profiles(id),
  valor_proposta_total numeric(14,2) not null,
  valor_entrada numeric(14,2),
  forma_pagamento public.forma_pagamento,
  observacoes text,
  status public.reserva_status not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_reservas_unidade on public.reservas(unidade_id);
create index idx_reservas_corretor on public.reservas(corretor_id);

-- vendas
create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  unidade_id uuid not null references public.unidades(id),
  cliente_id uuid not null references public.clientes(id),
  corretor_id uuid not null references public.profiles(id),
  reserva_origem_id uuid references public.reservas(id),
  valor_final numeric(14,2) not null,
  data_venda date not null default current_date,
  criado_em timestamptz not null default now()
);

create index idx_vendas_unidade on public.vendas(unidade_id);

-- arquivos_empreendimento
create table public.arquivos_empreendimento (
  id uuid primary key default gen_random_uuid(),
  empreendimento_id uuid not null references public.empreendimentos(id) on delete cascade,
  nome text not null,
  url text not null,
  tamanho_bytes bigint not null,
  tipo_mime text not null,
  enviado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create index idx_arquivos_empreendimento on public.arquivos_empreendimento(empreendimento_id);

-- Trigger: auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'corretor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: keep atualizado_em fresh
create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger touch_empreendimentos before update on public.empreendimentos
  for each row execute function public.touch_atualizado_em();
create trigger touch_unidades before update on public.unidades
  for each row execute function public.touch_atualizado_em();
create trigger touch_reservas before update on public.reservas
  for each row execute function public.touch_atualizado_em();
