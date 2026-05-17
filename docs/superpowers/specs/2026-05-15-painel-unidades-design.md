# Painel de Gestão de Unidades — Design

**Data:** 2026-05-15
**Status:** Aprovado para implementação
**Primeiro cliente:** MVP Engenharia

---

## 1. Visão geral

Painel interno e simples para gestão de empreendimentos imobiliários e suas unidades, usado pelo time interno da construtora/imobiliária e por corretores parceiros. O foco é centralizar empreendimentos, visualizar unidades disponíveis de forma visual (mapa de vendas), gerenciar reservas, organizar arquivos e gerar mensagens prontas para divulgação no WhatsApp.

O produto é **replicável** — vendido como instalação dedicada por cliente. O primeiro cliente é a MVP Engenharia. Cada cliente terá seu próprio repositório, projeto Supabase e projeto Vercel.

### Objetivos
- Interface visual e intuitiva, acessível para pessoas com pouca afinidade tecnológica.
- Centralizar gestão de unidades (cadastrar, editar, reservar, vender).
- Permitir divulgação rápida de unidades via WhatsApp.
- Manter histórico de reservas e propostas por unidade.

### Não-objetivos (fora do MVP)
- Página pública para cliente final.
- Comissão de parceria visível, book de marketing.
- Reservas com prazo automático ou aprovação multi-etapa.
- Multi-tenancy compartilhado.
- Notificações por e-mail (apenas convite de novo usuário, via Supabase Auth).
- Polígonos livres no editor de áreas (apenas retângulos).

---

## 2. Stack técnica

- **Framework:** Next.js 15 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Banco / Auth / Storage:** Supabase
- **Deploy:** Vercel
- **Versionamento:** GitHub
- **Modelo de instalação:** Multi-instância (uma stack completa por cliente)

---

## 3. Papéis e permissões

### Papéis
- **`admin`** (time interno) — acesso completo.
- **`corretor`** — acesso de leitura geral; pode criar/cancelar reservas próprias; pode cadastrar/editar clientes que reservou.

### Resumo de permissões

| Recurso | Admin | Corretor |
|---|---|---|
| Empreendimentos | CRUD | Leitura |
| Unidades | CRUD | Leitura |
| Clientes | CRUD | Criar; editar os seus |
| Reservas | CRUD em qualquer | Criar; cancelar as suas |
| Vendas | CRUD | Leitura |
| Arquivos do empreendimento | CRUD | Leitura/download |
| Usuários | CRUD (convidar/editar/desativar) | — |

Permissões reforçadas em duas camadas:
1. **Row Level Security (RLS)** no Supabase.
2. **Server Actions** no Next.js (defesa em profundidade).

Sem cadastro aberto. Admins convidam usuários via Supabase Auth.

---

## 4. Modelo de dados

### `profiles`
Estende `auth.users`. Não há signup público — usuários são criados pela tela `/usuarios` (admin) via Supabase Admin API, e um trigger Postgres cria automaticamente o registro em `profiles` após a inserção em `auth.users`. O papel é definido pelo admin no momento do convite.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK, FK auth.users) | |
| `nome` | text | |
| `email` | text | espelha auth.users.email |
| `telefone` | text | nullable |
| `role` | enum `admin` \| `corretor` | default `corretor` |
| `ativo` | boolean | default true |
| `criado_em` | timestamptz | default now() |

### `empreendimentos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `nome` | text | obrigatório |
| `tipo` | enum `vertical` \| `horizontal` | obrigatório |
| `status` | enum `lancamento` \| `em_obras` \| `pronto` | default `em_obras` |
| `endereco` | text | |
| `cidade` | text | |
| `estado` | text (2 chars) | |
| `cep` | text | |
| `data_entrega_prevista` | date | nullable |
| `foto_capa_url` | text | nullable, Supabase Storage |
| `descricao` | text | nullable |
| `qtd_andares` | int | só vertical, nullable |
| `qtd_unidades_por_andar` | int | só vertical, nullable |
| `planta_implantacao_url` | text | só horizontal, nullable |
| `criado_em` | timestamptz | |
| `atualizado_em` | timestamptz | |

