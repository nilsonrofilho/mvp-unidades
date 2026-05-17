# Painel de Unidades

Painel interno para gestão de empreendimentos e unidades imobiliárias.

> **White-label.** Cada cliente tem sua própria instância (GitHub + Supabase + Vercel).
> Primeiro cliente: MVP Engenharia.

## Stack

- Next.js 16 (App Router, webpack) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- Vercel (deploy)

## Desenvolvimento local

```bash
cp .env.local.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

## Instalação para novo cliente

Veja [INSTALL.md](./INSTALL.md).

## Estrutura

- `app/` — rotas (App Router)
- `components/` — UI
- `lib/` — server actions, Supabase clients, helpers
- `supabase/migrations/` — SQL versionado
- `config/branding.ts` — customização por cliente
- `public/branding/` — assets visuais por cliente
- `docs/superpowers/` — spec e plano de implementação

## Scripts

```bash
npm run dev       # dev server (webpack)
npm run build     # production build
npm run test      # vitest watch
npm run test:run  # vitest run once
npm run lint      # eslint
```
