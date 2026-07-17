# Coisas Brasileiras

E-commerce de porcelanas decorativas, presentes, artigos religiosos e perfumaria, com site público para venda e painel administrativo completo para o dono da loja.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui (`@base-ui/react`)
- **PostgreSQL** local, acessado com SQL puro via `pg` (sem ORM) — ver `lib/db.ts`
- **Mercado Pago** (Checkout Pro) para pagamento
- **Nodemailer** (Gmail) para notificações por e-mail
- **BrasilAPI** para autopreenchimento de endereço por CEP

## Rodando localmente

### 1. Pré-requisitos

- Node.js 18+
- PostgreSQL instalado e rodando localmente

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o banco de dados

Crie um banco chamado `coisas_brasileiras` e rode as migrations, na ordem, com `psql` ou outro cliente de sua preferência:

```bash
psql -U postgres -d coisas_brasileiras -f migrations/000_schema_inicial.sql
psql -U postgres -d coisas_brasileiras -f migrations/001_admin_padrao.sql
psql -U postgres -d coisas_brasileiras -f migrations/002_expansao_recursos.sql
```

As migrations não são aplicadas automaticamente — sempre que houver uma nova, rode manualmente na ordem.

### 4. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (usada em callbacks do Mercado Pago) |
| `AUTH_SECRET` | Valor aleatório para assinar o cookie de sessão do admin |
| `MERCADOPAGO_ACCESS_TOKEN` / `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Credenciais do Mercado Pago (painel de developers) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura secreta do webhook do Mercado Pago (opcional em dev) |
| `EMAIL_USER` / `EMAIL_PASS` | Conta Gmail e senha de app para envio de e-mails transacionais |
| `EMAIL_NOTIFICACOES_ADMIN` | E-mail que recebe cópia de notificações internas (novo pedido pago) |

### 5. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Login do admin

Painel em `/admin/entrar`. Usuário padrão (semeado pela migration `001_admin_padrao.sql`):

- **E-mail:** `admin@coisasbrasileiras.com`
- **Senha:** `[SENHA-REMOVIDA]` (trocar após o primeiro acesso)

## Estrutura do projeto

```
app/(loja)/       site público (home, catálogo, produto, carrinho, checkout, minha conta)
app/admin/        painel administrativo
app/api/          rotas de API (públicas e do admin)
components/loja/  componentes do site público
components/admin/ componentes do painel
lib/              banco de dados, autenticação, e-mail, máscaras, integrações
migrations/       scripts SQL numerados, aplicados manualmente
```

## Deploy

O upload de imagens de produto (`app/api/admin/upload`) hoje salva em disco local (`public/uploads/`), o que **não funciona em produção na Vercel** (ambiente serverless, sem disco persistente). Antes do deploy final, é necessário migrar esse armazenamento para um serviço externo (Cloudinary, S3, etc.).