### `unidades`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `empreendimento_id` | uuid (FK) | cascade delete |
| `identificador` | text | ex: "Apto 302", "Casa 15" |
| `andar` | int | só vertical, nullable |
| `posicao_no_andar` | text | só vertical, ex: "A" ou "1" |
| `area_privativa_m2` | numeric(10,2) | nullable |
| `area_total_m2` | numeric(10,2) | nullable |
| `qtd_quartos` | int | nullable |
| `qtd_suites` | int | nullable |
| `qtd_banheiros` | int | nullable |
| `qtd_vagas` | int | nullable |
| `preco_total` | numeric(14,2) | nullable |
| `valor_condominio` | numeric(10,2) | nullable, sigiloso |
| `status` | enum `disponivel` \| `reservada` \| `vendida` | default `disponivel` |
| `foto_url` | text | nullable |
| `coordenadas_poligono` | jsonb | só horizontal: `{x, y, width, height}` em % |
| `criado_em` | timestamptz | |
| `atualizado_em` | timestamptz | |

### `clientes`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `nome` | text | obrigatório |
| `cpf` | text | nullable |
| `telefone` | text | obrigatório |
| `email` | text | nullable |
| `renda` | numeric(14,2) | nullable |
| `tipo_renda` | enum `individual` \| `composta` | default `individual` |
| `nome_2` | text | nullable, só se composta |
| `cpf_2` | text | nullable, só se composta |
| `renda_2` | numeric(14,2) | nullable, só se composta |
| `criado_por` | uuid (FK profiles) | |
| `criado_em` | timestamptz | |

### `reservas`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `unidade_id` | uuid (FK) | |
| `cliente_id` | uuid (FK) | |
| `corretor_id` | uuid (FK profiles) | preenchido pela server action |
| `valor_proposta_total` | numeric(14,2) | obrigatório |
| `valor_entrada` | numeric(14,2) | nullable |
| `forma_pagamento` | enum `a_vista` \| `financiado` | nullable |
| `observacoes` | text | nullable |
| `status` | enum `ativa` \| `cancelada` \| `convertida_em_venda` | default `ativa` |
| `criado_em` | timestamptz | |
| `atualizado_em` | timestamptz | |

Histórico de propostas/reservas de uma unidade = consulta filtrada por `unidade_id`.

### `vendas`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `unidade_id` | uuid (FK) | |
| `cliente_id` | uuid (FK) | |
| `corretor_id` | uuid (FK profiles) | |
| `reserva_origem_id` | uuid (FK reservas) | nullable |
| `valor_final` | numeric(14,2) | |
| `data_venda` | date | |
| `criado_em` | timestamptz | |

### `arquivos_empreendimento`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK) | |
| `empreendimento_id` | uuid (FK) | |
| `nome` | text | nome amigável |
| `url` | text | Supabase Storage |
| `tamanho_bytes` | bigint | |
| `tipo_mime` | text | |
| `enviado_por` | uuid (FK profiles) | |
| `criado_em` | timestamptz | |

### Storage (buckets)
- `empreendimentos` — fotos de capa, plantas de implantação (público para leitura).
- `unidades` — fotos/plantas de unidades (público para leitura).
- `arquivos` — documentos do empreendimento (privado; acesso via signed URL).

---

## 5. Telas

### 5.1 `/login`
- Email + senha + botão "Entrar".
- "Esqueci minha senha" (fluxo nativo Supabase).
- Logo + nome da empresa do branding.

### 5.2 `/` — Dashboard
- Barra superior com logo, nome, menu de usuário.
- Cards de resumo numérico (clicáveis, filtram a grade):
  - Empreendimentos
  - Total de unidades
  - Disponíveis
  - Reservadas
  - Vendidas
- Filtros: busca por nome, dropdown cidade, dropdown status.
- Grid de cards de empreendimentos:
  - Foto de capa
  - Nome
  - Cidade · Status (badge)
  - Barra de progresso de vendas (`X% vendido (N de M)`)
- Botão "Novo empreendimento" (admin only).

