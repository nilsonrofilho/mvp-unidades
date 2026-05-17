# Instalação para novo cliente

Cada cliente tem **sua própria** stack: repositório, Supabase e Vercel. Tempo total estimado: ~1 hora.

## Passo a passo

### 1. Clone e renomeie o repositório

```bash
git clone <repo> painel-CLIENTE
cd painel-CLIENTE
git remote remove origin
# Crie novo repo no GitHub e plugue
git remote add origin git@github.com:SUA_ORG/painel-CLIENTE.git
git push -u origin main
```

### 2. Crie projeto Supabase

- Acesse https://supabase.com → New Project
- Anote `Project URL`, `anon key`, `service_role key`
- No SQL Editor, rode em ordem (cada um numa query separada):
  - `supabase/migrations/0001_schema.sql`
  - `supabase/migrations/0002_rls.sql`
  - `supabase/migrations/0003_storage.sql`

### 3. Crie o primeiro admin

Via Supabase Dashboard → Authentication → Users → "Add user":
- E-mail: e-mail do admin
- Senha: defina uma
- Marque "Auto Confirm User"
- Em "User Metadata (JSON)", cole:
  ```json
  { "nome": "Nome do Admin", "role": "admin" }
  ```

Verifique no SQL Editor:
```sql
select id, nome, email, role from public.profiles;
```
Deve retornar 1 linha com `role = admin`.

**Se você esqueceu o metadata** e o user foi criado como `corretor`, corrija com:
```sql
update public.profiles set role = 'admin' where email = 'admin@cliente.com.br';
```

### 4. Substitua o branding

Em `/public/branding/`, coloque os arquivos do cliente:
- `logo.png` — logo (PNG/SVG)
- `logo-dark.png` — versão para fundo escuro (opcional)
- `favicon.ico` — ícone da aba

Em `config/branding.ts`, edite:
- `companyName` — nome da empresa
- `primaryColor` — cor primária em hex
- `whatsappFooter` — rodapé da mensagem de WhatsApp
- `whatsappTemplate` — formato da mensagem (placeholders entre `{}`)

Em `app/globals.css`, atualize `--brand: #...;` para a mesma cor primária.

### 5. Configure Vercel

- https://vercel.com → New Project → Importe o repo
- Em Environment Variables, configure:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (secret)
- Deploy

### 6. Domínio

Em Settings → Domains, adicione o domínio do cliente (ex: `painel.cliente.com.br`) e configure o DNS conforme instruções da Vercel.

### 7. Convide outros usuários

Logue como admin, acesse `/usuarios`, clique em "Convidar usuário".

## Checklist pós-instalação

- [ ] Login funciona
- [ ] Conseguiu criar 1 empreendimento de teste
- [ ] Upload de foto funciona
- [ ] Conseguiu criar 1 unidade
- [ ] Conseguiu reservar
- [ ] "Copiar mensagem" copia texto formatado
- [ ] Logo e cores aparecem corretas
- [ ] `/usuarios` acessível (admin)

## Notas

- O sistema usa `next dev --webpack` / `next build --webpack` em vez do Turbopack padrão do Next 16. Em algumas máquinas darwin/arm64 o binário SWC do Turbopack falha; webpack é estável.
- Buckets de Storage usados: `empreendimentos`, `unidades` (públicos para leitura), `arquivos` (privado, signed URL).
