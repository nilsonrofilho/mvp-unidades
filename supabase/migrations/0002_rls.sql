-- 0002_rls.sql
-- Row Level Security policies for all tables.

-- Helper functions
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.empreendimentos enable row level security;
alter table public.unidades enable row level security;
alter table public.clientes enable row level security;
alter table public.reservas enable row level security;
alter table public.vendas enable row level security;
alter table public.arquivos_empreendimento enable row level security;

-- profiles
create policy "logged users read profiles" on public.profiles
  for select using (auth.uid() is not null);
create policy "admin manages profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());
create policy "user updates own profile basics" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- empreendimentos
create policy "logged users read empreendimentos" on public.empreendimentos
  for select using (auth.uid() is not null);
create policy "admin manages empreendimentos" on public.empreendimentos
  for all using (public.is_admin()) with check (public.is_admin());

-- unidades
create policy "logged users read unidades" on public.unidades
  for select using (auth.uid() is not null);
create policy "admin manages unidades" on public.unidades
  for all using (public.is_admin()) with check (public.is_admin());

-- clientes
create policy "logged users read clientes" on public.clientes
  for select using (auth.uid() is not null);
create policy "logged users insert clientes" on public.clientes
  for insert with check (auth.uid() is not null and criado_por = auth.uid());
create policy "admin manages clientes" on public.clientes
  for all using (public.is_admin()) with check (public.is_admin());
create policy "corretor updates own clientes" on public.clientes
  for update using (criado_por = auth.uid()) with check (criado_por = auth.uid());

-- reservas
create policy "logged users read reservas" on public.reservas
  for select using (auth.uid() is not null);
create policy "logged users insert reservas" on public.reservas
  for insert with check (auth.uid() is not null and corretor_id = auth.uid());
create policy "admin manages reservas" on public.reservas
  for all using (public.is_admin()) with check (public.is_admin());
create policy "corretor updates own reservas" on public.reservas
  for update using (corretor_id = auth.uid()) with check (corretor_id = auth.uid());

-- vendas
create policy "logged users read vendas" on public.vendas
  for select using (auth.uid() is not null);
create policy "admin manages vendas" on public.vendas
  for all using (public.is_admin()) with check (public.is_admin());

-- arquivos_empreendimento
create policy "logged users read arquivos" on public.arquivos_empreendimento
  for select using (auth.uid() is not null);
create policy "admin manages arquivos" on public.arquivos_empreendimento
  for all using (public.is_admin()) with check (public.is_admin());