### 5.3 `/empreendimentos/[id]` — Detalhe do empreendimento
- Header: foto de capa, nome, endereço, cidade, data de entrega, contadores de status.
- Botões (admin): "Editar empreendimento", "Nova unidade".
- Tabs: **Mapa** | **Lista** | **Arquivos**.
- Aba **Mapa**:
  - Vertical: grid `qtd_andares × qtd_unidades_por_andar`, andares de baixo pra cima.
  - Horizontal: planta de fundo + retângulos clicáveis nas unidades.
  - Legenda de cores sempre visível.
  - Filtros sobre o mapa: status, faixa de preço, qtd quartos. Unidades fora do filtro = opacidade reduzida (não somem).
- Aba **Lista**: tabela com filtros e busca.
- Aba **Arquivos**: lista, botão "Adicionar arquivo" (admin).
- Click numa unidade → painel lateral.

### 5.4 Painel lateral da unidade (drawer)
- Foto, todos os dados.
- Valor do condomínio só visível ao admin.
- Status com badge colorido.
- Ações conforme papel e status:
  - **Copiar mensagem** (todos)
  - **Enviar WhatsApp** (todos) — abre `wa.me/?text=...`
  - **Reservar** (todos) — só se `disponivel`
  - **Cancelar reserva** — admin sempre; corretor só se for o `corretor_id` da reserva ativa
  - **Marcar como vendida** (admin) — só se `reservada`
  - **Editar / Excluir** (admin)
- Aba "Histórico" — todas as reservas dessa unidade.

### 5.5 Modal "Reservar unidade"
- Seção Cliente:
  - Autocomplete "Selecionar cliente existente" (busca por nome/CPF)
  - Ou: nome*, CPF, telefone*, email, renda, tipo de renda (toggle composta → revela nome_2, cpf_2, renda_2)
- Seção Proposta: valor total*, entrada, forma (à vista/financiado), observações.
- Botões: Cancelar | Confirmar reserva.
- Pós-confirmação: atualiza status da unidade, fecha modal, toast de sucesso.

### 5.6 Modal "Editar cliente"
- Acessível pelo painel lateral (histórico) ou em telas administrativas.
- Mesmos campos do cliente, editável conforme permissão.

### 5.7 `/empreendimentos/novo` e `.../[id]/editar` (admin)
- Formulário: nome, endereço, cidade, estado, CEP, data de entrega, tipo, status, foto de capa, descrição.
- Se vertical: `qtd_andares`, `qtd_unidades_por_andar`. Ao salvar pela primeira vez, gera as unidades placeholder (`1A, 1B, ..., NX`) com status `disponivel` e campos numéricos `null`. No mapa essas placeholders aparecem como "Sem dados" (cinza) até admin preencher pelo formulário de edição.
- Se horizontal: upload opcional da planta de implantação (pode adicionar depois).

### 5.8 `/empreendimentos/[id]/unidades/novo` e `.../editar` (admin)
- Formulário da unidade.
- Se horizontal: após salvar, abre editor "Desenhar área na planta" — admin clica e arrasta para criar um retângulo sobre a unidade; coordenadas salvas em % da imagem.

### 5.9 `/usuarios` (admin)
- Lista de usuários (nome, email, papel, status ativo).
- Botão "Convidar usuário" → modal (nome, email, papel) → envia convite via Supabase Auth (`signInWithOtp` + `inviteUserByEmail` admin API).
- Editar papel; ativar/desativar.

### 5.10 Navegação
- Barra superior: logo + nome (link para home), "Empreendimentos", "Usuários" (admin), menu do usuário (nome, "Sair").

### 5.11 Mobile
- Sidebar → menu hamburger.
- Cards em coluna única.
- Painel lateral → modal de tela cheia.
- Tabela de unidades → lista de cards.

---

## 6. Mapa visual

### Vertical (prédio)
- Geração automática do grid ao criar empreendimento vertical.
- N andares × M unidades por andar; nomeação `{andar}{posição}` (ex: `1A`).
- Cada célula = botão colorido por status.
- Hover: tooltip com identificador, área, preço.
- Click: abre painel lateral.
- Estados visuais:
  - 🟢 Disponível: `#16a34a`
  - 🟡 Reservada: `#eab308`
  - 🔴 Vendida: `#dc2626`
  - ⚪ Sem dados (vertical placeholder): `#e5e7eb` com badge "Sem dados"
- Andares de baixo para cima (térreo embaixo).

