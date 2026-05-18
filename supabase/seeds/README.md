# Seeds

Dados de exemplo para demonstração. Não são migrations — rode manualmente quando precisar popular um ambiente de demo. Cada arquivo é idempotente (pode rodar várias vezes).

## Pipa Aruã Resort Village

Resort village horizontal em Tibau do Sul/RN com 13 blocos (Náutico, Veleiro, Falésias, Areia, Atlântico, Oceano, Enseada, Concha, Coral, Farol, Maré, Brisa, Duna) × 8 casas (4 térreas + 4 duplex) = **104 unidades**.

Identificador segue o padrão da apresentação do cliente: `<Bloco>-<Número>`, ex.: `Farol-203`.

Distribuição de status: ~70% disponíveis, ~15% reservadas, ~15% vendidas (determinística, não aleatória).

Também popula **15 clientes fake**, **15 reservas ativas** (para as unidades `reservada`) e **16 vendas** (com reserva convertida + registro em `vendas`, para as unidades `vendida`). Cada reserva/venda fica associada a um corretor existente em `profiles` (distribuição round-robin entre todos os admins/corretores ativos).

### Pré-requisito

Precisa ter **pelo menos 1 usuário** (admin ou corretor) ativo em `profiles`. Se não houver, o script aborta com mensagem clara. Crie um usuário antes (via UI de `/usuarios` ou diretamente no Supabase Auth).

### Como rodar

**Via Supabase SQL Editor** (mais simples):

1. Abra o painel do projeto no Supabase.
2. Vá em **SQL Editor → New query**.
3. Cole o conteúdo de `pipa-arua.sql` e rode.

**Via `psql`** (se tiver `DATABASE_URL` local apontando pro Supabase):

```bash
psql "$DATABASE_URL" -f supabase/seeds/pipa-arua.sql
```

**Via Supabase CLI** (se o projeto estiver linkado):

```bash
supabase db execute --file supabase/seeds/pipa-arua.sql
```

### Resultado esperado

Ao final, a query de conferência deve retornar algo como:

| nome                     | total_unidades | disponiveis | reservadas | vendidas | reservas_ativas | vendas_registradas |
|--------------------------|----------------|-------------|------------|----------|-----------------|--------------------|
| Pipa Aruã Resort Village | 104            | 73          | 15         | 16       | 15              | 16                 |

### Re-rodar

O script começa apagando o empreendimento e os clientes do seed (`email like '%@example.com'`). Como `empreendimentos → unidades → reservas/vendas` cascateia, tudo é recriado do zero. É seguro rodar novamente após mudanças.
