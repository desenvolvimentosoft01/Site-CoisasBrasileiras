# Configuração do app no Bling — Coisas Brasileiras

Guia pra criar o app de integração no painel de developers do Bling
(developer.bling.com.br) na hora de configurar um cliente novo.

## Endpoints que o sistema realmente usa

Levantado direto do código (`lib/bling.ts`, `lib/bling-marketplace.ts`):

- `POST /notas-fiscais` — emite NF-e a partir do pedido
- `POST /nfe/{id}/enviar` — envia a nota criada pra Sefaz
- `GET /notas-fiscais/{id}` — consulta situação da nota
- `POST /nfe/{id}/cancelar` — cancela NF-e emitida
- `GET /notas-fiscais?...` — lista notas (emitidas e de entrada, usado no
  painel de pendências e na aba "Notas do Bling" da Entrada de NF)
- `GET /pedidos/vendas?...` e `GET /pedidos/vendas/{id}` — importação de
  pedidos de Mercado Livre/Shopee (`lib/bling-marketplace.ts`)

## Escopos a marcar no app

- **Notas Fiscais** (leitura e escrita) — emissão, envio, cancelamento e
  consulta de NF-e de venda.
- **Pedidos de Vendas** (leitura) — importação de pedidos de marketplace.

## Escopos que NÃO precisa marcar

O sistema não usa nenhum desses — cada um é mantido localmente e não
sincroniza com o Bling:

- Estoque / Produtos
- Financeiro / Contas
- Compras / Fornecedores (a Entrada de NF só lê a lista de notas via o
  mesmo endpoint de notas fiscais, nunca grava nada de volta no Bling)
- Contatos / Clientes

## Tipo de aplicação

Marcar como **autenticação via OAuth2** (não "credenciais estáticas") — o
sistema implementa o fluxo completo com refresh token automático
(`lib/bling.ts`), token fica em `TAB_INTEGRACAO_BLING` e renova sozinho
quando expira em menos de 60s.

## Depois de criar o app

1. Copiar `Client ID` e `Client Secret` do app criado.
2. Preencher em `BLING_CLIENT_ID` / `BLING_CLIENT_SECRET` no `.env` de
   produção (essas são credenciais do app, nível de deploy — não mudam
   por cliente que usa o mesmo app registrado).
3. Conectar a loja específica em Configurações > Integrações > Bling no
   painel admin (fluxo OAuth, gera o token da loja).

## Observação sobre fiscal/tributário

O Bling é o único responsável por CFOP e cálculo de tributação (ICMS,
PIS, COFINS) — depende do regime tributário cadastrado lá. Nosso sistema
só envia `classificacaoFiscal` (NCM) por item quando o produto tem NCM
cadastrado; não guarda nem calcula alíquota nenhuma. Ver `DOCS/plano_erp.md`
pra mais contexto dessa decisão.

Entrada de NF lançada manualmente no nosso sistema (sem XML que já tenha
sido puxado pelo Bling da Sefaz) fica só no controle interno de
estoque/custo — não aparece automaticamente na escrituração fiscal do
Bling. Ver `DOCS/tecnico.md` (seção Integrações) pra mais detalhes.

## Observação sobre catálogo de produto e estoque — AVISAR O CLIENTE

O catálogo de produtos **não sincroniza com o Bling em nenhum sentido**.
Na hora de emitir a NF-e, os itens (nome, NCM, quantidade, valor) são
enviados direto na requisição de criação da nota, sem precisar que o
produto exista cadastrado no Bling antes (`lib/bling.ts`, comentário na
função `emitirNotaFiscalBling`) — de propósito, pra manter o Bling
restrito a emissão fiscal, sem virar espelho do catálogo.

Consequência prática: o **estoque de verdade** (o que controla
disponibilidade no site, baixa por venda, alerta de mínimo) vive só no
nosso banco (`TAB_PRODUTO.estoque`). O Bling tem o próprio controle de
estoque interno dele, mas como o catálogo não é sincronizado, esse
número **fica desatualizado/incompleto** — não reflete a realidade.

**Isso precisa ser alinhado com o cliente antes de ir pra produção**:
ele (e qualquer outra pessoa com acesso ao painel do Bling) não deve
usar o Bling pra conferir ou decidir estoque — a única fonte de verdade
é o nosso painel admin.