### Horizontal (casas/lotes)
- Upload de planta de implantação (imagem). Sem planta = fallback para tab Lista.
- Cadastro de unidades é manual (sem geração automática).
- Editor de áreas:
  - Mostra a planta como fundo.
  - Admin clica e arrasta para desenhar um **retângulo** sobre a unidade.
  - Coordenadas salvas como percentual (`{x, y, width, height}` ∈ [0,1]) — sobrevive a resize.
  - Pode arrastar/redimensionar depois.
- Visualização:
  - Retângulos translúcidos (opacidade 50%) na cor do status.
  - Identificador centralizado no retângulo.
  - Hover aumenta opacidade e adiciona borda.
- Unidades cadastradas sem `coordenadas_poligono` aparecem em barra lateral "Sem posição na planta".
- Fallback: se nenhuma unidade tem coordenadas, mostra tab Lista por padrão.

### Filtros
- Barra acima do mapa: status (checkboxes), faixa de preço (slider), qtd de quartos.
- Unidades fora do filtro ficam com opacidade ~20% (mantém a forma do mapa).

---

## 7. Upload de arquivos (componente padronizado)

### Pontos de uso
1. Foto de capa do empreendimento (modo único, imagem).
2. Planta de implantação (modo único, imagem).
3. Foto da unidade (modo único, imagem).
4. Arquivos do empreendimento (modo múltiplo, qualquer tipo permitido).

### Comportamento
- Drag-and-drop + click para seleção.
- Preview imediato (thumb pra imagem, ícone + nome pra documento).
- Barra de progresso durante upload.
- Validação client + server:
  - Imagens: até 10 MB, png/jpg/webp.
  - Documentos: até 50 MB, pdf/png/jpg/doc/docx/xls/xlsx.
- Mensagens de erro em português.
- Botão de remover no preview.

### Backend
- Upload via server action que valida tamanho/tipo e grava em Supabase Storage.
- Buckets `empreendimentos` e `unidades` públicos (leitura).
- Bucket `arquivos` privado — acesso via signed URL.

---

## 8. Mensagem WhatsApp

### Template padrão (em `config/branding.ts`)

```
🏢 *{empreendimento}* — {unidade}

📐 {areaPrivativa}m² privativa
🛏️ {quartos} quartos{suites}
🚿 {banheiros} banheiros
🚗 {vagas}

💰 R$ {precoTotal} (R$ {precoM2}/m²)

📍 {endereco}, {cidade}/{estado}
🗓️ Entrega: {dataEntrega}

{footer}
```

### Lógica
- Função `gerarMensagemUnidade(unidade, empreendimento, branding)`.
- Campos vazios são omitidos da string final (não aparece "🛏️ - quartos").
- Pluralização automática ("1 vaga" vs "2 vagas").
- Moeda BR (`R$ 580.000,00`), datas BR (`Dez/2026`).
- Suítes entre parênteses só se > 0.

### Botões
- **📋 Copiar mensagem** — `navigator.clipboard.writeText()` + toast "Mensagem copiada!".
- **📱 WhatsApp** — abre `https://wa.me/?text=<encoded>` em nova aba.

---

## 9. White-label (branding por cliente)

### `/public/branding/`
- `logo.png` (ou .svg)
- `logo-dark.png` (opcional)
- `favicon.ico`

### `config/branding.ts`

```ts
export const branding = {
  companyName: "MVP Engenharia",
  logoPath: "/branding/logo.png",
  logoDarkPath: "/branding/logo-dark.png",
  primaryColor: "#0066cc",
  whatsappFooter: "— MVP Engenharia",
  whatsappTemplate: `... (template acima) ...`,
};
```

- Tailwind config lê `primaryColor` e gera variações (`primary-50` até `primary-900`).
- Aplicação em todos os botões, links, badges, etc.

### Fluxo de instalação para novo cliente
Documentado em `README.md`:
1. Clonar repo, renomear.
2. Criar novo projeto Supabase, copiar URL + anon key + service key.
3. Rodar migrations (`supabase db push`).
4. Criar projeto Vercel, conectar GitHub, configurar env vars.
5. Substituir arquivos em `/public/branding/`.
6. Editar `config/branding.ts`.
7. Criar primeiro admin via SQL no Supabase (insert em `auth.users` + `profiles`).
8. Deploy.

---

## 10. Estrutura de pastas

