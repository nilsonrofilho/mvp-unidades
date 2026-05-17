# Painel de Gestão de Unidades — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-instance white-label real estate unit management panel (Next.js 15 + Supabase + Vercel) for MVP Engenharia as first client, with visual unit map, reservations, file uploads, WhatsApp message generation, and admin/broker roles.

**Architecture:** Next.js 15 App Router on Vercel; Supabase for Postgres + Auth + Storage with RLS as primary security; server actions for mutations with defense-in-depth; shadcn/ui + Tailwind components; branding configurable per client via `/public/branding/` + `config/branding.ts`. Each client gets own GitHub repo + Supabase + Vercel — no shared multi-tenancy.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth + Storage), Vitest (unit tests), Playwright (e2e — minimal), Vercel.

**Reference spec:** `docs/superpowers/specs/2026-05-15-painel-unidades-design.md`

---

## Phase 0 — Project bootstrap

### Task 0.1: Initialize git repository and base structure

**Files:**
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Initialize git**

Run: `cd /Users/nilsonrofilho/Downloads/mvp-unidades && git init -b main`

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.next/
.vercel/
.env
.env.local
.env*.local
*.log
.DS_Store
coverage/
playwright-report/
test-results/
```

- [ ] **Step 3: Create initial `README.md`**

```markdown
# Painel de Unidades

Painel de gestão de empreendimentos e unidades imobiliárias.

> Produto white-label. Cada cliente tem sua própria instância (GitHub + Supabase + Vercel).
> Primeiro cliente: MVP Engenharia.

Setup instructions: see `INSTALL.md` (to be created in Phase 9).
```

- [ ] **Step 4: First commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: initial project structure with spec and plan"
```

### Task 0.2: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`, `tailwind.config.ts`, `.env.local.example`

- [ ] **Step 1: Run create-next-app**

Run from `/Users/nilsonrofilho/Downloads/mvp-unidades`:
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --use-npm --import-alias "@/*" --no-turbopack --eslint
```

If it asks to overwrite/proceed in non-empty dir, accept.

- [ ] **Step 2: Verify dev server runs**

```bash
npm run dev
```
Expected: server on `http://localhost:3000` shows default Next.js page. Stop with Ctrl+C.

- [ ] **Step 3: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js 15 app with TypeScript and Tailwind"
```

### Task 0.3: Install core dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install @supabase/supabase-js @supabase/ssr zod date-fns lucide-react react-zoom-pan-pinch sonner clsx tailwind-merge class-variance-authority
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node prettier
```

- [ ] **Step 3: Add scripts to `package.json`**

In `"scripts"` add:
```json
"test": "vitest",
"test:run": "vitest run",
"format": "prettier --write ."
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install core dependencies"
```

### Task 0.4: Setup Vitest

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 2: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Smoke test**

Create `lib/__smoke__.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => {
  it("works", () => expect(1 + 1).toBe(2));
});
```

Run: `npm run test:run`
Expected: 1 test passes.

- [ ] **Step 4: Delete smoke test and commit**

```bash
rm lib/__smoke__.test.ts
git add vitest.config.ts vitest.setup.ts package.json
git commit -m "chore: setup Vitest with React Testing Library"
```

