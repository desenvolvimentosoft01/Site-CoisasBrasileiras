# Coisas Brasileiras

E-commerce de porcelanas decorativas, presentes, artigos religiosos e perfumaria, com site público para venda e painel administrativo completo para o dono da loja.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui (`@base-ui/react`)
- **PostgreSQL**, acessado com SQL puro via `pg` (sem ORM) — ver `lib/db.ts`
- **Mercado Pago** (Checkout Pro) e **PagBank** (checkout hospedado) para pagamento
- **Bling** para emissão manual de NF-e a partir do pedido (`lib/bling.ts`)
- **Nodemailer** (Gmail) para notificações por e-mail
- **BrasilAPI** para autopreenchimento de endereço por CEP
- **Cloudinary** (opcional) para upload de imagem — se não configurado, cai pro
  disco local (`public/uploads/`), o que é suficiente em VPS com disco
  persistente (ver seção Deploy)

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

Painel em `/admin/entrar`. Não existe usuário/senha padrão pré-cadastrado (de
propósito — uma senha fixa documentada aqui ficaria exposta pra qualquer um
com acesso ao repositório). Crie o primeiro administrador rodando:

```bash
node scripts/criar-admin.js "Seu Nome" seu-email@dominio.com
```

O script pede a senha direto no terminal (não aparece na tela, não fica
salva em nenhum arquivo) e grava só o hash no banco. Rode de novo a
qualquer momento pra resetar a senha de um e-mail existente.

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

Plano de hospedagem: **VPS na Hostinger**, com PostgreSQL rodando no mesmo
servidor (self-hosted) e o Next.js como processo contínuo (`npm run build` +
`npm run start`), não serverless.

Isso significa que o disco é persistente de verdade — o upload de imagem de
produto em `public/uploads/` (comportamento padrão, sem configuração extra)
funciona sem custo adicional. O Cloudinary (`lib/cloudinary.ts`) existe só
como opção **desligada por padrão** — só ativa se algum dia quiser CDN/
otimização automática de imagem; não é necessário nesse plano de hospedagem.

Se um dia o site for pra um ambiente serverless (Vercel, por exemplo), aí sim
o Cloudinary passa a ser obrigatório (defina `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) e o banco precisa ser um
Postgres gerenciado na nuvem (Neon, Supabase etc.), já que a VPS não seria
mais o servidor.