```
mvp-unidades/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── empreendimentos/
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── editar/page.tsx
│   │   │       └── unidades/
│   │   │           ├── novo/page.tsx
│   │   │           └── [unidadeId]/editar/page.tsx
│   │   └── usuarios/page.tsx
│   ├── api/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── upload/FileUploader.tsx
│   ├── mapa/
│   │   ├── MapaVertical.tsx
│   │   ├── MapaHorizontal.tsx
│   │   └── EditorAreas.tsx
│   ├── empreendimento/
│   │   ├── CardEmpreendimento.tsx
│   │   ├── HeaderEmpreendimento.tsx
│   │   └── PainelUnidade.tsx
│   ├── reserva/
│   │   ├── ModalReserva.tsx
│   │   └── ModalEditarCliente.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── AuthGuard.tsx
├── lib/
│   ├── supabase/{server,client,middleware}.ts
│   ├── actions/{empreendimentos,unidades,reservas,clientes,arquivos,usuarios}.ts
│   ├── mensagem-whatsapp.ts
│   ├── formatacao.ts
│   └── permissoes.ts
├── config/branding.ts
├── types/database.ts
├── public/branding/{logo.png,logo-dark.png,favicon.ico}
├── supabase/
│   ├── migrations/{0001_schema,0002_rls,0003_seeds}.sql
│   └── config.toml
├── middleware.ts
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── README.md
└── .env.local.example
```

---

## 11. Segurança

- **RLS habilitado em todas as tabelas.**
- Policies por papel conforme tabela na seção 3.
- Server Actions revalidam usuário e papel antes de qualquer mutação importante.
- Senha mínima e fluxo de recuperação via Supabase Auth.
- Bucket `arquivos` privado com signed URLs (acesso só para logados).
- Não exposição do `valor_condominio` em queries usadas pelo corretor (filtro de seleção no client + check no server).
- Sem cadastro aberto: apenas admin convida usuários via Supabase Admin API.

---

## 12. Comportamento mobile

- Layout responsivo via Tailwind breakpoints.
- Navbar colapsa em hamburger.
- Grid de cards: 4 col (xl), 3 col (lg), 2 col (md), 1 col (sm).
- Painel lateral vira modal full-screen no mobile.
- Tabelas viram listas de cards no mobile.
- Mapa vertical mantém grid (rolagem horizontal se necessário).
- Mapa horizontal usa `object-fit` + zoom/pan suaves (libs leves tipo `react-zoom-pan-pinch`).

---

## 13. Critérios de sucesso

- Time interno cadastra empreendimento, gera grid de unidades, preenche dados, faz upload de arquivos e foto de capa.
- Corretor loga, vê empreendimentos, abre detalhe, reserva uma unidade preenchendo cliente + proposta.
- "Copiar mensagem" coloca texto formatado no clipboard, colável no WhatsApp sem ajustes.
- Admin marca reserva como venda; histórico fica preservado.
- Empreendimento horizontal exibe planta com áreas clicáveis após admin desenhar.
- Pessoa não-técnica do time interno consegue operar o painel sem treinamento prolongado (≤ 30 min).
- Instalação para um novo cliente (substituição de branding + setup Supabase/Vercel) ≤ 1 hora de trabalho técnico.

---

## 14. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Admin esquecer de desenhar áreas no modo horizontal | Fallback automático para tab Lista; barra "sem posição" no editor |
| RLS mal configurado vazar dados | Server actions revalidam + testes manuais de cada papel |
| Senha fraca / vazamento de credenciais | Política Supabase + convite por admin apenas |
| Upload de arquivo malicioso | Validação tipo MIME + tamanho; bucket privado para documentos |
| Diferenças entre instalações divergirem com o tempo | README de update + tag de versão; ferramenta de diff de migrations |

---

## 15. Fora do MVP — backlog futuro

- Página pública de unidade (acesso sem login).
- Polígonos livres no editor de áreas.
- Comissão de parceria visível por corretor.
- Reservas com prazo e aprovação.
- Relatórios e gráficos de vendas.
- Notificações por e-mail / WhatsApp em eventos chave.
- Importação de unidades via planilha (CSV/XLSX).
- Multi-tenancy compartilhado (se um dia o modelo de venda mudar).
