# Coisas Brasileiras

E-commerce de porcelanas decorativas, presentes, artigos religiosos e perfumaria, com site público para venda e painel administrativo completo para o dono da loja.

O sistema atende **duas lojas no mesmo CNPJ** — Coisas Brasileiras e Porcelanas Brancas — separadas por domínio (ver `DOMINIO_BRANCO` nas variáveis de ambiente). Identidade, contato e cores são configurados por loja; frete, taxas e integrações são compartilhados.

## O que o sistema faz

**Loja (site público)**: catálogo com filtros, carrinho, checkout com frete real por CEP, área do cliente, Clube por assinatura, cupons, avaliações e conformidade com a LGPD (consentimento e autoatendimento de dados).

**Painel administrativo**:

- **Vendas** — Venda Balcão (PDV com leitor de código de barras), Pedido de Venda, Orçamentos e importação de pedidos de Mercado Livre/Shopee vindos do Bling
- **Produtos** — cadastro, categorias, estoque, reajuste de preços em lote
- **Compras** — cotação, pedido de compra, entrada de NF (manual ou por importação de XML, com guarda do arquivo e geração do DANFE), fornecedores
- **Financeiro** — contas a pagar e a receber, geradas automaticamente a partir de compras e pedidos
- **Relatórios** — vendas, lucro/DRE, estoque e auditoria de alterações
- **Fiscal** — emissão e cancelamento de NF-e pelo Bling a partir do pedido, acompanhamento da situação da nota e exportação dos XMLs/DANFEs do período para o contador
- **Notas Fiscais** — central com as notas de entrada e de saída na mesma lista, imprimindo o DANFE e baixando o XML de qualquer uma sem abrir o Bling

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui (`@base-ui/react`)
- **PostgreSQL**, acessado com SQL puro via `pg` (sem ORM) — ver `lib/db.ts`
- **Mercado Pago** (Checkout Pro + assinatura recorrente do Clube via PreApproval) para pagamento
- **Frenet** para cotação real de frete por CEP (várias transportadoras) e validação de código de rastreio
- **Bling** para emissão/cancelamento de NF-e a partir do pedido (`lib/bling.ts`)
- **@react-pdf/renderer** para gerar PDF no servidor (orçamento e DANFE)
- **JSZip** para o lote de XMLs/DANFEs exportado para a contabilidade
- **bwip-js** para o código de barras Code 128C da chave de acesso no DANFE
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

Crie um banco chamado `coisas_brasileiras` e rode **todas** as migrations em `migrations/`, na ordem numérica (hoje vai de `000_schema_inicial.sql` até `062_movimentacao_estoque.sql`), com `psql` ou outro cliente de sua preferência:

```bash
for f in migrations/0*.sql; do psql -U postgres -d coisas_brasileiras -f "$f"; done
```

As migrations não são aplicadas automaticamente — sempre que houver uma nova, rode manualmente. Para ver o que já foi aplicado num banco específico, use `migrations/consultar_migrations_aplicadas.sql`. Detalhe de cada migration em `DOCS/tecnico.md`.

### 4. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `DB_POOL_MAX` | Opcional (padrão 3). Conexões que cada instância do app abre. O limite do pooler do Supabase é compartilhado por todas as instâncias — com o valor alto demais, elas se atropelam e as queries falham com `EMAXCONNSESSION` |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (usada em callbacks do Mercado Pago) |
| `DOMINIO_BRANCO` | Domínio que serve a marca Porcelanas Brancas — qualquer outro host cai na marca Coisas Brasileiras. Sem essa variável, o sistema só serve uma das lojas |
| `AUTH_SECRET` | Valor aleatório para assinar o cookie de sessão do admin |
| `MERCADOPAGO_ACCESS_TOKEN` / `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Credenciais do Mercado Pago (painel de developers) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura secreta do webhook do Mercado Pago (opcional em dev) |
| `EMAIL_USER` / `EMAIL_PASS` | Conta Gmail e senha de app para envio de e-mails transacionais |
| `EMAIL_NOTIFICACOES_ADMIN` | E-mail que recebe cópia de notificações internas (novo pedido pago) |
| `FRENET_TOKEN` / `FRENET_API_URL` | Cotação real de frete e validação de rastreio (opcional — sem isso, cai na tabela de faixas por região/peso) |
| `BLING_CLIENT_ID` / `BLING_CLIENT_SECRET` | Credenciais OAuth do app Bling (emissão/cancelamento de NF-e) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Upload de imagem em ambiente serverless (opcional em VPS com disco persistente) |
| `CRON_SECRET` | Autentica as chamadas dos crons (`/api/cron/*`) feitas pelo crontab da VPS. **Obrigatório**: sem ele as rotas de cron recusam qualquer chamada (401) |

Frenet, Mercado Pago e Email também podem ser configurados direto pelo painel admin (Configurações > Integrações), sem precisar mexer em variável de ambiente — as variáveis acima servem de fallback/bootstrap inicial.

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
public/icones/    ícones do sistema em SVG, um arquivo por função (ver components/admin/icone.tsx)
migrations/       scripts SQL numerados, aplicados manualmente
scripts/          utilitários de linha de comando (criar admin, backup, disparo dos crons)
DOCS/             documentação técnica, manual do sistema e guias de integração
```

## Deploy

**Produção**: **VPS na Hostinger**, com o Next.js como processo contínuo
(`npm run build` + `npm run start`), não serverless. O banco é PostgreSQL no
Supabase (acessado pelo pooler). Nesse cenário o disco é persistente de
verdade — o upload de imagem de produto em `public/uploads/` (comportamento
padrão, sem configuração extra) funciona sem custo adicional, e o Cloudinary
(`lib/cloudinary.ts`) fica **desligado por padrão**, só necessário se algum
dia quiser CDN/otimização automática de imagem.

As páginas da loja (`app/(loja)/layout.tsx`) são forçadas a renderizar sob
demanda (`export const dynamic = "force-dynamic"`) — sem isso, o
`npm run build` tenta pré-renderizar essas páginas e precisa do banco
disponível nesse momento, o que quebra se o build rodar numa máquina sem
acesso direto ao Postgres de produção (ex: pipeline de deploy separado do
servidor final).

As tarefas agendadas (`/api/cron/*`) são disparadas pelo **crontab da própria
VPS**, via `scripts/cron-vps.sh` — ver `DOCS/cron-vps.md` para a configuração.

Ver `DOCS/tecnico.md` para o modelo de dados e os módulos completos.
