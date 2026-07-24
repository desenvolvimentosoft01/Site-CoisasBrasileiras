# Documento técnico — Coisas Brasileiras

Documento interno de arquitetura, modelo de dados e módulos. Para setup local e stack resumida, ver `README.md`.

## Modelo de dados (migrations)

As migrations ficam em `migrations/*.sql`, numeradas e aplicadas manualmente na ordem (nunca automaticamente — ver `_migracoes_aplicadas`, criada na 004, que registra o que já rodou em cada banco).

| Migration | O que adiciona |
|---|---|
| `000_schema_inicial.sql` | Schema base: `TAB_CATEGORIA`, `TAB_PRODUTO`, `TAB_PRODUTO_CATEGORIA` (N:N), `TAB_PRODUTO_IMAGEM`, `TAB_CLIENTE`, `TAB_ENDERECO`, `TAB_PEDIDO` (status com CHECK), `TAB_PEDIDO_ITEM`, `TAB_USUARIO_ADMIN` (papel admin/operador) |
| `001_admin_padrao.sql` | Não cria tabela — documenta que o primeiro admin é criado via `node scripts/criar-admin.js` (sem senha padrão fixa no repo, por segurança) |
| `002_expansao_recursos.sql` | `TAB_PRODUTO`: sku, peso/dimensões, estoque_minimo. `TAB_PEDIDO`: rastreio, transportadora, subtotal, frete, desconto, cupom_id. Cria `TAB_BANNER`, `TAB_CUPOM`, `TAB_CONFIGURACAO` (chave/valor) |
| `003_tema_e_textos.sql` | `TAB_CONFIGURACAO`: cor_primaria, nome_loja, texto_rodape |
| `004_controle_migrations.sql` | Cria `_migracoes_aplicadas` com backfill de 000-004 |
| `005_auditoria.sql` | Cria `TAB_AUDITORIA` (usuário, tela, ação, antes/depois em JSONB, ip, user_agent) |
| `006_venda_balcao.sql` | `TAB_PEDIDO` ganha `origem` (site/balcao); cliente/endereço passam a ser opcionais; cliente/telefone avulso para venda sem cadastro |
| `007_financeiro.sql` | Cria `TAB_CONTA` (contas a pagar/receber, distinto de `TAB_PEDIDO`) |
| `008_frete_faixas.sql` | Cria `TAB_FRETE_FAIXA` (frete configurável por região IBGE + peso, substitui valor fixo) |
| `009_gateway_pagamento.sql` | `TAB_PEDIDO` ganha `gateway_pagamento` (mercadopago/pagbank) |
| `010_bling.sql` | Cria `TAB_INTEGRACAO_BLING` (tokens, isolada de `TAB_CONFIGURACAO` por segurança); `TAB_PEDIDO` ganha campos de nota fiscal |
| `011_cliente_balcao.sql` | `TAB_CLIENTE.email`/`senha_hash` deixam de ser obrigatórios (cadastro rápido de balcão) |
| `012_tipos_entrega.sql` | Cria `TAB_TIPO_ENTREGA` (retirada, entrega local, Correios); `TAB_PEDIDO` ganha `tipo_entrega_id` |
| `013_orcamentos.sql` | Cria `TAB_ORCAMENTO` e `TAB_ORCAMENTO_ITEM` (documento pré-venda, convertido em pedido balcão quando aprovado) |
| `014_cliente_inativo.sql` | `TAB_CLIENTE` ganha `ativo` (inativar sem apagar histórico) |
| `015_usuario_login_e_ultimo_acesso.sql` | `TAB_USUARIO_ADMIN` ganha `usuario` (login curto opcional) e `ultimo_login` |

## Módulos do painel admin (`app/admin/*`)

Todos os `page.tsx` são Server Components que consultam o banco direto (`query()`) e passam os dados iniciais para um componente client `*Conteudo` em `components/admin/`.

- **dashboard** — indicadores gerais (produtos ativos, pedidos hoje, faturamento do mês, pendentes, estoque baixo) + últimos pedidos.
- **venda-balcao** — PDV: produtos, clientes, tipos de entrega e grade combinada de pedidos site+balcão.
- **pedidos** — lista todos os pedidos (site + balcão), com cliente via LEFT JOIN (cai pro nome avulso quando não tem conta).
- **orcamentos** — documento pré-venda (`TAB_ORCAMENTO`), convertido em pedido balcão quando aprovado.
- **clientes** — cadastro, com flag de quem veio do site (tem `senha_hash`) vs. cadastrado só pelo admin.
- **produtos**, **categorias**, **estoque** — CRUD de catálogo.
- **cupons**, **banners** — CRUD de marketing.
- **financeiro** — contas a pagar/receber (`TAB_CONTA`) + faturamento do site. Restrito a papel "admin".
- **relatorios** — vendas por período, produtos mais vendidos, resumo de estoque.
- **auditoria** — últimos 500 registros de `TAB_AUDITORIA`. Restrito a "admin".
- **usuarios** — CRUD de usuários do admin. Restrito a "admin".
- **configuracoes** — edita `TAB_CONFIGURACAO` (contato, frete, aparência) e mostra status da conexão Bling (só para "admin").

## Integrações externas (`lib/`)