### Task 0.5: Initialize shadcn/ui

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/*`

- [ ] **Step 1: Init shadcn**

```bash
npx shadcn@latest init -d
```
Accept defaults (New York style, neutral base, CSS vars).

- [ ] **Step 2: Install base components**

```bash
npx shadcn@latest add button input label card dialog drawer dropdown-menu select textarea badge table tabs toast sonner form checkbox radio-group separator skeleton avatar tooltip progress
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components.json components/ui lib/utils.ts app/globals.css tailwind.config.ts package.json package-lock.json
git commit -m "chore: setup shadcn/ui with base components"
```

---

## Phase 1 — Branding config and base layout

### Task 1.1: Branding configuration

**Files:**
- Create: `config/branding.ts`, `public/branding/.gitkeep`
- Test: `config/__tests__/branding.test.ts`

- [ ] **Step 1: Create folder for branding assets**

```bash
mkdir -p public/branding
touch public/branding/.gitkeep
```

- [ ] **Step 2: Create `config/branding.ts`**

```ts
export type Branding = {
  companyName: string;
  logoPath: string;
  logoDarkPath: string;
  faviconPath: string;
  primaryColor: string;
  whatsappFooter: string;
  whatsappTemplate: string;
};

export const branding: Branding = {
  companyName: "MVP Engenharia",
  logoPath: "/branding/logo.png",
  logoDarkPath: "/branding/logo-dark.png",
  faviconPath: "/branding/favicon.ico",
  primaryColor: "#0066cc",
  whatsappFooter: "— MVP Engenharia",
  whatsappTemplate: `🏢 *{empreendimento}* — {unidade}

📐 {areaPrivativa}m² privativa
🛏️ {quartos} quartos{suites}
🚿 {banheiros} banheiros
🚗 {vagas}

💰 R$ {precoTotal} (R$ {precoM2}/m²)

📍 {endereco}, {cidade}/{estado}
🗓️ Entrega: {dataEntrega}

{footer}`,
};
```

- [ ] **Step 3: Write test**

Create `config/__tests__/branding.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { branding } from "../branding";

describe("branding", () => {
  it("exposes companyName", () => {
    expect(branding.companyName).toBeTruthy();
  });
  it("has whatsappTemplate with required placeholders", () => {
    expect(branding.whatsappTemplate).toContain("{empreendimento}");
    expect(branding.whatsappTemplate).toContain("{unidade}");
    expect(branding.whatsappTemplate).toContain("{precoTotal}");
  });
});
```

- [ ] **Step 4: Run test**

`npm run test:run`
Expected: 2 pass.

- [ ] **Step 5: Commit**

```bash
git add config public/branding
git commit -m "feat(branding): add per-client branding config"
```

### Task 1.2: Wire branding into Tailwind theme

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Extend Tailwind with primary color**

Modify `tailwind.config.ts` — in `theme.extend.colors`, add:
```ts
brand: {
  DEFAULT: "var(--brand)",
  foreground: "var(--brand-foreground)",
},
```

- [ ] **Step 2: Add CSS vars in `app/globals.css`**

After the existing `:root { ... }` block, add at the bottom:
```css
:root {
  --brand: #0066cc;
  --brand-foreground: #ffffff;
}
```

(The hex will later be replaced by a small runtime sync; for now both branding.ts and CSS hold the same value — branding.ts is the source of truth and we keep CSS as a static mirror.)

- [ ] **Step 3: Update `app/layout.tsx` to use branding**

Replace the entire file:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { branding } from "@/config/branding";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `Painel · ${branding.companyName}`,
  description: `Gestão de empreendimentos — ${branding.companyName}`,
  icons: { icon: branding.faviconPath },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Build**

`npm run build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat(branding): wire branding into theme and layout"
```

---

## Phase 2 — Supabase: schema, RLS, helpers

### Task 2.1: Setup Supabase CLI and project structure

**Files:**
- Create: `supabase/config.toml`, `supabase/migrations/.gitkeep`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -D supabase
```

- [ ] **Step 2: Initialize Supabase**

```bash
npx supabase init
```
Accept defaults; if it prompts about VS Code settings or Deno, say "no".

- [ ] **Step 3: Commit**

```bash
git add supabase package.json package-lock.json
git commit -m "chore(supabase): initialize Supabase project structure"
```

### Task 2.2: Schema migration — enums and core tables

**Files:**
- Create: `supabase/migrations/0001_schema.sql`

- [ ] **Step 1: Write migration**

```sql
-- 0001_schema.sql

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0001_schema.sql
git commit -m "feat(db): create core schema with enums, tables, and triggers"
```

### Task 2.3: RLS policies migration

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write RLS migration**

```sql
-- 0002_rls.sql

-- Helper function: get current user role
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
  for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "feat(db): add RLS policies for all tables"
```

### Task 2.4: Storage buckets migration

**Files:**
- Create: `supabase/migrations/0003_storage.sql`

- [ ] **Step 1: Write storage migration**

```sql
-- 0003_storage.sql

insert into storage.buckets (id, name, public)
values
  ('empreendimentos', 'empreendimentos', true),
  ('unidades', 'unidades', true),
  ('arquivos', 'arquivos', false)
on conflict (id) do nothing;

-- empreendimentos bucket: public read, admin write
create policy "empreendimentos read public" on storage.objects
  for select using (bucket_id = 'empreendimentos');
create policy "empreendimentos admin write" on storage.objects
  for insert with check (bucket_id = 'empreendimentos' and public.is_admin());
create policy "empreendimentos admin update" on storage.objects
  for update using (bucket_id = 'empreendimentos' and public.is_admin());
create policy "empreendimentos admin delete" on storage.objects
  for delete using (bucket_id = 'empreendimentos' and public.is_admin());

-- unidades bucket: public read, admin write
create policy "unidades read public" on storage.objects
  for select using (bucket_id = 'unidades');
create policy "unidades admin write" on storage.objects
  for insert with check (bucket_id = 'unidades' and public.is_admin());
create policy "unidades admin update" on storage.objects
  for update using (bucket_id = 'unidades' and public.is_admin());
create policy "unidades admin delete" on storage.objects
  for delete using (bucket_id = 'unidades' and public.is_admin());

-- arquivos bucket: logged users read, admin write
create policy "arquivos read logged" on storage.objects
  for select using (bucket_id = 'arquivos' and auth.uid() is not null);
create policy "arquivos admin write" on storage.objects
  for insert with check (bucket_id = 'arquivos' and public.is_admin());
create policy "arquivos admin delete" on storage.objects
  for delete using (bucket_id = 'arquivos' and public.is_admin());
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/0003_storage.sql
git commit -m "feat(db): configure storage buckets and policies"
```

### Task 2.5: Supabase client helpers

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`, `lib/supabase/admin.ts`, `types/database.ts`

- [ ] **Step 1: Create `types/database.ts` (initial hand-typed; later regenerate)**

```ts
export type UserRole = "admin" | "corretor";
export type EmpreendimentoTipo = "vertical" | "horizontal";
export type EmpreendimentoStatus = "lancamento" | "em_obras" | "pronto";
export type UnidadeStatus = "disponivel" | "reservada" | "vendida";
export type TipoRenda = "individual" | "composta";
export type FormaPagamento = "a_vista" | "financiado";
export type ReservaStatus = "ativa" | "cancelada" | "convertida_em_venda";

export type Profile = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: UserRole;
  ativo: boolean;
  criado_em: string;
};

export type Empreendimento = {
  id: string;
  nome: string;
  tipo: EmpreendimentoTipo;
  status: EmpreendimentoStatus;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  data_entrega_prevista: string | null;
  foto_capa_url: string | null;
  descricao: string | null;
  qtd_andares: number | null;
  qtd_unidades_por_andar: number | null;
  planta_implantacao_url: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Coordenadas = { x: number; y: number; width: number; height: number };

export type Unidade = {
  id: string;
  empreendimento_id: string;
  identificador: string;
  andar: number | null;
  posicao_no_andar: string | null;
  area_privativa_m2: number | null;
  area_total_m2: number | null;
  qtd_quartos: number | null;
  qtd_suites: number | null;
  qtd_banheiros: number | null;
  qtd_vagas: number | null;
  preco_total: number | null;
  valor_condominio: number | null;
  status: UnidadeStatus;
  foto_url: string | null;
  coordenadas_poligono: Coordenadas | null;
  criado_em: string;
  atualizado_em: string;
};

export type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string;
  email: string | null;
  renda: number | null;
  tipo_renda: TipoRenda;
  nome_2: string | null;
  cpf_2: string | null;
  renda_2: number | null;
  criado_por: string;
  criado_em: string;
};

export type Reserva = {
  id: string;
  unidade_id: string;
  cliente_id: string;
  corretor_id: string;
  valor_proposta_total: number;
  valor_entrada: number | null;
  forma_pagamento: FormaPagamento | null;
  observacoes: string | null;
  status: ReservaStatus;
  criado_em: string;
  atualizado_em: string;
};

export type Venda = {
  id: string;
  unidade_id: string;
  cliente_id: string;
  corretor_id: string;
  reserva_origem_id: string | null;
  valor_final: number;
  data_venda: string;
  criado_em: string;
};

export type ArquivoEmpreendimento = {
  id: string;
  empreendimento_id: string;
  nome: string;
  url: string;
  tamanho_bytes: number;
  tipo_mime: string;
  enviado_por: string;
  criado_em: string;
};
```

- [ ] **Step 2: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // server component context — ignore
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Create `lib/supabase/client.ts`**

```ts
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 4: Create `lib/supabase/middleware.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login";
  const isPublic = path.startsWith("/_next") || path.startsWith("/branding") || path === "/favicon.ico";

  if (!user && !isAuthPage && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}
```

- [ ] **Step 5: Create `lib/supabase/admin.ts`** (service role; used only in server actions for admin-only ops like inviting users)

```ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

- [ ] **Step 6: Build**

`npm run build`
Expected: success.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase types/database.ts
git commit -m "feat(supabase): add server/client/admin helpers and database types"
```

---

## Phase 3 — Auth: middleware, login page, profile helpers

### Task 3.1: Wire middleware

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create `middleware.ts` at project root**

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|branding/.*).*)"],
};
```

- [ ] **Step 2: Build**

`npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): add Supabase auth middleware with redirect"
```

### Task 3.2: Profile/permissions helpers

**Files:**
- Create: `lib/permissoes.ts`
- Test: `lib/__tests__/permissoes.test.ts`

- [ ] **Step 1: Write test**

```ts
import { describe, it, expect } from "vitest";
import { isAdmin, requireAdmin } from "../permissoes";

describe("permissoes", () => {
  it("isAdmin true for admin profile", () => {
    expect(isAdmin({ role: "admin" } as never)).toBe(true);
  });
  it("isAdmin false for corretor profile", () => {
    expect(isAdmin({ role: "corretor" } as never)).toBe(false);
  });
  it("requireAdmin throws on non-admin", () => {
    expect(() => requireAdmin({ role: "corretor" } as never)).toThrow();
  });
});
```

- [ ] **Step 2: Run test (expect fail)**

`npm run test:run -- permissoes`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import type { Profile } from "@/types/database";

export function isAdmin(profile: Pick<Profile, "role"> | null | undefined): boolean {
  return profile?.role === "admin";
}

export function requireAdmin(profile: Pick<Profile, "role"> | null | undefined): void {
  if (!isAdmin(profile)) {
    throw new Error("Acesso negado: requer admin");
  }
}
```

- [ ] **Step 4: Run test**

`npm run test:run -- permissoes`
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/permissoes.ts lib/__tests__
git commit -m "feat(auth): add permission helpers"
```

### Task 3.3: getCurrentProfile helper (server-only)

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Implement**

```ts
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data ?? null) as Profile | null;
});

export async function requireAuthenticatedProfile(): Promise<Profile> {
  const p = await getCurrentProfile();
  if (!p) redirect("/login");
  return p;
}

export async function requireAdminProfile(): Promise<Profile> {
  const p = await requireAuthenticatedProfile();
  if (p.role !== "admin") redirect("/");
  return p;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/auth.ts
git commit -m "feat(auth): add server-side profile fetcher with caching"
```

### Task 3.4: Login page

**Files:**
- Create: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/login/LoginForm.tsx`, `lib/actions/auth.ts`

- [ ] **Step 1: Create `lib/actions/auth.ts`**

```ts
"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha mínima de 6 caracteres"),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "E-mail ou senha incorretos" };
  }
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  if (!z.string().email().safeParse(email).success) {
    return { error: "E-mail inválido" };
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email);
  return { success: true };
}
```

- [ ] **Step 2: Create `app/(auth)/layout.tsx`**

```tsx
import { branding } from "@/config/branding";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-muted p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-background p-8 shadow">
        <div className="flex flex-col items-center gap-2">
          <Image src={branding.logoPath} alt={branding.companyName} width={120} height={48} priority />
          <h1 className="text-lg font-semibold">{branding.companyName}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(auth)/login/LoginForm.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await loginAction(fd);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create `app/(auth)/login/page.tsx`**

```tsx
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <h2 className="text-center text-sm text-muted-foreground">Acesse seu painel</h2>
      <LoginForm />
    </>
  );
}
```

- [ ] **Step 5: Build**

`npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add app/\(auth\) lib/actions/auth.ts
git commit -m "feat(auth): add login page and auth server actions"
```

### Task 3.5: Authenticated app shell

**Files:**
- Create: `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`, `components/layout/UserMenu.tsx`

- [ ] **Step 1: Create `components/layout/UserMenu.tsx`**

```tsx
"use client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import { LogOut, User } from "lucide-react";

export function UserMenu({ nome }: { nome: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="size-4" /> {nome}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => logoutAction()}>
          <LogOut className="mr-2 size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Create `components/layout/Navbar.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { branding } from "@/config/branding";
import { UserMenu } from "./UserMenu";
import type { Profile } from "@/types/database";

export function Navbar({ profile }: { profile: Profile }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src={branding.logoPath} alt={branding.companyName} width={28} height={28} />
            <span className="font-semibold">{branding.companyName}</span>
          </Link>
          <nav className="hidden gap-4 md:flex">
            <Link href="/" className="text-sm hover:underline">Empreendimentos</Link>
            {profile.role === "admin" && (
              <Link href="/usuarios" className="text-sm hover:underline">Usuários</Link>
            )}
          </nav>
        </div>
        <UserMenu nome={profile.nome} />
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `app/(app)/layout.tsx`**

```tsx
import { requireAuthenticatedProfile } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAuthenticatedProfile();
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Replace `app/page.tsx`**

Delete `app/page.tsx` (root one) and move logic into `app/(app)/page.tsx`:

```bash
rm app/page.tsx
```

Create `app/(app)/page.tsx` placeholder:
```tsx
export default function Home() {
  return <p>Dashboard em construção.</p>;
}
```

- [ ] **Step 5: Build**

`npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add app components/layout
git commit -m "feat(auth): add authenticated app shell with navbar"
```

---

## Phase 4 — Dashboard

### Task 4.1: Formatting helpers

**Files:**
- Create: `lib/formatacao.ts`
- Test: `lib/__tests__/formatacao.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { formatBRL, formatM2, formatMonthYear, pluralize } from "../formatacao";

describe("formatacao", () => {
  it("formats BRL", () => {
    expect(formatBRL(580000)).toBe("R$ 580.000,00");
    expect(formatBRL(null)).toBe("—");
  });
  it("formats m2", () => {
    expect(formatM2(75)).toBe("75 m²");
    expect(formatM2(75.5)).toBe("75,5 m²");
    expect(formatM2(null)).toBe("—");
  });
  it("formats month/year", () => {
    expect(formatMonthYear("2026-12-15")).toMatch(/dez/i);
  });
  it("pluralizes", () => {
    expect(pluralize(1, "vaga", "vagas")).toBe("1 vaga");
    expect(pluralize(2, "vaga", "vagas")).toBe("2 vagas");
  });
});
```

- [ ] **Step 2: Run test (expect fail)**

`npm run test:run -- formatacao`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
export function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatM2(value: number | null | undefined): string {
  if (value == null) return "—";
  const str = value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${str} m²`;
}

export function formatMonthYear(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}
```

- [ ] **Step 4: Run test**

Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/formatacao.ts lib/__tests__/formatacao.test.ts
git commit -m "feat(util): add formatting helpers with tests"
```

### Task 4.2: Dashboard data fetching

**Files:**
- Create: `lib/data/empreendimentos.ts`

- [ ] **Step 1: Implement**

```ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Empreendimento, UnidadeStatus } from "@/types/database";

export type EmpreendimentoComContadores = Empreendimento & {
  total_unidades: number;
  disponiveis: number;
  reservadas: number;
  vendidas: number;
};

export type ResumoDashboard = {
  totalEmpreendimentos: number;
  totalUnidades: number;
  disponiveis: number;
  reservadas: number;
  vendidas: number;
};

export async function listarEmpreendimentos(): Promise<EmpreendimentoComContadores[]> {
  const supabase = await createSupabaseServerClient();
  const { data: emps, error } = await supabase
    .from("empreendimentos")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error || !emps) return [];
  const { data: units } = await supabase
    .from("unidades")
    .select("empreendimento_id, status");
  const byEmp = new Map<string, { total: number; disp: number; res: number; vend: number }>();
  (units ?? []).forEach((u) => {
    const cur = byEmp.get(u.empreendimento_id as string) ?? { total: 0, disp: 0, res: 0, vend: 0 };
    cur.total += 1;
    if ((u.status as UnidadeStatus) === "disponivel") cur.disp += 1;
    if ((u.status as UnidadeStatus) === "reservada") cur.res += 1;
    if ((u.status as UnidadeStatus) === "vendida") cur.vend += 1;
    byEmp.set(u.empreendimento_id as string, cur);
  });
  return (emps as Empreendimento[]).map((e) => {
    const c = byEmp.get(e.id) ?? { total: 0, disp: 0, res: 0, vend: 0 };
    return {
      ...e,
      total_unidades: c.total,
      disponiveis: c.disp,
      reservadas: c.res,
      vendidas: c.vend,
    };
  });
}

export async function resumoDashboard(): Promise<ResumoDashboard> {
  const emps = await listarEmpreendimentos();
  return emps.reduce(
    (acc, e) => ({
      totalEmpreendimentos: acc.totalEmpreendimentos + 1,
      totalUnidades: acc.totalUnidades + e.total_unidades,
      disponiveis: acc.disponiveis + e.disponiveis,
      reservadas: acc.reservadas + e.reservadas,
      vendidas: acc.vendidas + e.vendidas,
    }),
    { totalEmpreendimentos: 0, totalUnidades: 0, disponiveis: 0, reservadas: 0, vendidas: 0 },
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/data/empreendimentos.ts
git commit -m "feat(data): add empreendimentos listing with status counters"
```

### Task 4.3: Dashboard UI components

**Files:**
- Create: `components/empreendimento/CardEmpreendimento.tsx`, `components/dashboard/ResumoCards.tsx`, `components/dashboard/FiltrosDashboard.tsx`

- [ ] **Step 1: Create `CardEmpreendimento.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import type { EmpreendimentoComContadores } from "@/lib/data/empreendimentos";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const statusLabel: Record<string, string> = {
  lancamento: "Lançamento",
  em_obras: "Em obras",
  pronto: "Pronto",
};

export function CardEmpreendimento({ emp }: { emp: EmpreendimentoComContadores }) {
  const total = emp.total_unidades;
  const vendidas = emp.vendidas;
  const pct = total > 0 ? Math.round((vendidas / total) * 100) : 0;
  return (
    <Link href={`/empreendimentos/${emp.id}`} className="group rounded-lg border bg-background overflow-hidden hover:shadow-md transition">
      <div className="relative aspect-video bg-muted">
        {emp.foto_capa_url ? (
          <Image src={emp.foto_capa_url} alt={emp.nome} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground text-sm">Sem foto</div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight">{emp.nome}</h3>
          <Badge variant="secondary">{statusLabel[emp.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{emp.cidade ?? "—"}</p>
        <div className="space-y-1">
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">{pct}% vendido ({vendidas} de {total})</p>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `ResumoCards.tsx`**

```tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import type { ResumoDashboard } from "@/lib/data/empreendimentos";

const cards: Array<{ key: keyof ResumoDashboard; label: string; filter?: string }> = [
  { key: "totalEmpreendimentos", label: "Empreendimentos" },
  { key: "totalUnidades", label: "Unidades" },
  { key: "disponiveis", label: "Disponíveis", filter: "disponivel" },
  { key: "reservadas", label: "Reservadas", filter: "reservada" },
  { key: "vendidas", label: "Vendidas", filter: "vendida" },
];

export function ResumoCards({ resumo }: { resumo: ResumoDashboard }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("statusUnidade");

  function toggle(filter?: string) {
    if (!filter) return;
    const p = new URLSearchParams(params.toString());
    if (current === filter) p.delete("statusUnidade"); else p.set("statusUnidade", filter);
    router.push(`/?${p.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c) => (
        <button
          key={c.key}
          onClick={() => toggle(c.filter)}
          className={`rounded-lg border bg-background p-4 text-left transition ${current === c.filter ? "ring-2 ring-brand" : ""} ${c.filter ? "hover:bg-accent" : "cursor-default"}`}
          disabled={!c.filter}
        >
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className="text-2xl font-semibold">{resumo[c.key]}</p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `FiltrosDashboard.tsx`**

```tsx
"use client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function FiltrosDashboard({ cidades }: { cidades: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = useState(params.get("q") ?? "");

  useEffect(() => {
    const id = setTimeout(() => {
      const p = new URLSearchParams(params.toString());
      if (busca) p.set("q", busca); else p.delete("q");
      router.replace(`/?${p.toString()}`);
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value && value !== "todas" && value !== "todos") p.set(key, value); else p.delete(key);
    router.replace(`/?${p.toString()}`);
  }

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Input placeholder="Buscar por nome..." value={busca} onChange={(e) => setBusca(e.target.value)} className="md:max-w-xs" />
      <Select value={params.get("cidade") ?? "todas"} onValueChange={(v) => setParam("cidade", v)}>
        <SelectTrigger className="md:w-48"><SelectValue placeholder="Cidade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as cidades</SelectItem>
          {cidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={params.get("status") ?? "todos"} onValueChange={(v) => setParam("status", v)}>
        <SelectTrigger className="md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos status</SelectItem>
          <SelectItem value="lancamento">Lançamento</SelectItem>
          <SelectItem value="em_obras">Em obras</SelectItem>
          <SelectItem value="pronto">Pronto</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/empreendimento components/dashboard
git commit -m "feat(dashboard): add card, summary, and filters components"
```

### Task 4.4: Dashboard page assembly

**Files:**
- Modify: `app/(app)/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { listarEmpreendimentos, resumoDashboard, type EmpreendimentoComContadores } from "@/lib/data/empreendimentos";
import { CardEmpreendimento } from "@/components/empreendimento/CardEmpreendimento";
import { ResumoCards } from "@/components/dashboard/ResumoCards";
import { FiltrosDashboard } from "@/components/dashboard/FiltrosDashboard";
import { requireAuthenticatedProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

function filtra(list: EmpreendimentoComContadores[], q?: string, cidade?: string, status?: string, statusUnidade?: string) {
  return list.filter((e) => {
    if (q && !e.nome.toLowerCase().includes(q.toLowerCase())) return false;
    if (cidade && e.cidade !== cidade) return false;
    if (status && e.status !== status) return false;
    if (statusUnidade === "disponivel" && e.disponiveis === 0) return false;
    if (statusUnidade === "reservada" && e.reservadas === 0) return false;
    if (statusUnidade === "vendida" && e.vendidas === 0) return false;
    return true;
  });
}

type Search = { q?: string; cidade?: string; status?: string; statusUnidade?: string };

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const [resumo, todos] = await Promise.all([resumoDashboard(), listarEmpreendimentos()]);
  const cidades = Array.from(new Set(todos.map((e) => e.cidade).filter(Boolean))) as string[];
  const filtrados = filtra(todos, params.q, params.cidade, params.status, params.statusUnidade);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Empreendimentos</h1>
        {profile.role === "admin" && (
          <Button asChild>
            <Link href="/empreendimentos/novo"><Plus className="mr-1 size-4" /> Novo empreendimento</Link>
          </Button>
        )}
      </div>
      <ResumoCards resumo={resumo} />
      <FiltrosDashboard cidades={cidades} />
      {filtrados.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhum empreendimento encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((e) => <CardEmpreendimento key={e.id} emp={e} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build**

`npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/page.tsx
git commit -m "feat(dashboard): assemble dashboard page with summary, filters and grid"
```

---

## Phase 5 — Empreendimentos CRUD + Uploads + Arquivos

### Task 5.1: Storage upload helper (server action)

**Files:**
- Create: `lib/actions/uploads.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const DOC_TYPES = [
  "application/pdf",
  "image/png", "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const IMAGE_MAX = 10 * 1024 * 1024;
const DOC_MAX = 50 * 1024 * 1024;

export type UploadKind = "image" | "document";

export async function uploadFileAction(
  bucket: "empreendimentos" | "unidades" | "arquivos",
  kind: UploadKind,
  file: File,
  pathPrefix: string,
): Promise<{ url?: string; path?: string; error?: string }> {
  await requireAdminProfile();

  const allowed = kind === "image" ? IMAGE_TYPES : DOC_TYPES;
  const max = kind === "image" ? IMAGE_MAX : DOC_MAX;

  if (!allowed.includes(file.type)) return { error: "Tipo de arquivo não permitido" };
  if (file.size > max) return { error: "Arquivo muito grande" };

  const supabase = await createSupabaseServerClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: "Falha no upload: " + error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteFileAction(
  bucket: "empreendimentos" | "unidades" | "arquivos",
  path: string,
): Promise<{ error?: string }> {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: error.message };
  return {};
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/uploads.ts
git commit -m "feat(upload): add server actions for storage upload and delete"
```

### Task 5.2: FileUploader component (single mode)

**Files:**
- Create: `components/upload/FileUploader.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { uploadFileAction, type UploadKind } from "@/lib/actions/uploads";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, File as FileIcon } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type Props = {
  bucket: "empreendimentos" | "unidades" | "arquivos";
  kind: UploadKind;
  pathPrefix: string;
  currentUrl?: string | null;
  onUploaded: (url: string, path: string, file: File) => void;
  onRemoved?: () => void;
  label?: string;
};

export function FileUploader({ bucket, kind, pathPrefix, currentUrl, onUploaded, onRemoved, label }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const ref = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setBusy(true);
    setProgress(15);
    if (kind === "image") setPreview(URL.createObjectURL(file));
    setProgress(40);
    const res = await uploadFileAction(bucket, kind, file, pathPrefix);
    setProgress(90);
    if (res.error) {
      toast.error(res.error);
      setBusy(false);
      setPreview(currentUrl ?? null);
      return;
    }
    setProgress(100);
    if (res.url && res.path) onUploaded(res.url, res.path, file);
    setBusy(false);
    setTimeout(() => setProgress(0), 400);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handle(f);
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handle(f);
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => ref.current?.click()}
        className="relative rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center cursor-pointer hover:bg-accent/40"
      >
        <input ref={ref} type="file" hidden onChange={onFileChange} accept={kind === "image" ? "image/*" : ".pdf,image/*,.doc,.docx,.xls,.xlsx"} />
        {preview && kind === "image" ? (
          <div className="relative mx-auto aspect-video max-w-sm">
            <Image src={preview} alt="preview" fill className="object-contain rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="size-6" />
            <p className="text-sm">Arraste um arquivo ou clique para selecionar</p>
            <p className="text-xs">Máx {kind === "image" ? "10MB" : "50MB"}</p>
          </div>
        )}
        {progress > 0 && (
          <div className="absolute inset-x-4 bottom-2">
            <Progress value={progress} />
          </div>
        )}
      </div>
      {preview && onRemoved && (
        <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPreview(null); onRemoved(); }} disabled={busy}>
          <X className="mr-1 size-4" /> Remover
        </Button>
      )}
    </div>
  );
}

export function FileUploaderMultiple({
  bucket, kind, pathPrefix, onUploaded,
}: { bucket: "arquivos"; kind: "document"; pathPrefix: string; onUploaded: (url: string, path: string, file: File) => void }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setBusy(true);
    for (const f of Array.from(files)) {
      const res = await uploadFileAction(bucket, kind, f, pathPrefix);
      if (res.error) toast.error(`${f.name}: ${res.error}`);
      else if (res.url && res.path) onUploaded(res.url, res.path, f);
    }
    setBusy(false);
  }

  return (
    <div>
      <Button type="button" onClick={() => ref.current?.click()} disabled={busy}>
        <Upload className="mr-1 size-4" /> {busy ? "Enviando..." : "Adicionar arquivo"}
      </Button>
      <input ref={ref} type="file" hidden multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/upload
git commit -m "feat(upload): add FileUploader components (single and multiple)"
```

### Task 5.3: Empreendimento server actions

**Files:**
- Create: `lib/actions/empreendimentos.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const baseSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.enum(["vertical", "horizontal"]),
  status: z.enum(["lancamento", "em_obras", "pronto"]).default("em_obras"),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().length(2, "UF deve ter 2 letras").optional().nullable(),
  cep: z.string().optional().nullable(),
  data_entrega_prevista: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
  foto_capa_url: z.string().optional().nullable(),
  planta_implantacao_url: z.string().optional().nullable(),
  qtd_andares: z.coerce.number().int().positive().optional().nullable(),
  qtd_unidades_por_andar: z.coerce.number().int().positive().optional().nullable(),
});

export async function criarEmpreendimentoAction(input: z.infer<typeof baseSchema>) {
  await requireAdminProfile();
  const data = baseSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  if (data.tipo === "vertical") {
    if (!data.qtd_andares || !data.qtd_unidades_por_andar) {
      return { error: "Vertical requer qtd_andares e qtd_unidades_por_andar" };
    }
  }

  const { data: created, error } = await supabase
    .from("empreendimentos")
    .insert(data)
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Falha ao criar" };

  // Generate placeholder unidades for vertical
  if (data.tipo === "vertical" && data.qtd_andares && data.qtd_unidades_por_andar) {
    const placeholders = [];
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (let andar = 1; andar <= data.qtd_andares; andar++) {
      for (let pos = 0; pos < data.qtd_unidades_por_andar; pos++) {
        const letra = letras[pos] ?? String(pos + 1);
        placeholders.push({
          empreendimento_id: created.id,
          identificador: `${andar}${letra}`,
          andar,
          posicao_no_andar: letra,
          status: "disponivel" as const,
        });
      }
    }
    await supabase.from("unidades").insert(placeholders);
  }

  revalidatePath("/");
  redirect(`/empreendimentos/${created.id}`);
}

export async function atualizarEmpreendimentoAction(id: string, input: z.infer<typeof baseSchema>) {
  await requireAdminProfile();
  const data = baseSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("empreendimentos").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/empreendimentos/${id}`);
  return { success: true };
}

export async function excluirEmpreendimentoAction(id: string) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("empreendimentos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  redirect("/");
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/empreendimentos.ts
git commit -m "feat(empreendimentos): add create/update/delete server actions"
```

### Task 5.4: Empreendimento form component

**Files:**
- Create: `components/empreendimento/EmpreendimentoForm.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Empreendimento } from "@/types/database";
import { criarEmpreendimentoAction, atualizarEmpreendimentoAction } from "@/lib/actions/empreendimentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploader } from "@/components/upload/FileUploader";
import { toast } from "sonner";

type Mode = "create" | "edit";

export function EmpreendimentoForm({ mode, initial }: { mode: Mode; initial?: Empreendimento }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome: initial?.nome ?? "",
    tipo: initial?.tipo ?? "vertical",
    status: initial?.status ?? "em_obras",
    endereco: initial?.endereco ?? "",
    cidade: initial?.cidade ?? "",
    estado: initial?.estado ?? "",
    cep: initial?.cep ?? "",
    data_entrega_prevista: initial?.data_entrega_prevista ?? "",
    descricao: initial?.descricao ?? "",
    foto_capa_url: initial?.foto_capa_url ?? "",
    planta_implantacao_url: initial?.planta_implantacao_url ?? "",
    qtd_andares: initial?.qtd_andares ?? null,
    qtd_unidades_por_andar: initial?.qtd_unidades_por_andar ?? null,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = mode === "create"
        ? await criarEmpreendimentoAction(form as never)
        : await atualizarEmpreendimentoAction(initial!.id, form as never);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(mode === "create" ? "Empreendimento criado" : "Empreendimento atualizado");
        if (mode === "edit") router.push(`/empreendimentos/${initial!.id}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Nome*</Label>
          <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Tipo*</Label>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v as "vertical" | "horizontal")} disabled={mode === "edit"}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">Vertical (prédio)</SelectItem>
              <SelectItem value="horizontal">Horizontal (casas/lotes)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lancamento">Lançamento</SelectItem>
              <SelectItem value="em_obras">Em obras</SelectItem>
              <SelectItem value="pronto">Pronto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Data de entrega prevista</Label>
          <Input type="date" value={form.data_entrega_prevista ?? ""} onChange={(e) => set("data_entrega_prevista", e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1 md:col-span-2">
          <Label>Endereço</Label>
          <Input value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Cidade</Label>
          <Input value={form.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>UF</Label>
            <Input maxLength={2} value={form.estado ?? ""} onChange={(e) => set("estado", e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1">
            <Label>CEP</Label>
            <Input value={form.cep ?? ""} onChange={(e) => set("cep", e.target.value)} />
          </div>
        </div>
      </div>

      {form.tipo === "vertical" && mode === "create" && (
        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-accent/30 p-4">
          <div className="space-y-1">
            <Label>Qtd. andares*</Label>
            <Input type="number" min={1} value={form.qtd_andares ?? ""} onChange={(e) => set("qtd_andares", Number(e.target.value) || null)} required />
          </div>
          <div className="space-y-1">
            <Label>Unidades por andar*</Label>
            <Input type="number" min={1} value={form.qtd_unidades_por_andar ?? ""} onChange={(e) => set("qtd_unidades_por_andar", Number(e.target.value) || null)} required />
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">
            Ao salvar, geramos as unidades automaticamente (ex: 1A, 1B, ...). Você preenche os dados depois.
          </p>
        </div>
      )}

      <div className="space-y-1">
        <Label>Descrição</Label>
        <Textarea rows={3} value={form.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} />
      </div>

      <FileUploader
        bucket="empreendimentos"
        kind="image"
        pathPrefix={`capa/${initial?.id ?? "novo"}`}
        currentUrl={form.foto_capa_url}
        onUploaded={(url) => set("foto_capa_url", url)}
        onRemoved={() => set("foto_capa_url", "")}
        label="Foto de capa"
      />

      {form.tipo === "horizontal" && (
        <FileUploader
          bucket="empreendimentos"
          kind="image"
          pathPrefix={`planta/${initial?.id ?? "novo"}`}
          currentUrl={form.planta_implantacao_url}
          onUploaded={(url) => set("planta_implantacao_url", url)}
          onRemoved={() => set("planta_implantacao_url", "")}
          label="Planta de implantação (opcional)"
        />
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : mode === "create" ? "Criar empreendimento" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/empreendimento/EmpreendimentoForm.tsx
git commit -m "feat(empreendimento): add reusable create/edit form"
```

### Task 5.5: Pages — novo, editar, detalhe (skeleton), arquivos

**Files:**
- Create: `app/(app)/empreendimentos/novo/page.tsx`, `app/(app)/empreendimentos/[id]/editar/page.tsx`, `app/(app)/empreendimentos/[id]/page.tsx`, `app/(app)/empreendimentos/[id]/HeaderEmpreendimento.tsx`, `lib/data/arquivos.ts`, `lib/actions/arquivos.ts`, `components/empreendimento/ArquivosTab.tsx`

- [ ] **Step 1: `app/(app)/empreendimentos/novo/page.tsx`**

```tsx
import { requireAdminProfile } from "@/lib/auth";
import { EmpreendimentoForm } from "@/components/empreendimento/EmpreendimentoForm";

export default async function NovoEmpreendimentoPage() {
  await requireAdminProfile();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Novo empreendimento</h1>
      <EmpreendimentoForm mode="create" />
    </div>
  );
}
```

- [ ] **Step 2: `app/(app)/empreendimentos/[id]/editar/page.tsx`**

```tsx
import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmpreendimentoForm } from "@/components/empreendimento/EmpreendimentoForm";
import { notFound } from "next/navigation";
import type { Empreendimento } from "@/types/database";

export default async function EditarEmpreendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("empreendimentos").select("*").eq("id", id).single();
  if (!data) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Editar empreendimento</h1>
      <EmpreendimentoForm mode="edit" initial={data as Empreendimento} />
    </div>
  );
}
```

- [ ] **Step 3: `lib/actions/arquivos.ts`**

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const schema = z.object({
  empreendimento_id: z.string().uuid(),
  nome: z.string().min(1),
  url: z.string().url(),
  tamanho_bytes: z.number().int().positive(),
  tipo_mime: z.string(),
});

export async function registrarArquivoAction(input: z.infer<typeof schema>) {
  const profile = await requireAdminProfile();
  const data = schema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("arquivos_empreendimento").insert({
    ...data,
    enviado_por: profile.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true };
}

export async function excluirArquivoAction(id: string, empreendimento_id: string) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("arquivos_empreendimento").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/empreendimentos/${empreendimento_id}`);
  return { success: true };
}
```

- [ ] **Step 4: `lib/data/arquivos.ts`**

```ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArquivoEmpreendimento } from "@/types/database";

export async function listarArquivos(empreendimentoId: string): Promise<ArquivoEmpreendimento[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("arquivos_empreendimento")
    .select("*")
    .eq("empreendimento_id", empreendimentoId)
    .order("criado_em", { ascending: false });
  return (data ?? []) as ArquivoEmpreendimento[];
}
```

- [ ] **Step 5: `components/empreendimento/ArquivosTab.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import type { ArquivoEmpreendimento } from "@/types/database";
import { FileUploaderMultiple } from "@/components/upload/FileUploader";
import { registrarArquivoAction, excluirArquivoAction } from "@/lib/actions/arquivos";
import { Button } from "@/components/ui/button";
import { Trash2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ArquivosTab({ empreendimentoId, arquivos, isAdmin }: { empreendimentoId: string; arquivos: ArquivoEmpreendimento[]; isAdmin: boolean }) {
  const [list, setList] = useState(arquivos);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function onUploaded(url: string, _path: string, file: File) {
    const res = await registrarArquivoAction({
      empreendimento_id: empreendimentoId,
      nome: file.name,
      url,
      tamanho_bytes: file.size,
      tipo_mime: file.type,
    });
    if (res?.error) toast.error(res.error);
    else { toast.success("Arquivo adicionado"); router.refresh(); }
  }

  function onDelete(id: string) {
    if (!confirm("Excluir arquivo?")) return;
    startTransition(async () => {
      const res = await excluirArquivoAction(id, empreendimentoId);
      if (res?.error) toast.error(res.error);
      else {
        setList((l) => l.filter((a) => a.id !== id));
        toast.success("Arquivo excluído");
      }
    });
  }

  return (
    <div className="space-y-4">
      {isAdmin && <FileUploaderMultiple bucket="arquivos" kind="document" pathPrefix={empreendimentoId} onUploaded={onUploaded} />}
      {list.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 text-sm">Nenhum arquivo ainda.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-background">
          {list.map((a) => (
            <li key={a.id} className="flex items-center gap-3 p-3">
              <FileText className="size-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{a.nome}</p>
                <p className="text-xs text-muted-foreground">{(a.tamanho_bytes / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={a.url} download target="_blank" rel="noopener"><Download className="size-4" /></a>
              </Button>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(a.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 6: `app/(app)/empreendimentos/[id]/HeaderEmpreendimento.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Empreendimento } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus } from "lucide-react";
import { formatMonthYear } from "@/lib/formatacao";

const statusLabel: Record<string, string> = {
  lancamento: "Lançamento", em_obras: "Em obras", pronto: "Pronto",
};

export function HeaderEmpreendimento({ emp, isAdmin, contadores }: {
  emp: Empreendimento;
  isAdmin: boolean;
  contadores: { disponiveis: number; reservadas: number; vendidas: number };
}) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/5] rounded-xl overflow-hidden bg-muted">
        {emp.foto_capa_url
          ? <Image src={emp.foto_capa_url} alt={emp.nome} fill className="object-cover" priority />
          : <div className="grid h-full w-full place-items-center text-muted-foreground">Sem foto de capa</div>}
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{emp.nome}</h1>
            <Badge variant="secondary">{statusLabel[emp.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {[emp.endereco, emp.cidade, emp.estado].filter(Boolean).join(", ")}
          </p>
          <p className="text-sm text-muted-foreground">Entrega: {formatMonthYear(emp.data_entrega_prevista)}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/empreendimentos/${emp.id}/editar`}><Pencil className="mr-1 size-4" /> Editar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/empreendimentos/${emp.id}/unidades/novo`}><Plus className="mr-1 size-4" /> Nova unidade</Link>
            </Button>
          </div>
        )}
      </div>
      <div className="flex gap-4 text-sm">
        <span>🟢 <strong>{contadores.disponiveis}</strong> disponíveis</span>
        <span>🟡 <strong>{contadores.reservadas}</strong> reservadas</span>
        <span>🔴 <strong>{contadores.vendidas}</strong> vendidas</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: `app/(app)/empreendimentos/[id]/page.tsx` (skeleton with tabs)**

```tsx
import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderEmpreendimento } from "./HeaderEmpreendimento";
import { ArquivosTab } from "@/components/empreendimento/ArquivosTab";
import { listarArquivos } from "@/lib/data/arquivos";
import type { Empreendimento, Unidade } from "@/types/database";

export default async function EmpreendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase.from("empreendimentos").select("*").eq("id", id).single();
  if (!emp) notFound();
  const { data: unidades } = await supabase.from("unidades").select("*").eq("empreendimento_id", id);
  const arquivos = await listarArquivos(id);
  const list = (unidades ?? []) as Unidade[];
  const contadores = {
    disponiveis: list.filter((u) => u.status === "disponivel").length,
    reservadas: list.filter((u) => u.status === "reservada").length,
    vendidas: list.filter((u) => u.status === "vendida").length,
  };
  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <HeaderEmpreendimento emp={emp as Empreendimento} isAdmin={isAdmin} contadores={contadores} />
      <Tabs defaultValue="mapa">
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa"><p className="text-muted-foreground p-4">Mapa em construção.</p></TabsContent>
        <TabsContent value="lista"><p className="text-muted-foreground p-4">Lista em construção.</p></TabsContent>
        <TabsContent value="arquivos">
          <ArquivosTab empreendimentoId={id} arquivos={arquivos} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 8: Build**

`npm run build`
Expected: success.

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/empreendimentos lib/actions/arquivos.ts lib/data/arquivos.ts components/empreendimento/ArquivosTab.tsx
git commit -m "feat(empreendimentos): add detail page with tabs and arquivos CRUD"
```

---

## Phase 6 — Unidades CRUD + Lista + Painel lateral

### Task 6.1: Unidade server actions

**Files:**
- Create: `lib/actions/unidades.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/auth";

const unidadeSchema = z.object({
  empreendimento_id: z.string().uuid(),
  identificador: z.string().min(1),
  andar: z.coerce.number().int().optional().nullable(),
  posicao_no_andar: z.string().optional().nullable(),
  area_privativa_m2: z.coerce.number().positive().optional().nullable(),
  area_total_m2: z.coerce.number().positive().optional().nullable(),
  qtd_quartos: z.coerce.number().int().min(0).optional().nullable(),
  qtd_suites: z.coerce.number().int().min(0).optional().nullable(),
  qtd_banheiros: z.coerce.number().int().min(0).optional().nullable(),
  qtd_vagas: z.coerce.number().int().min(0).optional().nullable(),
  preco_total: z.coerce.number().positive().optional().nullable(),
  valor_condominio: z.coerce.number().positive().optional().nullable(),
  foto_url: z.string().optional().nullable(),
});

export async function criarUnidadeAction(input: z.infer<typeof unidadeSchema>) {
  await requireAdminProfile();
  const data = unidadeSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase.from("unidades").insert(data).select("id").single();
  if (error || !created) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true, id: created.id };
}

export async function atualizarUnidadeAction(id: string, input: Partial<z.infer<typeof unidadeSchema>>) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const partial = unidadeSchema.partial().parse(input);
  const { data, error } = await supabase.from("unidades").update(partial).eq("id", id).select("empreendimento_id").single();
  if (error || !data) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true };
}

export async function excluirUnidadeAction(id: string) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("unidades").delete().eq("id", id).select("empreendimento_id").single();
  if (error || !data) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  redirect(`/empreendimentos/${data.empreendimento_id}`);
}

export async function salvarCoordenadasAction(unidadeId: string, coords: { x: number; y: number; width: number; height: number }) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("unidades").update({ coordenadas_poligono: coords }).eq("id", unidadeId).select("empreendimento_id").single();
  if (error || !data) return { error: error?.message ?? "Falha" };
  revalidatePath(`/empreendimentos/${data.empreendimento_id}`);
  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/unidades.ts
git commit -m "feat(unidades): add server actions for CRUD and coordinates"
```

### Task 6.2: Unidade form

**Files:**
- Create: `components/unidade/UnidadeForm.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Unidade } from "@/types/database";
import { criarUnidadeAction, atualizarUnidadeAction } from "@/lib/actions/unidades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploader } from "@/components/upload/FileUploader";
import { toast } from "sonner";

export function UnidadeForm({ mode, empreendimentoId, initial }: {
  mode: "create" | "edit";
  empreendimentoId: string;
  initial?: Unidade;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    empreendimento_id: empreendimentoId,
    identificador: initial?.identificador ?? "",
    andar: initial?.andar ?? null,
    posicao_no_andar: initial?.posicao_no_andar ?? "",
    area_privativa_m2: initial?.area_privativa_m2 ?? null,
    area_total_m2: initial?.area_total_m2 ?? null,
    qtd_quartos: initial?.qtd_quartos ?? null,
    qtd_suites: initial?.qtd_suites ?? null,
    qtd_banheiros: initial?.qtd_banheiros ?? null,
    qtd_vagas: initial?.qtd_vagas ?? null,
    preco_total: initial?.preco_total ?? null,
    valor_condominio: initial?.valor_condominio ?? null,
    foto_url: initial?.foto_url ?? "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function num(value: string) { return value === "" ? null : Number(value); }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = mode === "create"
        ? await criarUnidadeAction(form as never)
        : await atualizarUnidadeAction(initial!.id, form as never);
      if (result?.error) toast.error(result.error);
      else {
        toast.success(mode === "create" ? "Unidade criada" : "Unidade atualizada");
        router.push(`/empreendimentos/${empreendimentoId}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Identificador*</Label>
          <Input value={form.identificador} onChange={(e) => set("identificador", e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Andar</Label>
          <Input type="number" value={form.andar ?? ""} onChange={(e) => set("andar", num(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Posição</Label>
          <Input value={form.posicao_no_andar ?? ""} onChange={(e) => set("posicao_no_andar", e.target.value)} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Área privativa (m²)</Label>
          <Input type="number" step="0.01" value={form.area_privativa_m2 ?? ""} onChange={(e) => set("area_privativa_m2", num(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Área total (m²)</Label>
          <Input type="number" step="0.01" value={form.area_total_m2 ?? ""} onChange={(e) => set("area_total_m2", num(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label>Quartos</Label>
          <Input type="number" value={form.qtd_quartos ?? ""} onChange={(e) => set("qtd_quartos", num(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Suítes</Label>
          <Input type="number" value={form.qtd_suites ?? ""} onChange={(e) => set("qtd_suites", num(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Banheiros</Label>
          <Input type="number" value={form.qtd_banheiros ?? ""} onChange={(e) => set("qtd_banheiros", num(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Vagas</Label>
          <Input type="number" value={form.qtd_vagas ?? ""} onChange={(e) => set("qtd_vagas", num(e.target.value))} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Preço total (R$)</Label>
          <Input type="number" step="0.01" value={form.preco_total ?? ""} onChange={(e) => set("preco_total", num(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Condomínio (R$)</Label>
          <Input type="number" step="0.01" value={form.valor_condominio ?? ""} onChange={(e) => set("valor_condominio", num(e.target.value))} />
        </div>
      </div>

      <FileUploader
        bucket="unidades"
        kind="image"
        pathPrefix={`unidade/${initial?.id ?? "novo"}`}
        currentUrl={form.foto_url}
        onUploaded={(url) => set("foto_url", url)}
        onRemoved={() => set("foto_url", "")}
        label="Foto/planta da unidade"
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/unidade
git commit -m "feat(unidade): add reusable create/edit form"
```

### Task 6.3: Unidade pages (novo / editar)

**Files:**
- Create: `app/(app)/empreendimentos/[id]/unidades/novo/page.tsx`, `app/(app)/empreendimentos/[id]/unidades/[unidadeId]/editar/page.tsx`

- [ ] **Step 1: Novo**

```tsx
import { requireAdminProfile } from "@/lib/auth";
import { UnidadeForm } from "@/components/unidade/UnidadeForm";

export default async function NovaUnidadePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminProfile();
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nova unidade</h1>
      <UnidadeForm mode="create" empreendimentoId={id} />
    </div>
  );
}
```

- [ ] **Step 2: Editar**

```tsx
import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UnidadeForm } from "@/components/unidade/UnidadeForm";
import { notFound } from "next/navigation";
import type { Unidade } from "@/types/database";

export default async function EditarUnidadePage({ params }: { params: Promise<{ id: string; unidadeId: string }> }) {
  await requireAdminProfile();
  const { id, unidadeId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("unidades").select("*").eq("id", unidadeId).single();
  if (!data) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Editar unidade</h1>
      <UnidadeForm mode="edit" empreendimentoId={id} initial={data as Unidade} />
    </div>
  );
}
```

- [ ] **Step 3: Build + Commit**

```bash
npm run build
git add app/\(app\)/empreendimentos
git commit -m "feat(unidade): add new/edit pages"
```

### Task 6.4: Status badge + colors helper

**Files:**
- Create: `components/unidade/StatusBadge.tsx`, `lib/cores-status.ts`

- [ ] **Step 1: `lib/cores-status.ts`**

```ts
import type { UnidadeStatus } from "@/types/database";

export const STATUS_COLORS: Record<UnidadeStatus | "sem_dados", { bg: string; border: string; label: string }> = {
  disponivel: { bg: "#16a34a", border: "#166534", label: "Disponível" },
  reservada: { bg: "#eab308", border: "#a16207", label: "Reservada" },
  vendida: { bg: "#dc2626", border: "#991b1b", label: "Vendida" },
  sem_dados: { bg: "#e5e7eb", border: "#9ca3af", label: "Sem dados" },
};
```

- [ ] **Step 2: `components/unidade/StatusBadge.tsx`**

```tsx
import type { UnidadeStatus } from "@/types/database";
import { STATUS_COLORS } from "@/lib/cores-status";

export function StatusBadge({ status }: { status: UnidadeStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: c.bg }}>
      {c.label}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/unidade lib/cores-status.ts
git commit -m "feat(unidade): add status colors and badge"
```

### Task 6.5: ListaUnidades component

**Files:**
- Create: `components/unidade/ListaUnidades.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState } from "react";
import type { Unidade } from "@/types/database";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import { formatBRL, formatM2 } from "@/lib/formatacao";

export function ListaUnidades({ unidades, onSelect }: { unidades: Unidade[]; onSelect: (u: Unidade) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [quartos, setQuartos] = useState<string>("todos");

  const filtered = unidades.filter((u) => {
    if (q && !u.identificador.toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "todos" && u.status !== status) return false;
    if (quartos !== "todos" && String(u.qtd_quartos) !== quartos) return false;
    return true;
  });

  const quartosDistintos = Array.from(new Set(unidades.map((u) => u.qtd_quartos).filter((n) => n != null))) as number[];

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2">
        <Input placeholder="Buscar unidade..." value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="reservada">Reservada</SelectItem>
            <SelectItem value="vendida">Vendida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={quartos} onValueChange={setQuartos}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Quartos: todos</SelectItem>
            {quartosDistintos.sort((a, b) => a - b).map((q) => <SelectItem key={q} value={String(q)}>{q} quartos</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Área priv.</TableHead>
              <TableHead>Quartos</TableHead>
              <TableHead>Vagas</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} onClick={() => onSelect(u)} className="cursor-pointer">
                <TableCell className="font-medium">{u.identificador}</TableCell>
                <TableCell>{formatM2(u.area_privativa_m2)}</TableCell>
                <TableCell>{u.qtd_quartos ?? "—"}</TableCell>
                <TableCell>{u.qtd_vagas ?? "—"}</TableCell>
                <TableCell>{formatBRL(u.preco_total)}</TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhuma unidade.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/unidade/ListaUnidades.tsx
git commit -m "feat(unidade): add filtered list table"
```

### Task 6.6: PainelUnidade (drawer) — sem reservar ainda

**Files:**
- Create: `components/unidade/PainelUnidade.tsx`

- [ ] **Step 1: Implement (the reserve/cancel/sell actions are placeholders until Phase 8 wires them)**

```tsx
"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import type { Unidade, Profile } from "@/types/database";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { formatBRL, formatM2 } from "@/lib/formatacao";
import { Copy, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { excluirUnidadeAction } from "@/lib/actions/unidades";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function PainelUnidade({
  unidade, empreendimentoNome, profile, open, onOpenChange, onReservar, onCancelarReserva, onMarcarVendida, mensagemWhatsapp, linkWhatsapp,
}: {
  unidade: Unidade | null;
  empreendimentoNome: string;
  profile: Profile;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onReservar?: () => void;
  onCancelarReserva?: () => void;
  onMarcarVendida?: () => void;
  mensagemWhatsapp: string;
  linkWhatsapp: string;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  if (!unidade) return null;
  const isAdmin = profile.role === "admin";

  function copiarMensagem() {
    navigator.clipboard.writeText(mensagemWhatsapp);
    toast.success("Mensagem copiada!");
  }
  function abrirWhatsapp() { window.open(linkWhatsapp, "_blank"); }
  function excluir() {
    if (!confirm("Excluir unidade?")) return;
    startTransition(async () => {
      const res = await excluirUnidadeAction(unidade!.id);
      if (res?.error) toast.error(res.error);
      else { toast.success("Unidade excluída"); router.refresh(); }
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{empreendimentoNome} — {unidade.identificador}</DrawerTitle>
          <StatusBadge status={unidade.status} />
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          {unidade.foto_url && (
            <div className="relative aspect-video rounded overflow-hidden bg-muted">
              <Image src={unidade.foto_url} alt={unidade.identificador} fill className="object-cover" />
            </div>
          )}
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Área privativa</dt><dd>{formatM2(unidade.area_privativa_m2)}</dd>
            <dt className="text-muted-foreground">Área total</dt><dd>{formatM2(unidade.area_total_m2)}</dd>
            <dt className="text-muted-foreground">Quartos</dt><dd>{unidade.qtd_quartos ?? "—"}{unidade.qtd_suites ? ` (${unidade.qtd_suites} suítes)` : ""}</dd>
            <dt className="text-muted-foreground">Banheiros</dt><dd>{unidade.qtd_banheiros ?? "—"}</dd>
            <dt className="text-muted-foreground">Vagas</dt><dd>{unidade.qtd_vagas ?? "—"}</dd>
            <dt className="text-muted-foreground">Preço total</dt><dd className="font-semibold">{formatBRL(unidade.preco_total)}</dd>
            {isAdmin && (<><dt className="text-muted-foreground">Condomínio</dt><dd>{formatBRL(unidade.valor_condominio)}</dd></>)}
          </dl>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={copiarMensagem}><Copy className="mr-1 size-4" /> Copiar</Button>
            <Button variant="outline" onClick={abrirWhatsapp}><MessageCircle className="mr-1 size-4" /> WhatsApp</Button>
          </div>

          {unidade.status === "disponivel" && onReservar && (
            <Button className="w-full" onClick={onReservar}>Reservar</Button>
          )}
          {unidade.status === "reservada" && onCancelarReserva && (
            <Button variant="outline" className="w-full" onClick={onCancelarReserva}>Cancelar reserva</Button>
          )}
          {unidade.status === "reservada" && isAdmin && onMarcarVendida && (
            <Button className="w-full" onClick={onMarcarVendida}>Marcar como vendida</Button>
          )}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/empreendimentos/${unidade.empreendimento_id}/unidades/${unidade.id}/editar`}><Pencil className="mr-1 size-4" /> Editar</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={excluir}><Trash2 className="mr-1 size-4 text-destructive" /> Excluir</Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/unidade/PainelUnidade.tsx
git commit -m "feat(unidade): add lateral drawer with details and actions"
```

### Task 6.7: Wire lista + painel into empreendimento detail

**Files:**
- Create: `components/empreendimento/EmpreendimentoTabs.tsx`
- Modify: `app/(app)/empreendimentos/[id]/page.tsx`

- [ ] **Step 1: Create `EmpreendimentoTabs.tsx` (client wrapper)**

```tsx
"use client";
import { useState } from "react";
import type { Empreendimento, Unidade, Profile, ArquivoEmpreendimento } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaUnidades } from "@/components/unidade/ListaUnidades";
import { PainelUnidade } from "@/components/unidade/PainelUnidade";
import { ArquivosTab } from "@/components/empreendimento/ArquivosTab";
import { gerarMensagemUnidade, gerarLinkWhatsapp } from "@/lib/mensagem-whatsapp";
import { branding } from "@/config/branding";

export function EmpreendimentoTabs({
  emp, unidades, arquivos, profile,
}: {
  emp: Empreendimento;
  unidades: Unidade[];
  arquivos: ArquivoEmpreendimento[];
  profile: Profile;
}) {
  const [sel, setSel] = useState<Unidade | null>(null);
  const mensagem = sel ? gerarMensagemUnidade(sel, emp, branding) : "";
  const link = gerarLinkWhatsapp(mensagem);
  const isAdmin = profile.role === "admin";

  return (
    <>
      <Tabs defaultValue="mapa">
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa">
          <p className="text-muted-foreground p-4">Mapa em construção (Phase 7).</p>
        </TabsContent>
        <TabsContent value="lista">
          <ListaUnidades unidades={unidades} onSelect={setSel} />
        </TabsContent>
        <TabsContent value="arquivos">
          <ArquivosTab empreendimentoId={emp.id} arquivos={arquivos} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
      <PainelUnidade
        unidade={sel}
        empreendimentoNome={emp.nome}
        profile={profile}
        open={!!sel}
        onOpenChange={(b) => !b && setSel(null)}
        mensagemWhatsapp={mensagem}
        linkWhatsapp={link}
      />
    </>
  );
}
```

- [ ] **Step 2: Update page to use the wrapper**

Replace contents of `app/(app)/empreendimentos/[id]/page.tsx`:

```tsx
import { requireAuthenticatedProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { HeaderEmpreendimento } from "./HeaderEmpreendimento";
import { EmpreendimentoTabs } from "@/components/empreendimento/EmpreendimentoTabs";
import { listarArquivos } from "@/lib/data/arquivos";
import type { Empreendimento, Unidade } from "@/types/database";

export default async function EmpreendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase.from("empreendimentos").select("*").eq("id", id).single();
  if (!emp) notFound();
  const { data: unidades } = await supabase.from("unidades").select("*").eq("empreendimento_id", id).order("identificador");
  const arquivos = await listarArquivos(id);
  const list = (unidades ?? []) as Unidade[];
  const contadores = {
    disponiveis: list.filter((u) => u.status === "disponivel").length,
    reservadas: list.filter((u) => u.status === "reservada").length,
    vendidas: list.filter((u) => u.status === "vendida").length,
  };
  return (
    <div className="space-y-6">
      <HeaderEmpreendimento emp={emp as Empreendimento} isAdmin={profile.role === "admin"} contadores={contadores} />
      <EmpreendimentoTabs emp={emp as Empreendimento} unidades={list} arquivos={arquivos} profile={profile} />
    </div>
  );
}
```

> Note: this imports `lib/mensagem-whatsapp.ts` which is created in Task 8.1. Hold this build until Phase 8.1 lands, or stub the helper now with the snippet below.

- [ ] **Step 3: Stub mensagem-whatsapp temporarily**

Create `lib/mensagem-whatsapp.ts`:
```ts
import type { Empreendimento, Unidade } from "@/types/database";
import type { Branding } from "@/config/branding";

export function gerarMensagemUnidade(u: Unidade, e: Empreendimento, b: Branding): string {
  return `${e.nome} — ${u.identificador}`;
}
export function gerarLinkWhatsapp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
```
(Real implementation lands in Task 8.1.)

- [ ] **Step 4: Build + commit**

```bash
npm run build
git add app/\(app\)/empreendimentos components/empreendimento/EmpreendimentoTabs.tsx lib/mensagem-whatsapp.ts
git commit -m "feat(empreendimento): wire lista + painel lateral into detail page"
```

---

## Phase 7 — Mapa visual (vertical + horizontal + editor)

### Task 7.1: MapaVertical component

**Files:**
- Create: `components/mapa/MapaVertical.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import type { Unidade } from "@/types/database";
import { STATUS_COLORS } from "@/lib/cores-status";

type Props = {
  unidades: Unidade[];
  qtdAndares: number;
  qtdUnidadesPorAndar: number;
  filtro: { status?: string[]; precoMin?: number; precoMax?: number; quartos?: number };
  onSelect: (u: Unidade) => void;
};

function isPlaceholder(u: Unidade): boolean {
  return u.area_privativa_m2 == null && u.preco_total == null && u.qtd_quartos == null;
}

function matchesFilter(u: Unidade, f: Props["filtro"]): boolean {
  if (f.status && f.status.length > 0 && !f.status.includes(u.status)) return false;
  if (f.precoMin != null && (u.preco_total ?? 0) < f.precoMin) return false;
  if (f.precoMax != null && (u.preco_total ?? 0) > f.precoMax) return false;
  if (f.quartos != null && u.qtd_quartos !== f.quartos) return false;
  return true;
}

export function MapaVertical({ unidades, qtdAndares, qtdUnidadesPorAndar, filtro, onSelect }: Props) {
  // Index unidades by andar
  const grid: Record<number, Unidade[]> = {};
  unidades.forEach((u) => {
    if (u.andar == null) return;
    grid[u.andar] = grid[u.andar] ?? [];
    grid[u.andar].push(u);
  });

  const andares = Array.from({ length: qtdAndares }, (_, i) => qtdAndares - i); // top → bottom

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full space-y-1 p-2">
        {andares.map((andar) => (
          <div key={andar} className="flex items-center gap-2">
            <div className="w-10 shrink-0 text-right text-xs text-muted-foreground">{andar}º</div>
            <div className="flex gap-1">
              {Array.from({ length: qtdUnidadesPorAndar }, (_, i) => {
                const u = (grid[andar] ?? []).find((x) => x.posicao_no_andar === ["A","B","C","D","E","F","G","H","I","J"][i] || x.posicao_no_andar === String(i + 1));
                if (!u) return <div key={i} className="w-16 h-12 rounded bg-muted/40" />;
                const placeholder = isPlaceholder(u);
                const color = STATUS_COLORS[placeholder ? "sem_dados" : u.status];
                const dim = !matchesFilter(u, filtro);
                return (
                  <button
                    key={u.id}
                    onClick={() => onSelect(u)}
                    title={`${u.identificador}`}
                    className="w-16 h-12 rounded text-xs font-medium transition border"
                    style={{
                      background: color.bg,
                      color: placeholder ? "#374151" : "#ffffff",
                      borderColor: color.border,
                      opacity: dim ? 0.2 : 1,
                    }}
                  >
                    {u.identificador}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/mapa/MapaVertical.tsx
git commit -m "feat(mapa): add vertical grid visualization"
```

### Task 7.2: MapaHorizontal component

**Files:**
- Create: `components/mapa/MapaHorizontal.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useRef, useState, useEffect } from "react";
import type { Unidade } from "@/types/database";
import { STATUS_COLORS } from "@/lib/cores-status";
import Image from "next/image";

type Filtro = { status?: string[]; precoMin?: number; precoMax?: number; quartos?: number };

function matches(u: Unidade, f: Filtro): boolean {
  if (f.status && f.status.length > 0 && !f.status.includes(u.status)) return false;
  if (f.precoMin != null && (u.preco_total ?? 0) < f.precoMin) return false;
  if (f.precoMax != null && (u.preco_total ?? 0) > f.precoMax) return false;
  if (f.quartos != null && u.qtd_quartos !== f.quartos) return false;
  return true;
}

export function MapaHorizontal({
  plantaUrl, unidades, filtro, onSelect,
}: {
  plantaUrl: string;
  unidades: Unidade[];
  filtro: Filtro;
  onSelect: (u: Unidade) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  useEffect(() => {
    function update() {
      if (ref.current) setDim({ w: ref.current.clientWidth, h: ref.current.clientHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const semPosicao = unidades.filter((u) => !u.coordenadas_poligono);
  const comPosicao = unidades.filter((u) => u.coordenadas_poligono);

  return (
    <div className="space-y-3">
      <div ref={ref} className="relative w-full rounded-lg border bg-muted overflow-hidden">
        <Image src={plantaUrl} alt="Planta" width={1600} height={1000} className="w-full h-auto" />
        {comPosicao.map((u) => {
          const c = u.coordenadas_poligono!;
          const color = STATUS_COLORS[u.status];
          const dimmed = !matches(u, filtro);
          return (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="absolute rounded-sm border-2 text-xs font-bold text-white grid place-items-center hover:opacity-90 transition"
              style={{
                left: `${c.x * 100}%`,
                top: `${c.y * 100}%`,
                width: `${c.width * 100}%`,
                height: `${c.height * 100}%`,
                background: color.bg,
                borderColor: color.border,
                opacity: dimmed ? 0.2 : 0.7,
              }}
            >
              {u.identificador}
            </button>
          );
        })}
      </div>
      {semPosicao.length > 0 && (
        <div className="rounded border bg-accent/30 p-3">
          <p className="text-xs font-medium mb-2">Sem posição na planta ({semPosicao.length}):</p>
          <div className="flex flex-wrap gap-1">
            {semPosicao.map((u) => (
              <button key={u.id} onClick={() => onSelect(u)} className="text-xs rounded border px-2 py-1 bg-background hover:bg-accent">
                {u.identificador}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/mapa/MapaHorizontal.tsx
git commit -m "feat(mapa): add horizontal blueprint visualization"
```

### Task 7.3: MapaFiltros component

**Files:**
- Create: `components/mapa/MapaFiltros.tsx`, `components/mapa/Legenda.tsx`

- [ ] **Step 1: `Legenda.tsx`**

```tsx
import { STATUS_COLORS } from "@/lib/cores-status";

export function LegendaMapa() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {(["disponivel", "reservada", "vendida", "sem_dados"] as const).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded" style={{ background: STATUS_COLORS[s].bg }} />
          {STATUS_COLORS[s].label}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `MapaFiltros.tsx`**

```tsx
"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FiltroMapa = { status: string[]; precoMin?: number; precoMax?: number; quartos?: number };

export function MapaFiltros({ value, onChange, quartosDistintos }: {
  value: FiltroMapa;
  onChange: (v: FiltroMapa) => void;
  quartosDistintos: number[];
}) {
  function toggleStatus(s: string) {
    const set = new Set(value.status);
    if (set.has(s)) set.delete(s); else set.add(s);
    onChange({ ...value, status: Array.from(set) });
  }

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <p className="text-xs">Status</p>
        <div className="flex gap-2">
          {[["disponivel","Disp."],["reservada","Res."],["vendida","Vend."]].map(([s, label]) => (
            <label key={s} className="flex items-center gap-1 text-xs">
              <Checkbox checked={value.status.includes(s)} onCheckedChange={() => toggleStatus(s)} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs">Preço min.</p>
        <Input type="number" className="w-32" onChange={(e) => onChange({ ...value, precoMin: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
      <div className="space-y-1">
        <p className="text-xs">Preço max.</p>
        <Input type="number" className="w-32" onChange={(e) => onChange({ ...value, precoMax: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
      <div className="space-y-1">
        <p className="text-xs">Quartos</p>
        <Select value={value.quartos != null ? String(value.quartos) : "todos"} onValueChange={(v) => onChange({ ...value, quartos: v === "todos" ? undefined : Number(v) })}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {quartosDistintos.sort((a,b) => a - b).map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/mapa
git commit -m "feat(mapa): add filters and legend components"
```

### Task 7.4: EditorAreas component (rectangle drawing)

**Files:**
- Create: `components/mapa/EditorAreas.tsx`, `app/(app)/empreendimentos/[id]/unidades/[unidadeId]/editar-area/page.tsx`

- [ ] **Step 1: Implement editor**

```tsx
"use client";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { salvarCoordenadasAction } from "@/lib/actions/unidades";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Coordenadas } from "@/types/database";

export function EditorAreas({
  plantaUrl, unidadeId, identificador, empreendimentoId, coordsAtuais,
}: {
  plantaUrl: string;
  unidadeId: string;
  identificador: string;
  empreendimentoId: string;
  coordsAtuais: Coordenadas | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Coordenadas | null>(coordsAtuais);
  const [drawing, setDrawing] = useState<{ startX: number; startY: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function rel(e: React.MouseEvent) {
    const rect = ref.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  function onDown(e: React.MouseEvent) {
    const p = rel(e);
    setDrawing({ startX: p.x, startY: p.y });
    setCoords({ x: p.x, y: p.y, width: 0, height: 0 });
  }
  function onMove(e: React.MouseEvent) {
    if (!drawing) return;
    const p = rel(e);
    setCoords({
      x: Math.min(drawing.startX, p.x),
      y: Math.min(drawing.startY, p.y),
      width: Math.abs(p.x - drawing.startX),
      height: Math.abs(p.y - drawing.startY),
    });
  }
  function onUp() { setDrawing(null); }

  function salvar() {
    if (!coords || coords.width < 0.01 || coords.height < 0.01) {
      toast.error("Desenhe uma área primeiro");
      return;
    }
    startTransition(async () => {
      const res = await salvarCoordenadasAction(unidadeId, coords);
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Área salva");
        router.push(`/empreendimentos/${empreendimentoId}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">Clique e arraste sobre a planta para marcar a área da unidade <strong>{identificador}</strong>.</p>
      <div
        ref={ref}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        className="relative w-full rounded-lg border bg-muted overflow-hidden select-none cursor-crosshair"
      >
        <Image src={plantaUrl} alt="Planta" width={1600} height={1000} className="w-full h-auto pointer-events-none" draggable={false} />
        {coords && (
          <div
            className="absolute border-2 border-brand bg-brand/30"
            style={{
              left: `${coords.x * 100}%`,
              top: `${coords.y * 100}%`,
              width: `${coords.width * 100}%`,
              height: `${coords.height * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={salvar} disabled={pending}>{pending ? "Salvando..." : "Salvar área"}</Button>
        <Button variant="ghost" onClick={() => setCoords(null)}>Limpar</Button>
        <Button variant="ghost" onClick={() => router.back()}>Voltar</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Page wrapper**

```tsx
// app/(app)/empreendimentos/[id]/unidades/[unidadeId]/editar-area/page.tsx
import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EditorAreas } from "@/components/mapa/EditorAreas";
import type { Empreendimento, Unidade } from "@/types/database";

export default async function EditarAreaPage({ params }: { params: Promise<{ id: string; unidadeId: string }> }) {
  await requireAdminProfile();
  const { id, unidadeId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase.from("empreendimentos").select("*").eq("id", id).single();
  const { data: u } = await supabase.from("unidades").select("*").eq("id", unidadeId).single();
  if (!emp || !u) notFound();
  const empT = emp as Empreendimento;
  if (empT.tipo !== "horizontal" || !empT.planta_implantacao_url) {
    return <p>Este empreendimento não é horizontal ou ainda não tem planta.</p>;
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Marcar área — {(u as Unidade).identificador}</h1>
      <EditorAreas
        plantaUrl={empT.planta_implantacao_url}
        unidadeId={unidadeId}
        identificador={(u as Unidade).identificador}
        empreendimentoId={id}
        coordsAtuais={(u as Unidade).coordenadas_poligono}
      />
    </div>
  );
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run build
git add components/mapa/EditorAreas.tsx app/\(app\)/empreendimentos
git commit -m "feat(mapa): add rectangle editor for horizontal blueprint"
```

### Task 7.5: Wire mapa into EmpreendimentoTabs

**Files:**
- Modify: `components/empreendimento/EmpreendimentoTabs.tsx`

- [ ] **Step 1: Update the file**

Replace the entire file:

```tsx
"use client";
import { useState } from "react";
import type { Empreendimento, Unidade, Profile, ArquivoEmpreendimento } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaUnidades } from "@/components/unidade/ListaUnidades";
import { PainelUnidade } from "@/components/unidade/PainelUnidade";
import { ArquivosTab } from "@/components/empreendimento/ArquivosTab";
import { MapaVertical } from "@/components/mapa/MapaVertical";
import { MapaHorizontal } from "@/components/mapa/MapaHorizontal";
import { MapaFiltros, type FiltroMapa } from "@/components/mapa/MapaFiltros";
import { LegendaMapa } from "@/components/mapa/Legenda";
import { gerarMensagemUnidade, gerarLinkWhatsapp } from "@/lib/mensagem-whatsapp";
import { branding } from "@/config/branding";

export function EmpreendimentoTabs({ emp, unidades, arquivos, profile }: {
  emp: Empreendimento; unidades: Unidade[]; arquivos: ArquivoEmpreendimento[]; profile: Profile;
}) {
  const [sel, setSel] = useState<Unidade | null>(null);
  const [filtro, setFiltro] = useState<FiltroMapa>({ status: [] });
  const quartosDistintos = Array.from(new Set(unidades.map((u) => u.qtd_quartos).filter((n) => n != null))) as number[];
  const mensagem = sel ? gerarMensagemUnidade(sel, emp, branding) : "";
  const link = gerarLinkWhatsapp(mensagem);
  const isAdmin = profile.role === "admin";

  const verticalReady = emp.tipo === "vertical" && emp.qtd_andares && emp.qtd_unidades_por_andar;
  const horizontalReady = emp.tipo === "horizontal" && emp.planta_implantacao_url;
  const horizontalNenhumaArea = horizontalReady && !unidades.some((u) => u.coordenadas_poligono);

  return (
    <>
      <Tabs defaultValue={horizontalReady && !horizontalNenhumaArea ? "mapa" : verticalReady ? "mapa" : "lista"}>
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa" className="space-y-3">
          <LegendaMapa />
          <MapaFiltros value={filtro} onChange={setFiltro} quartosDistintos={quartosDistintos} />
          {verticalReady && (
            <MapaVertical unidades={unidades} qtdAndares={emp.qtd_andares!} qtdUnidadesPorAndar={emp.qtd_unidades_por_andar!} filtro={filtro} onSelect={setSel} />
          )}
          {horizontalReady && (
            <MapaHorizontal plantaUrl={emp.planta_implantacao_url!} unidades={unidades} filtro={filtro} onSelect={setSel} />
          )}
          {!verticalReady && !horizontalReady && (
            <p className="text-muted-foreground p-4 text-sm">
              Mapa indisponível. {emp.tipo === "horizontal" ? "Suba a planta de implantação para visualizar." : "Defina andares e unidades por andar."}
            </p>
          )}
        </TabsContent>
        <TabsContent value="lista">
          <ListaUnidades unidades={unidades} onSelect={setSel} />
        </TabsContent>
        <TabsContent value="arquivos">
          <ArquivosTab empreendimentoId={emp.id} arquivos={arquivos} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
      <PainelUnidade
        unidade={sel}
        empreendimentoNome={emp.nome}
        profile={profile}
        open={!!sel}
        onOpenChange={(b) => !b && setSel(null)}
        mensagemWhatsapp={mensagem}
        linkWhatsapp={link}
      />
    </>
  );
}
```

- [ ] **Step 2: Build**

`npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/empreendimento/EmpreendimentoTabs.tsx
git commit -m "feat(mapa): wire vertical and horizontal map into tabs"
```

---

## Phase 8 — Reservas + Clientes + Vendas + WhatsApp message

### Task 8.1: WhatsApp message generator (real implementation + tests)

**Files:**
- Modify: `lib/mensagem-whatsapp.ts`
- Test: `lib/__tests__/mensagem-whatsapp.test.ts`

- [ ] **Step 1: Replace `lib/mensagem-whatsapp.ts`**

```ts
import type { Empreendimento, Unidade } from "@/types/database";
import type { Branding } from "@/config/branding";
import { formatBRL, formatM2, formatMonthYear, pluralize } from "@/lib/formatacao";

export function gerarMensagemUnidade(u: Unidade, e: Empreendimento, b: Branding): string {
  const precoM2 = u.preco_total != null && u.area_privativa_m2
    ? u.preco_total / u.area_privativa_m2
    : null;
  const suites = u.qtd_suites && u.qtd_suites > 0 ? ` (${u.qtd_suites} suítes)` : "";
  const vagas = u.qtd_vagas != null ? pluralize(u.qtd_vagas, "vaga", "vagas") : "";

  const replacements: Record<string, string> = {
    empreendimento: e.nome,
    unidade: u.identificador,
    areaPrivativa: u.area_privativa_m2 != null ? String(u.area_privativa_m2).replace(".", ",") : "",
    quartos: u.qtd_quartos != null ? String(u.qtd_quartos) : "",
    suites,
    banheiros: u.qtd_banheiros != null ? String(u.qtd_banheiros) : "",
    vagas,
    precoTotal: u.preco_total != null ? formatBRL(u.preco_total).replace("R$ ", "") : "",
    precoM2: precoM2 != null ? formatBRL(precoM2).replace("R$ ", "") : "",
    endereco: e.endereco ?? "",
    cidade: e.cidade ?? "",
    estado: e.estado ?? "",
    dataEntrega: e.data_entrega_prevista ? formatMonthYear(e.data_entrega_prevista) : "",
    footer: b.whatsappFooter,
  };

  let out = b.whatsappTemplate;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  // Remove lines that became empty after substitution (heuristic: lines that end with no value)
  out = out
    .split("\n")
    .filter((line) => {
      const stripped = line.trim();
      if (stripped === "") return true;
      // Lines that became "🛏️ quartos" without a number are bad — but we keep simple: drop emoji-only or trailing-emoji lines
      return !/^[\p{Emoji}\s—]+$/u.test(stripped);
    })
    .join("\n");
  // Used to also format formatM2 inline:
  void formatM2; // ensure import not stripped
  return out;
}

export function gerarLinkWhatsapp(mensagem: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}
```

- [ ] **Step 2: Write tests**

```ts
// lib/__tests__/mensagem-whatsapp.test.ts
import { describe, it, expect } from "vitest";
import { gerarMensagemUnidade, gerarLinkWhatsapp } from "../mensagem-whatsapp";
import type { Empreendimento, Unidade } from "@/types/database";
import { branding } from "@/config/branding";

const emp: Empreendimento = {
  id: "e1", nome: "Pipa Aruan", tipo: "vertical", status: "em_obras",
  endereco: "Rua X, 123", cidade: "Natal", estado: "RN", cep: "59000-000",
  data_entrega_prevista: "2026-12-15", foto_capa_url: null, descricao: null,
  qtd_andares: 10, qtd_unidades_por_andar: 4, planta_implantacao_url: null,
  criado_em: "", atualizado_em: "",
};

const u: Unidade = {
  id: "u1", empreendimento_id: "e1", identificador: "Apto 302",
  andar: 3, posicao_no_andar: "A", area_privativa_m2: 75, area_total_m2: 90,
  qtd_quartos: 2, qtd_suites: 1, qtd_banheiros: 2, qtd_vagas: 1,
  preco_total: 580000, valor_condominio: 450, status: "disponivel",
  foto_url: null, coordenadas_poligono: null, criado_em: "", atualizado_em: "",
};

describe("gerarMensagemUnidade", () => {
  it("includes empreendimento name and identifier", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("Pipa Aruan");
    expect(msg).toContain("Apto 302");
  });
  it("formats price in BRL", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("580.000,00");
  });
  it("includes suites annotation", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("1 suítes");
  });
  it("pluralizes vagas correctly", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain("1 vaga");
  });
  it("includes footer", () => {
    const msg = gerarMensagemUnidade(u, emp, branding);
    expect(msg).toContain(branding.whatsappFooter);
  });
});

describe("gerarLinkWhatsapp", () => {
  it("encodes message", () => {
    expect(gerarLinkWhatsapp("oi mundo")).toBe("https://wa.me/?text=oi%20mundo");
  });
});
```

- [ ] **Step 3: Run tests**

`npm run test:run -- mensagem-whatsapp`
Expected: 6 PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/mensagem-whatsapp.ts lib/__tests__/mensagem-whatsapp.test.ts
git commit -m "feat(whatsapp): implement message generator with formatting and tests"
```

### Task 8.2: Cliente server actions

**Files:**
- Create: `lib/actions/clientes.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile } from "@/lib/auth";

const clienteSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().optional().nullable(),
  telefone: z.string().min(1),
  email: z.string().email().optional().nullable().or(z.literal("")),
  renda: z.coerce.number().nonnegative().optional().nullable(),
  tipo_renda: z.enum(["individual", "composta"]).default("individual"),
  nome_2: z.string().optional().nullable(),
  cpf_2: z.string().optional().nullable(),
  renda_2: z.coerce.number().nonnegative().optional().nullable(),
});

export async function criarClienteAction(input: z.infer<typeof clienteSchema>) {
  const profile = await requireAuthenticatedProfile();
  const data = clienteSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: created, error } = await supabase
    .from("clientes")
    .insert({ ...data, criado_por: profile.id })
    .select("id")
    .single();
  if (error || !created) return { error: error?.message ?? "Falha" };
  return { success: true, id: created.id };
}

export async function atualizarClienteAction(id: string, input: Partial<z.infer<typeof clienteSchema>>) {
  await requireAuthenticatedProfile();
  const data = clienteSchema.partial().parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clientes").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

export async function buscarClientesAction(q: string) {
  await requireAuthenticatedProfile();
  if (!q || q.length < 2) return { results: [] };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nome, cpf, telefone")
    .or(`nome.ilike.%${q}%,cpf.ilike.%${q}%`)
    .limit(10);
  return { results: data ?? [] };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/clientes.ts
git commit -m "feat(clientes): add CRUD + autocomplete server actions"
```

### Task 8.3: Reserva server actions

**Files:**
- Create: `lib/actions/reservas.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAuthenticatedProfile, requireAdminProfile } from "@/lib/auth";

const reservaSchema = z.object({
  unidade_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  valor_proposta_total: z.coerce.number().positive(),
  valor_entrada: z.coerce.number().nonnegative().optional().nullable(),
  forma_pagamento: z.enum(["a_vista", "financiado"]).optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export async function criarReservaAction(input: z.infer<typeof reservaSchema>) {
  const profile = await requireAuthenticatedProfile();
  const data = reservaSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  // Check unidade is disponivel
  const { data: u } = await supabase.from("unidades").select("status, empreendimento_id").eq("id", data.unidade_id).single();
  if (!u || u.status !== "disponivel") return { error: "Unidade não está disponível" };

  const { error: insertError } = await supabase.from("reservas").insert({ ...data, corretor_id: profile.id });
  if (insertError) return { error: insertError.message };

  const { error: updateError } = await supabase.from("unidades").update({ status: "reservada" }).eq("id", data.unidade_id);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/empreendimentos/${u.empreendimento_id}`);
  return { success: true };
}

export async function cancelarReservaAction(reservaId: string) {
  const profile = await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();
  const { data: r } = await supabase.from("reservas").select("corretor_id, unidade_id, status").eq("id", reservaId).single();
  if (!r) return { error: "Reserva não encontrada" };
  if (r.status !== "ativa") return { error: "Reserva não está ativa" };
  if (profile.role !== "admin" && r.corretor_id !== profile.id) return { error: "Sem permissão" };

  await supabase.from("reservas").update({ status: "cancelada" }).eq("id", reservaId);
  // Only flip unidade back if no other active reserva exists
  const { data: outras } = await supabase.from("reservas").select("id").eq("unidade_id", r.unidade_id).eq("status", "ativa");
  if (!outras || outras.length === 0) {
    await supabase.from("unidades").update({ status: "disponivel" }).eq("id", r.unidade_id);
  }
  const { data: u } = await supabase.from("unidades").select("empreendimento_id").eq("id", r.unidade_id).single();
  if (u) revalidatePath(`/empreendimentos/${u.empreendimento_id}`);
  return { success: true };
}

export async function marcarComoVendidaAction(unidadeId: string, valorFinal: number) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data: u } = await supabase.from("unidades").select("status, empreendimento_id").eq("id", unidadeId).single();
  if (!u || u.status !== "reservada") return { error: "Unidade não está reservada" };

  const { data: r } = await supabase.from("reservas").select("id, cliente_id, corretor_id").eq("unidade_id", unidadeId).eq("status", "ativa").maybeSingle();
  if (!r) return { error: "Nenhuma reserva ativa para esta unidade" };

  await supabase.from("vendas").insert({
    unidade_id: unidadeId,
    cliente_id: r.cliente_id,
    corretor_id: r.corretor_id,
    reserva_origem_id: r.id,
    valor_final: valorFinal,
  });
  await supabase.from("reservas").update({ status: "convertida_em_venda" }).eq("id", r.id);
  await supabase.from("unidades").update({ status: "vendida" }).eq("id", unidadeId);
  revalidatePath(`/empreendimentos/${u.empreendimento_id}`);
  return { success: true };
}

export async function historicoReservasAction(unidadeId: string) {
  await requireAuthenticatedProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reservas")
    .select("*, cliente:clientes(nome, telefone), corretor:profiles(nome)")
    .eq("unidade_id", unidadeId)
    .order("criado_em", { ascending: false });
  return { reservas: data ?? [] };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/reservas.ts
git commit -m "feat(reservas): add reservation lifecycle server actions"
```

### Task 8.4: ModalReserva component

**Files:**
- Create: `components/reserva/ModalReserva.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { criarClienteAction, buscarClientesAction } from "@/lib/actions/clientes";
import { criarReservaAction } from "@/lib/actions/reservas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ModalReserva({
  open, onOpenChange, unidadeId, unidadeNome,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  unidadeId: string;
  unidadeNome: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [usarExistente, setUsarExistente] = useState(false);
  const [buscaQ, setBuscaQ] = useState("");
  const [resultados, setResultados] = useState<Array<{ id: string; nome: string; cpf: string | null; telefone: string }>>([]);
  const [clienteExistenteId, setClienteExistenteId] = useState<string | null>(null);
  const [composta, setComposta] = useState(false);

  const [cli, setCli] = useState({
    nome: "", cpf: "", telefone: "", email: "", renda: "",
    nome_2: "", cpf_2: "", renda_2: "",
  });
  const [prop, setProp] = useState({
    valor_proposta_total: "", valor_entrada: "", forma_pagamento: "" as "" | "a_vista" | "financiado", observacoes: "",
  });

  async function buscar() {
    const res = await buscarClientesAction(buscaQ);
    setResultados(res.results);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      let clienteId = clienteExistenteId;
      if (!clienteId) {
        const r = await criarClienteAction({
          nome: cli.nome,
          cpf: cli.cpf || null,
          telefone: cli.telefone,
          email: cli.email || null,
          renda: cli.renda ? Number(cli.renda) : null,
          tipo_renda: composta ? "composta" : "individual",
          nome_2: composta ? cli.nome_2 || null : null,
          cpf_2: composta ? cli.cpf_2 || null : null,
          renda_2: composta && cli.renda_2 ? Number(cli.renda_2) : null,
        } as never);
        if (r?.error || !r?.id) { toast.error(r?.error ?? "Falha ao cadastrar cliente"); return; }
        clienteId = r.id;
      }
      const res = await criarReservaAction({
        unidade_id: unidadeId,
        cliente_id: clienteId,
        valor_proposta_total: Number(prop.valor_proposta_total),
        valor_entrada: prop.valor_entrada ? Number(prop.valor_entrada) : null,
        forma_pagamento: prop.forma_pagamento || null,
        observacoes: prop.observacoes || null,
      } as never);
      if (res?.error) toast.error(res.error);
      else { toast.success("Reserva criada"); onOpenChange(false); router.refresh(); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reservar {unidadeNome}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Cliente</h3>
              <label className="text-xs flex items-center gap-1">
                <Checkbox checked={usarExistente} onCheckedChange={(v) => setUsarExistente(!!v)} />
                Já cadastrado
              </label>
            </div>
            {usarExistente ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Buscar por nome ou CPF" value={buscaQ} onChange={(e) => setBuscaQ(e.target.value)} />
                  <Button type="button" variant="outline" onClick={buscar}>Buscar</Button>
                </div>
                <ul className="border rounded divide-y max-h-40 overflow-y-auto">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => setClienteExistenteId(r.id)} className={`w-full text-left p-2 hover:bg-accent text-sm ${clienteExistenteId === r.id ? "bg-accent" : ""}`}>
                        <span className="font-medium">{r.nome}</span>
                        <span className="text-muted-foreground"> · {r.telefone}{r.cpf ? ` · ${r.cpf}` : ""}</span>
                      </button>
                    </li>
                  ))}
                  {resultados.length === 0 && <li className="p-2 text-xs text-muted-foreground">Nenhum resultado.</li>}
                </ul>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Nome*</Label><Input value={cli.nome} onChange={(e) => setCli({ ...cli, nome: e.target.value })} required /></div>
                  <div className="space-y-1"><Label>Telefone*</Label><Input value={cli.telefone} onChange={(e) => setCli({ ...cli, telefone: e.target.value })} required /></div>
                  <div className="space-y-1"><Label>CPF</Label><Input value={cli.cpf} onChange={(e) => setCli({ ...cli, cpf: e.target.value })} /></div>
                  <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={cli.email} onChange={(e) => setCli({ ...cli, email: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Renda</Label><Input type="number" value={cli.renda} onChange={(e) => setCli({ ...cli, renda: e.target.value })} /></div>
                  <div className="space-y-1 flex items-end gap-2">
                    <label className="text-sm flex items-center gap-2">
                      <Checkbox checked={composta} onCheckedChange={(v) => setComposta(!!v)} />
                      Renda composta
                    </label>
                  </div>
                </div>
                {composta && (
                  <div className="grid md:grid-cols-3 gap-3 rounded border bg-accent/20 p-3">
                    <div className="space-y-1"><Label>Nome (2ª pessoa)</Label><Input value={cli.nome_2} onChange={(e) => setCli({ ...cli, nome_2: e.target.value })} /></div>
                    <div className="space-y-1"><Label>CPF (2ª pessoa)</Label><Input value={cli.cpf_2} onChange={(e) => setCli({ ...cli, cpf_2: e.target.value })} /></div>
                    <div className="space-y-1"><Label>Renda (2ª pessoa)</Label><Input type="number" value={cli.renda_2} onChange={(e) => setCli({ ...cli, renda_2: e.target.value })} /></div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Proposta</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Valor total*</Label><Input type="number" step="0.01" value={prop.valor_proposta_total} onChange={(e) => setProp({ ...prop, valor_proposta_total: e.target.value })} required /></div>
              <div className="space-y-1"><Label>Entrada</Label><Input type="number" step="0.01" value={prop.valor_entrada} onChange={(e) => setProp({ ...prop, valor_entrada: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Forma de pagamento</Label>
                <Select value={prop.forma_pagamento} onValueChange={(v) => setProp({ ...prop, forma_pagamento: v as "a_vista" | "financiado" })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_vista">À vista</SelectItem>
                    <SelectItem value="financiado">Financiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea rows={3} value={prop.observacoes} onChange={(e) => setProp({ ...prop, observacoes: e.target.value })} />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Confirmar reserva"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reserva
git commit -m "feat(reserva): add reservation modal with cliente and proposta"
```

### Task 8.5: ModalEditarCliente component

**Files:**
- Create: `components/reserva/ModalEditarCliente.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { atualizarClienteAction } from "@/lib/actions/clientes";
import { toast } from "sonner";
import type { Cliente } from "@/types/database";

export function ModalEditarCliente({ open, onOpenChange, cliente }: {
  open: boolean; onOpenChange: (b: boolean) => void; cliente: Cliente;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome: cliente.nome, cpf: cliente.cpf ?? "", telefone: cliente.telefone, email: cliente.email ?? "",
    renda: cliente.renda?.toString() ?? "",
    tipo_renda: cliente.tipo_renda,
    nome_2: cliente.nome_2 ?? "", cpf_2: cliente.cpf_2 ?? "", renda_2: cliente.renda_2?.toString() ?? "",
  });
  const composta = form.tipo_renda === "composta";

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await atualizarClienteAction(cliente.id, {
        nome: form.nome, cpf: form.cpf || null, telefone: form.telefone, email: form.email || null,
        renda: form.renda ? Number(form.renda) : null,
        tipo_renda: form.tipo_renda,
        nome_2: composta ? form.nome_2 || null : null,
        cpf_2: composta ? form.cpf_2 || null : null,
        renda_2: composta && form.renda_2 ? Number(form.renda_2) : null,
      } as never);
      if (res?.error) toast.error(res.error);
      else { toast.success("Cliente atualizado"); onOpenChange(false); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nome*</Label><Input value={form.nome} onChange={(e) => set("nome", e.target.value)} required /></div>
            <div className="space-y-1"><Label>Telefone*</Label><Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} required /></div>
            <div className="space-y-1"><Label>CPF</Label><Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} /></div>
            <div className="space-y-1"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="space-y-1"><Label>Renda</Label><Input type="number" value={form.renda} onChange={(e) => set("renda", e.target.value)} /></div>
            <label className="flex items-end gap-2 text-sm">
              <Checkbox checked={composta} onCheckedChange={(v) => set("tipo_renda", v ? "composta" : "individual")} />
              Renda composta
            </label>
          </div>
          {composta && (
            <div className="grid md:grid-cols-3 gap-3 rounded border bg-accent/20 p-3">
              <div className="space-y-1"><Label>Nome (2ª)</Label><Input value={form.nome_2} onChange={(e) => set("nome_2", e.target.value)} /></div>
              <div className="space-y-1"><Label>CPF (2ª)</Label><Input value={form.cpf_2} onChange={(e) => set("cpf_2", e.target.value)} /></div>
              <div className="space-y-1"><Label>Renda (2ª)</Label><Input type="number" value={form.renda_2} onChange={(e) => set("renda_2", e.target.value)} /></div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reserva/ModalEditarCliente.tsx
git commit -m "feat(cliente): add edit modal"
```

### Task 8.6: Modal "Marcar como vendida"

**Files:**
- Create: `components/reserva/ModalVenda.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marcarComoVendidaAction } from "@/lib/actions/reservas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ModalVenda({ open, onOpenChange, unidadeId, sugerido }: {
  open: boolean; onOpenChange: (b: boolean) => void; unidadeId: string; sugerido: number | null;
}) {
  const [valor, setValor] = useState<string>(sugerido != null ? String(sugerido) : "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await marcarComoVendidaAction(unidadeId, Number(valor));
      if (res?.error) toast.error(res.error);
      else { toast.success("Unidade marcada como vendida"); onOpenChange(false); router.refresh(); }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Marcar como vendida</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Valor final da venda</Label>
            <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>Confirmar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reserva/ModalVenda.tsx
git commit -m "feat(venda): add modal to convert reservation to sale"
```

### Task 8.7: Wire all modals + history into PainelUnidade

**Files:**
- Modify: `components/unidade/PainelUnidade.tsx`
- Modify: `components/empreendimento/EmpreendimentoTabs.tsx`

- [ ] **Step 1: Add history section to `PainelUnidade.tsx`**

Replace the file entirely:

```tsx
"use client";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Unidade, Profile } from "@/types/database";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { formatBRL, formatM2 } from "@/lib/formatacao";
import { Copy, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { excluirUnidadeAction } from "@/lib/actions/unidades";
import { cancelarReservaAction, historicoReservasAction } from "@/lib/actions/reservas";
import { useRouter } from "next/navigation";

type HistoricoItem = {
  id: string; valor_proposta_total: number; status: string; criado_em: string;
  cliente: { nome: string; telefone: string } | null;
  corretor: { nome: string } | null;
};

export function PainelUnidade({
  unidade, empreendimentoNome, profile, open, onOpenChange,
  mensagemWhatsapp, linkWhatsapp,
  onReservar, onMarcarVendida,
}: {
  unidade: Unidade | null;
  empreendimentoNome: string;
  profile: Profile;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  mensagemWhatsapp: string;
  linkWhatsapp: string;
  onReservar: (u: Unidade) => void;
  onMarcarVendida: (u: Unidade) => void;
}) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  useEffect(() => {
    if (!unidade) return;
    historicoReservasAction(unidade.id).then((r) => setHistorico(r.reservas as HistoricoItem[]));
  }, [unidade?.id, open]);

  if (!unidade) return null;
  const isAdmin = profile.role === "admin";
  const reservaAtiva = historico.find((h) => h.status === "ativa");

  function copiar() { navigator.clipboard.writeText(mensagemWhatsapp); toast.success("Mensagem copiada!"); }
  function abrirWa() { window.open(linkWhatsapp, "_blank"); }

  function excluir() {
    if (!confirm("Excluir unidade?")) return;
    startTransition(async () => {
      const res = await excluirUnidadeAction(unidade!.id);
      if (res?.error) toast.error(res.error);
      else { toast.success("Unidade excluída"); router.refresh(); }
    });
  }

  function cancelarReserva() {
    if (!reservaAtiva) return;
    if (!confirm("Cancelar a reserva atual?")) return;
    startTransition(async () => {
      const res = await cancelarReservaAction(reservaAtiva.id);
      if (res?.error) toast.error(res.error);
      else { toast.success("Reserva cancelada"); router.refresh(); }
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="ml-auto w-full sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{empreendimentoNome} — {unidade.identificador}</DrawerTitle>
          <StatusBadge status={unidade.status} />
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto">
          <Tabs defaultValue="detalhes">
            <TabsList>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            <TabsContent value="detalhes" className="space-y-3 pt-3">
              {unidade.foto_url && (
                <div className="relative aspect-video rounded overflow-hidden bg-muted">
                  <Image src={unidade.foto_url} alt={unidade.identificador} fill className="object-cover" />
                </div>
              )}
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Área privativa</dt><dd>{formatM2(unidade.area_privativa_m2)}</dd>
                <dt className="text-muted-foreground">Área total</dt><dd>{formatM2(unidade.area_total_m2)}</dd>
                <dt className="text-muted-foreground">Quartos</dt><dd>{unidade.qtd_quartos ?? "—"}{unidade.qtd_suites ? ` (${unidade.qtd_suites} suítes)` : ""}</dd>
                <dt className="text-muted-foreground">Banheiros</dt><dd>{unidade.qtd_banheiros ?? "—"}</dd>
                <dt className="text-muted-foreground">Vagas</dt><dd>{unidade.qtd_vagas ?? "—"}</dd>
                <dt className="text-muted-foreground">Preço total</dt><dd className="font-semibold">{formatBRL(unidade.preco_total)}</dd>
                {isAdmin && (<><dt className="text-muted-foreground">Condomínio</dt><dd>{formatBRL(unidade.valor_condominio)}</dd></>)}
              </dl>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" onClick={copiar}><Copy className="mr-1 size-4" /> Copiar</Button>
                <Button variant="outline" onClick={abrirWa}><MessageCircle className="mr-1 size-4" /> WhatsApp</Button>
              </div>

              {unidade.status === "disponivel" && (
                <Button className="w-full" onClick={() => onReservar(unidade)}>Reservar</Button>
              )}
              {unidade.status === "reservada" && reservaAtiva && (isAdmin || reservaAtiva.corretor?.nome === profile.nome) && (
                <Button variant="outline" className="w-full" onClick={cancelarReserva}>Cancelar reserva</Button>
              )}
              {unidade.status === "reservada" && isAdmin && (
                <Button className="w-full" onClick={() => onMarcarVendida(unidade)}>Marcar como vendida</Button>
              )}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/empreendimentos/${unidade.empreendimento_id}/unidades/${unidade.id}/editar`}><Pencil className="mr-1 size-4" /> Editar</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={excluir}><Trash2 className="mr-1 size-4 text-destructive" /> Excluir</Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="historico" className="pt-3 space-y-2">
              {historico.length === 0
                ? <p className="text-muted-foreground text-sm text-center py-6">Sem reservas anteriores.</p>
                : historico.map((h) => (
                    <div key={h.id} className="border rounded p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{h.cliente?.nome ?? "—"}</span>
                        <span className="text-xs uppercase">{h.status}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Corretor: {h.corretor?.nome ?? "—"}</p>
                      <p className="text-xs">{formatBRL(h.valor_proposta_total)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.criado_em).toLocaleString("pt-BR")}</p>
                    </div>
                  ))}
            </TabsContent>
          </Tabs>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Update `EmpreendimentoTabs` to render modals**

Replace the `EmpreendimentoTabs` component:

```tsx
"use client";
import { useState } from "react";
import type { Empreendimento, Unidade, Profile, ArquivoEmpreendimento } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaUnidades } from "@/components/unidade/ListaUnidades";
import { PainelUnidade } from "@/components/unidade/PainelUnidade";
import { ArquivosTab } from "@/components/empreendimento/ArquivosTab";
import { MapaVertical } from "@/components/mapa/MapaVertical";
import { MapaHorizontal } from "@/components/mapa/MapaHorizontal";
import { MapaFiltros, type FiltroMapa } from "@/components/mapa/MapaFiltros";
import { LegendaMapa } from "@/components/mapa/Legenda";
import { ModalReserva } from "@/components/reserva/ModalReserva";
import { ModalVenda } from "@/components/reserva/ModalVenda";
import { gerarMensagemUnidade, gerarLinkWhatsapp } from "@/lib/mensagem-whatsapp";
import { branding } from "@/config/branding";

export function EmpreendimentoTabs({ emp, unidades, arquivos, profile }: {
  emp: Empreendimento; unidades: Unidade[]; arquivos: ArquivoEmpreendimento[]; profile: Profile;
}) {
  const [sel, setSel] = useState<Unidade | null>(null);
  const [reservar, setReservar] = useState<Unidade | null>(null);
  const [vender, setVender] = useState<Unidade | null>(null);
  const [filtro, setFiltro] = useState<FiltroMapa>({ status: [] });
  const quartosDistintos = Array.from(new Set(unidades.map((u) => u.qtd_quartos).filter((n) => n != null))) as number[];
  const mensagem = sel ? gerarMensagemUnidade(sel, emp, branding) : "";
  const link = gerarLinkWhatsapp(mensagem);
  const isAdmin = profile.role === "admin";

  const verticalReady = emp.tipo === "vertical" && emp.qtd_andares && emp.qtd_unidades_por_andar;
  const horizontalReady = emp.tipo === "horizontal" && emp.planta_implantacao_url;

  return (
    <>
      <Tabs defaultValue={verticalReady || horizontalReady ? "mapa" : "lista"}>
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa" className="space-y-3">
          <LegendaMapa />
          <MapaFiltros value={filtro} onChange={setFiltro} quartosDistintos={quartosDistintos} />
          {verticalReady && <MapaVertical unidades={unidades} qtdAndares={emp.qtd_andares!} qtdUnidadesPorAndar={emp.qtd_unidades_por_andar!} filtro={filtro} onSelect={setSel} />}
          {horizontalReady && <MapaHorizontal plantaUrl={emp.planta_implantacao_url!} unidades={unidades} filtro={filtro} onSelect={setSel} />}
          {!verticalReady && !horizontalReady && (
            <p className="text-muted-foreground p-4 text-sm">Mapa indisponível. {emp.tipo === "horizontal" ? "Suba a planta de implantação." : "Defina andares e unidades por andar."}</p>
          )}
        </TabsContent>
        <TabsContent value="lista">
          <ListaUnidades unidades={unidades} onSelect={setSel} />
        </TabsContent>
        <TabsContent value="arquivos">
          <ArquivosTab empreendimentoId={emp.id} arquivos={arquivos} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>

      <PainelUnidade
        unidade={sel}
        empreendimentoNome={emp.nome}
        profile={profile}
        open={!!sel}
        onOpenChange={(b) => !b && setSel(null)}
        mensagemWhatsapp={mensagem}
        linkWhatsapp={link}
        onReservar={(u) => { setReservar(u); setSel(null); }}
        onMarcarVendida={(u) => { setVender(u); setSel(null); }}
      />
      {reservar && (
        <ModalReserva
          open={!!reservar}
          onOpenChange={(b) => !b && setReservar(null)}
          unidadeId={reservar.id}
          unidadeNome={`${emp.nome} — ${reservar.identificador}`}
        />
      )}
      {vender && (
        <ModalVenda
          open={!!vender}
          onOpenChange={(b) => !b && setVender(null)}
          unidadeId={vender.id}
          sugerido={vender.preco_total}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Build**

`npm run build`

- [ ] **Step 4: Commit**

```bash
git add components/unidade/PainelUnidade.tsx components/empreendimento/EmpreendimentoTabs.tsx
git commit -m "feat(reserva): wire reservation/sale modals and history tab"
```

---

## Phase 9 — Usuários + INSTALL + polimento + verification

### Task 9.1: Usuários server actions

**Files:**
- Create: `lib/actions/usuarios.ts`

- [ ] **Step 1: Implement**

```ts
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminProfile } from "@/lib/auth";

const inviteSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "corretor"]),
});

export async function convidarUsuarioAction(input: z.infer<typeof inviteSchema>) {
  await requireAdminProfile();
  const data = inviteSchema.parse(input);
  const admin = createSupabaseAdminClient();
  const { data: result, error } = await admin.auth.admin.inviteUserByEmail(data.email, {
    data: { nome: data.nome, role: data.role },
  });
  if (error || !result?.user) return { error: error?.message ?? "Falha ao convidar" };
  revalidatePath("/usuarios");
  return { success: true };
}

export async function atualizarUsuarioAction(id: string, patch: { role?: "admin" | "corretor"; ativo?: boolean; nome?: string }) {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/usuarios");
  return { success: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/actions/usuarios.ts
git commit -m "feat(usuarios): add invite and update server actions"
```

### Task 9.2: Usuários page

**Files:**
- Create: `app/(app)/usuarios/page.tsx`, `app/(app)/usuarios/UsuariosClient.tsx`

- [ ] **Step 1: `page.tsx`**

```tsx
import { requireAdminProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UsuariosClient } from "./UsuariosClient";
import type { Profile } from "@/types/database";

export default async function UsuariosPage() {
  await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").order("nome");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Usuários</h1>
      <UsuariosClient usuarios={(data ?? []) as Profile[]} />
    </div>
  );
}
```

- [ ] **Step 2: `UsuariosClient.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { convidarUsuarioAction, atualizarUsuarioAction } from "@/lib/actions/usuarios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function UsuariosClient({ usuarios }: { usuarios: Profile[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", role: "corretor" as "admin" | "corretor" });
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function convidar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await convidarUsuarioAction(form);
      if (res?.error) toast.error(res.error);
      else { toast.success("Convite enviado"); setOpen(false); router.refresh(); }
    });
  }

  function toggleRole(p: Profile) {
    startTransition(async () => {
      await atualizarUsuarioAction(p.id, { role: p.role === "admin" ? "corretor" : "admin" });
      router.refresh();
    });
  }
  function toggleAtivo(p: Profile) {
    startTransition(async () => {
      await atualizarUsuarioAction(p.id, { ativo: !p.ativo });
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 size-4" /> Convidar usuário</Button>
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role === "admin" ? "Admin" : "Corretor"}</TableCell>
                <TableCell>{u.ativo ? "Ativo" : "Inativo"}</TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => toggleRole(u)}>Alternar papel</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleAtivo(u)}>{u.ativo ? "Desativar" : "Ativar"}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar usuário</DialogTitle></DialogHeader>
          <form onSubmit={convidar} className="space-y-3">
            <div className="space-y-1"><Label>Nome*</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
            <div className="space-y-1"><Label>E-mail*</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="space-y-1">
              <Label>Papel*</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "corretor" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="corretor">Corretor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={pending}>{pending ? "Enviando..." : "Enviar convite"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/usuarios
git commit -m "feat(usuarios): add admin user management page"
```

### Task 9.3: INSTALL.md

**Files:**
- Create: `INSTALL.md`

- [ ] **Step 1: Write**

```markdown
# Instalação para novo cliente

Cada cliente tem **sua própria** stack: repositório, Supabase e Vercel. Tempo total estimado: ~1 hora.

## Passo a passo

### 1. Clone e renomeie o repositório

```bash
git clone <repo> painel-CLIENTE
cd painel-CLIENTE
git remote remove origin
# crie novo repo no GitHub e plugue
git remote add origin git@github.com:SUA_ORG/painel-CLIENTE.git
git push -u origin main
```

### 2. Crie projeto Supabase

- Acesse https://supabase.com → New Project
- Anote `Project URL`, `anon key`, `service_role key` em variáveis seguras
- No SQL Editor, rode em ordem:
  - `supabase/migrations/0001_schema.sql`
  - `supabase/migrations/0002_rls.sql`
  - `supabase/migrations/0003_storage.sql`

### 3. Crie o primeiro admin

No SQL Editor:
```sql
-- Substitua e-mail e senha
select auth.admin.create_user(jsonb_build_object(
  'email','admin@cliente.com.br',
  'password','senha-segura-aqui',
  'email_confirm',true,
  'user_metadata', jsonb_build_object('nome','Admin Cliente','role','admin')
));
```

Verifique:
```sql
select id, nome, role from public.profiles;
```

### 4. Substitua o branding

Em `/public/branding/`, troque:
- `logo.png` — logo do cliente
- `logo-dark.png` — versão para fundo escuro (opcional)
- `favicon.ico` — ícone

Em `config/branding.ts`, edite:
- `companyName`
- `primaryColor` (hex)
- `whatsappFooter`
- `whatsappTemplate` (se quiser ajustar)

Em `app/globals.css`, atualize `--brand` para a mesma `primaryColor`.

### 5. Configure Vercel

- Acesse https://vercel.com → New Project → Importe o repo
- Em Environment Variables, configure:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (privado!)
- Deploy

### 6. Domínio

Em Settings → Domains, adicione o domínio do cliente (ex: `painel.cliente.com.br`) e configure o DNS.

### 7. Convide usuários

Logue como admin em `/usuarios`, clique em "Convidar usuário".

## Checklist pós-instalação

- [ ] Login funciona
- [ ] Conseguiu criar 1 empreendimento de teste
- [ ] Upload de foto funciona
- [ ] Conseguiu criar 1 unidade
- [ ] Conseguiu reservar
- [ ] Mensagem WhatsApp formatada certo
- [ ] Logo e cores aparecem corretas
```

- [ ] **Step 2: Commit**

```bash
git add INSTALL.md
git commit -m "docs: add per-client installation guide"
```

### Task 9.4: README + .env.local

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md`**

```markdown
# Painel de Unidades

Painel interno para gestão de empreendimentos e unidades imobiliárias.

> **White-label.** Cada cliente tem sua própria instância (GitHub + Supabase + Vercel).
> Primeiro cliente: MVP Engenharia.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- Vercel (deploy)

## Dev local

```bash
cp .env.local.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

## Instalação para novo cliente

Veja [INSTALL.md](./INSTALL.md).

## Estrutura

- `app/` — rotas (App Router)
- `components/` — UI
- `lib/` — server actions, supabase clients, helpers
- `supabase/migrations/` — schema SQL versionado
- `config/branding.ts` — customização por cliente
- `public/branding/` — assets visuais por cliente
- `docs/superpowers/` — spec e plano de implementação
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README with stack and dev instructions"
```

### Task 9.5: Manual verification checklist (run dev, smoke flows)

**Files:** none (manual)

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Run all checks below — record PASS/FAIL**

Login flow:
- [ ] `/login` exibe logo e campos
- [ ] Login inválido mostra erro
- [ ] Login válido redireciona para `/`

Dashboard:
- [ ] Resumo numérico renderiza
- [ ] Filtros funcionam
- [ ] Card abre o empreendimento

Empreendimento (vertical):
- [ ] Criar como admin gera placeholders no grid
- [ ] Mapa mostra todas células
- [ ] Clicar célula abre painel lateral
- [ ] Lista mostra unidades

Empreendimento (horizontal):
- [ ] Sem planta → cai pra lista
- [ ] Com planta + sem áreas → mostra "Sem posição"
- [ ] Editor desenha retângulo e salva
- [ ] Mapa mostra retângulo após salvar

Unidades:
- [ ] Criar unidade (admin)
- [ ] Editar unidade (admin)
- [ ] Excluir unidade (admin)

Reserva:
- [ ] Reservar com cliente novo
- [ ] Reservar com cliente existente
- [ ] Renda composta funciona
- [ ] Cancelar própria reserva (corretor)
- [ ] Admin marca como vendida

Mensagem WhatsApp:
- [ ] "Copiar mensagem" copia texto bonito
- [ ] "WhatsApp" abre `wa.me/`

Arquivos:
- [ ] Upload de PDF (admin)
- [ ] Corretor consegue baixar
- [ ] Admin exclui

Usuários:
- [ ] Admin vê `/usuarios`
- [ ] Convite envia e-mail
- [ ] Alternar papel funciona
- [ ] Desativar funciona

Permissões:
- [ ] Corretor não vê botão "Novo empreendimento"
- [ ] Corretor não vê valor do condomínio no painel
- [ ] Corretor não vê `/usuarios`
- [ ] Acesso direto a rotas admin redireciona

- [ ] **Step 3: Final commit (if needed)**

If any small issues were found and patched during checks:
```bash
git add .
git commit -m "fix: address issues from final smoke check"
```

---

## Plan complete

This plan delivers the full MVP described in `docs/superpowers/specs/2026-05-15-painel-unidades-design.md`. Each phase is independently testable; tasks within phases are designed as ≤ 5-minute bite-sized steps with explicit file paths and code.