- **`lib/mercadopago.ts`** — Checkout Pro. Env: `MERCADOPAGO_ACCESS_TOKEN`. Usado no checkout (cria preferência) e no webhook (consulta pagamento).
- **`lib/pagbank.ts`** — gateway alternativo, checkout hospedado. Env: `PAGBANK_TOKEN`, `PAGBANK_API_URL` (sandbox por padrão).
- **`lib/bling.ts`** — OAuth2, só para emissão de NF-e (não sincroniza estoque/financeiro). Env: `BLING_CLIENT_ID`, `BLING_CLIENT_SECRET`. Token fica em `TAB_INTEGRACAO_BLING` (não em `TAB_CONFIGURACAO`, por segurança) e renova sozinho via refresh_token quando expira em <60s.
- **`lib/email.ts`** — Nodemailer/Gmail. Env: `EMAIL_USER`, `EMAIL_PASS` (sem elas, envio é pulado silenciosamente). Templates: pedido criado, pedido pago, novo pedido (aviso ao admin), status atualizado.
- **`lib/cloudinary.ts`** — upload assinado via API REST (sem SDK). Só necessário em ambiente serverless (Vercel) sem disco persistente; em VPS cai pro disco local.

## Autenticação e autorização

- **`lib/auth.ts`** — sessão via cookie assinado com HMAC-SHA256 (Web Crypto, compatível com Edge Runtime do middleware). Segredo: `AUTH_SECRET` (obrigatório). Duas sessões independentes: admin (`admin_sessao`) e cliente (`cliente_sessao`).
- **`lib/auth-servidor.ts`** — helpers pra rotas de API: `exigirSessao()` (401 sem sessão admin), `exigirAdmin()` (403 se papel != admin), `exigirSessaoCliente()` (401 sem sessão cliente).
- **`middleware.ts`** — protege `/admin/*` (exceto `/admin/entrar`); redireciona pra login sem sessão. Rotas `/admin/usuarios`, `/admin/auditoria`, `/admin/financeiro` exigem papel "admin" — "operador" é redirecionado pro dashboard.
- **admin vs operador**: coluna CHECK em `TAB_USUARIO_ADMIN`. "admin" tem acesso irrestrito; "operador" é bloqueado tanto no middleware (nível de rota) quanto via `exigirAdmin()` (nível de API) e em partes condicionais da UI.

## Sistema de abas MDI do admin

- **`lib/abas-admin-store.ts`** — store Zustand persistido em `localStorage`. "Dashboard" é fixa e nunca fecha. `abrirAba` evita duplicata por path; `fecharAba` retorna o path anterior pra quem chamou decidir se navega.
- **`components/admin/tab-bar.tsx`** — ao mudar de rota, detecta a seção do menu lateral e abre a aba automaticamente (mesmo em acesso direto/F5) — a URL é sempre a fonte da verdade, a barra só reflete o histórico da sessão. Tem setas de rolagem nas pontas (aparecem só quando há overflow real, via `ResizeObserver`).

## Cálculo de frete

Toda a lógica está em `lib/configuracoes.ts` (não existe pasta `lib/frete`):

1. `REGIAO_POR_UF` mapeia cada UF pra uma das 5 regiões IBGE.
2. `calcularFrete({ subtotal, pesoKg, estado })`: se `subtotal >= frete_gratis_acima_de` (configurável), frete grátis.
3. Senão, busca em `TAB_FRETE_FAIXA` a faixa (região + peso) mais específica; peso mínimo assumido é 0.3kg se o produto não tiver `peso_kg` cadastrado.
4. Sem faixa cadastrada, cai no `frete_valor_base` fixo (nunca trava o checkout).

É provisório — pensado pra trocar só o "miolo" da função quando a loja tiver contrato com Correios/transportadora (cotação real via API).

## Fluxo de pedido e pagamento

**Checkout (`app/api/checkout/route.ts`)**:
1. Exige sessão de cliente e reconfirma que está `ativo` no banco (sessão pode ter sido emitida antes de uma inativação).
2. Dentro de uma transação: grava endereço, revalida cada item com `FOR UPDATE` (preço e estoque recalculados no servidor, nunca confia no client), calcula frete real, revalida cupom com `FOR UPDATE` (evita estourar `uso_maximo` em checkouts simultâneos), grava pedido (`aguardando_pagamento`) e itens. **Estoque não é baixado aqui.**
3. Fora da transação, cria a preferência/checkout no gateway escolhido (Mercado Pago ou PagBank); erro do gateway retorna 502 genérico, sem vazar detalhe interno.
4. Dispara e-mail de "pedido criado" sem bloquear a resposta.

**Webhook Mercado Pago (`app/api/webhooks/mercadopago/route.ts`)**:
1. Valida assinatura (`x-signature`/`x-request-id` vs `MERCADOPAGO_WEBHOOK_SECRET` via HMAC + comparação de tempo constante) — pulado se o segredo não estiver configurado (ex: dev).
2. Sempre rebusca o pagamento na API do MP por id (nunca confia só no corpo da notificação).
3. Dentro de transação, trava o pedido (`FOR UPDATE`); se o status já é o mesmo, não faz nada (idempotência contra reenvio).
4. Ao virar "pago" pela primeira vez, baixa estoque de cada item e dispara e-mails ao cliente e ao admin.
5. Sempre responde `{ recebido: true }`, mesmo com erro interno, pra evitar reenvio infinito do MP por erro nosso.

`app/api/webhooks/pagbank/route.ts` espelha a mesma lógica para o gateway PagBank.

## Deploy

Ver seção "Deploy" do `README.md` para o estado atual (VPS Hostinger planejada como produção; ambiente Vercel + Neon usado hoje como homologação, com região `gru1` configurada em `vercel.json` para ficar perto do banco).
