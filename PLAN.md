# PLAN — Coisas Brasileiras: site + gestão

> Este documento descreve **como** e **em que ordem** transformar o admin atual
> num painel de gestão completo (site + venda balcão), inspirado no InMenteGestao
> (`C:\InMenteGestao\in-mente-gestao-sistema`), adaptado para a arquitetura deste
> projeto (Postgres local via `pg`, sem Supabase, single-tenant).

## Contexto e decisão de arquitetura

Diferente do InMenteGestao (multi-tenant, um Supabase por cliente), aqui site e
admin **já são o mesmo app Next.js e o mesmo banco Postgres**. Isso significa que
"produto cadastrado no admin aparece no site em tempo real" e "venda balcão baixa
o mesmo estoque do site" **não exigem sincronização** — é a mesma tabela `TAB_PRODUTO`
lida por ambos. Não vamos replicar a arquitetura multi-tenant do InMenteGestao,
só os módulos e as telas.

Tabelas que já existem e serão **reaproveitadas** (não recriar):
- `TAB_PRODUTO`, `TAB_CATEGORIA` — estoque único, compartilhado entre site e balcão.
- `TAB_CLIENTE` — hoje é o cliente do site (login com `senha_hash`). Venda balcão
  vai reusar essa tabela; cliente vinculado no balcão fica opcional (cadastro
  rápido por nome/telefone, sem exigir senha/login).
- `TAB_PEDIDO` / `TAB_PEDIDO_ITEM` — hoje só para o site. Precisa de uma coluna
  `origem` (`'site' | 'balcao'`) e `forma_pagamento` já existe. Status do balcão
  não passa por `aguardando_pagamento` — nasce direto como `pago`.
- `TAB_USUARIO_ADMIN` — já tem `papel` (`admin`/`operador`). Reaproveitar
  integralmente para o módulo de usuários; só falta a UI de gestão (CRUD) e checar
  `papel` nas rotas sensíveis (financeiro, usuários).

Tabelas **novas**, específicas do InMenteGestao a portar:
- `TAB_CONTA` (financeiro: contas a pagar/receber).
- `TAB_AUDITORIA` (log de alterações).

## Controle de migrations aplicadas

Igual ao InMenteGestao: `004_controle_migrations.sql` já cria `_migracoes_aplicadas`
(versão + data) com backfill das migrations 000-003. **Toda migration nova a
partir de agora (005 em diante) termina com
`INSERT INTO _migracoes_aplicadas (versao) VALUES ('0XX') ON CONFLICT (versao) DO NOTHING;`**
— assim dá pra rodar `migrations/consultar_migrations_aplicadas.sql` a qualquer
momento e ver exatamente o que já foi aplicado neste banco, sem precisar
conferir coluna por coluna manualmente.

Não portar: `orcamentos`, tudo relacionado a iFood, `loja_id`/multi-loja (aqui é
uma loja só), planos/limite de usuários (SaaS), Supabase RLS/Realtime/Auth Admin
API (substituídos por checagem de sessão via cookie já existente em `lib/auth.ts`
e `lib/auth-servidor.ts`).

## Fases

### Fase 1 — Clientes (admin) e Usuários com papéis
- Tela `/admin/clientes`: listar/editar clientes cadastrados (reusa `TAB_CLIENTE`).
  Cadastro rápido (nome + telefone, sem senha) usado pela venda balcão.
- Tela `/admin/usuarios`: CRUD de `TAB_USUARIO_ADMIN` (nome, email, papel,
  ativo/inativo). Só `papel = 'admin'` acessa.
- Reforçar checagem de papel nas rotas admin sensíveis que forem criadas nas
  fases seguintes (financeiro, usuários).

### Fase 2 — Auditoria [concluída]
- Migration `005_auditoria.sql`: tabela `TAB_AUDITORIA` (usuario_id, usuario_nome,
  tela, acao, tabela, registro_id, dados_antes/depois JSONB, ip, user_agent, criado_em).
- `lib/auditoria.ts` + `POST /api/admin/auditoria` (grava a partir da sessão do
  cookie, fire-and-forget, nunca bloqueia a ação principal).
- Tela `/admin/auditoria` (restrita a `papel = 'admin'`, protegida no middleware):
  lista os últimos 500 registros com busca e detalhe (antes/depois em JSON).
- Instrumentado em cadastro/edição/exclusão de: Produtos, Categorias, Cupons,
  Banners, Clientes, Usuários. Nunca registra senha nos dados de auditoria.

### Fase 3 — Venda Balcão [concluída]
- Migration `006_venda_balcao.sql`: `TAB_PEDIDO` ganha `origem` (`site`/`balcao`),
  `cliente_id` e `endereco_id` passam a ser opcionais (venda balcão não exige
  conta no site nem endereço de entrega), e `cliente_nome_avulso`/
  `cliente_telefone_avulso` para cadastro rápido sem criar conta em `TAB_CLIENTE`.
- Endpoint transacional `POST /api/admin/venda-balcao/finalizar` (transação
  via `lib/db.ts#transacao`: trava as linhas de `TAB_PRODUTO` com `FOR UPDATE`,
  valida estoque, grava `TAB_PEDIDO` + `TAB_PEDIDO_ITEM`, baixa o estoque e
  registra a auditoria — tudo atômico, aborta e reverte se qualquer item não
  tiver estoque suficiente).
- `GET /api/admin/venda-balcao/produtos`: produtos ativos com categoria e
  primeira imagem, para a grade.
- Tela `/admin/venda-balcao`: grade de produtos filtrável por categoria e busca,
  carrinho com controle de quantidade limitado ao estoque, seletor de cliente
  (busca em clientes já cadastrados ou cadastro rápido nome/telefone sem conta),
  modal de pagamento (dinheiro/pix/crédito/débito) e finalização.
- Sem venda por peso/fração nem `ModalPesagem` na v1 (produtos daqui são unidade
  fechada — porcelanas, presentes) — avaliar depois se o catálogo mudar.

### Fase 4 — Financeiro [concluída]
- Migration `007_financeiro.sql`: `TAB_CONTA` (tipo pagar/receber, descricao,
  valor, vencimento, pago, pago_em, categoria, observacao) — sem `loja_id`.
- `GET/POST /api/admin/financeiro/contas` e `PUT/DELETE /api/admin/financeiro/contas/[id]`
  — restritos a `papel = 'admin'` (`exigirAdmin`).
- Tela `/admin/financeiro` (server component, como o dashboard): total a pagar/
  receber em aberto, faturamento do site no mês, contas vencendo em 7 dias e
  contas atrasadas.
- Tela `/admin/financeiro/contas`: CRUD completo, com atalho pra marcar
  pago/em aberto direto na grade (clique no status).
- Rota `/admin/financeiro` protegida no middleware (só admin, redireciona
  operador pro dashboard). Instrumentado com auditoria.
- Sem `transacoes`/view `resumo_financeiro_hoje` do InMenteGestao — o resumo é
  calculado com queries agregadas direto sobre `TAB_CONTA` + `TAB_PEDIDO`.

### Fase 5 — Ajustes finais [concluída]
- Dashboard: novo card "Vendas balcão hoje" (quantidade + faturamento), badge
  "Balcao" nos últimos pedidos daquela origem.
- Relatórios (`GET /api/admin/relatorios`): nova query `vendasPorOrigem`
  (pedidos pagos agrupados por site/balcão), com tabela na tela.
- Corrigido um problema descoberto ao ligar os pontos: `/admin/pedidos` (lista
  e detalhe) usavam `JOIN` obrigatório com `TAB_CLIENTE`/`TAB_ENDERECO` — como
  venda balcão pode ter `cliente_id`/`endereco_id` nulos (Fase 3), isso fazia
  pedidos de balcão sumirem da lista e 404 na tela de detalhe. Trocado para
  `LEFT JOIN` com `COALESCE` pro nome/telefone avulso, e a tela de detalhe
  mostra "Venda balcão - sem entrega" no lugar do endereço quando não há.
- Permissões: `/admin/financeiro`, `/admin/usuarios` e `/admin/auditoria` já
  ficaram restritas a `papel = 'admin'` desde que foram criadas (fases 1, 2 e 4).

## Estado atual do site (levantado em 2026-07-22, antes das fases 6-9)

- **Pagamento:** só Mercado Pago (Checkout Pro) — hospedado por eles, já aceita
  Pix/cartão/débito/boleto. O site nunca vê nem guarda número de cartão.
- **Frete:** regra fixa configurável (`frete_valor_base` + grátis acima de X em
  `TAB_CONFIGURACAO`), sem consulta real à API dos Correios.
- **Rastreio:** manual — admin digita `codigo_rastreio`/`transportadora` na tela
  do pedido (`TAB_PEDIDO`, colunas já existentes desde a migration 002).
- **E-mail transacional:** já funciona de ponta a ponta (`lib/email.ts`) — pedido
  recebido, pagamento confirmado (via webhook do Mercado Pago) e a cada troca de
  status (em separação/enviado/entregue), incluindo código de rastreio no corpo
  do e-mail. Depende de `EMAIL_USER`/`EMAIL_PASS` configurados.
- **Nota fiscal:** nada integrado ainda — `nota_fiscal_url` existe na tabela mas
  é só um campo de texto solto, sem nenhuma emissão automática.

### Fase 6 — Frete real por região/peso [concluída]
- Cliente ainda não tem contrato/cartão de postagem com os Correios (pré-requisito
  pra API oficial de preços e prazos) — decidido em conversa fazer uma tabela
  configurável por região/peso agora, trocável pela API oficial depois sem
  mexer nos chamadores.
- Migration `008_frete_faixas.sql`: `TAB_FRETE_FAIXA` (regiao, peso_min_kg,
  peso_max_kg, valor, prazo_dias), seedada com valores de partida por região
  do IBGE (Norte/Nordeste/Centro-Oeste/Sudeste/Sul).
- `lib/configuracoes.ts#calcularFrete()`: assinatura nova `{ subtotal, pesoKg, estado }`
  → `{ valor, prazoDias }`. Resolve UF → região, busca a faixa pelo peso real
  somado dos itens (`peso_kg` de `TAB_PRODUTO`, mínimo de 0,3kg se não
  cadastrado), aplica frete grátis acima de X por cima, e cai pro valor fixo
  configurado se não achar faixa pra região/peso (nunca trava o checkout).
- `/api/frete` (POST) e `/api/checkout` recalculam peso e subtotal a partir do
  banco — nunca confiam em peso/preço vindo do client.
- Tela `/admin/configuracoes/frete-faixas`: admin ajusta valor/prazo por região
  e peso, com link a partir da aba Frete em Configurações.
- Rastreio automático via API dos Correios continua fora de escopo (mantido
  manual, conforme decidido); e a cotação real da API oficial fica pendente
  até a loja ter o contrato — quando tiver, só troca o miolo de `calcularFrete()`.

### Fase 7 — PagBank como segundo gateway de pagamento [código pronto, falta credencial real pra testar]
- Confirmado via Context7 (docs oficiais atuais) que `POST /checkouts` é o
  endpoint certo de checkout hospedado — mesmo princípio de segurança do
  Mercado Pago: o cartão do cliente nunca passa pelo nosso servidor.
- Migration `009_gateway_pagamento.sql`: `TAB_PEDIDO.gateway_pagamento`
  (`mercadopago`/`pagbank`); pedidos antigos do site marcados como
  `mercadopago` (único gateway até então).
- `lib/pagbank.ts`: `criarCheckoutPagBank()` (cria o checkout, devolve
  `redirect_url`) e `consultarCheckoutPagBank()` (reconsulta autenticada,
  nunca confia no corpo do webhook). Consolida itens+frete-desconto num único
  item no PagBank porque a documentação não confirma suporte a item com preço
  negativo (diferente do Mercado Pago, que aceita).
- `POST /api/checkout` agora recebe `gateway` (`mercadopago`/`pagbank`) e
  ramifica pra criar a preferência certa; grava `gateway_pagamento` no pedido.
- Novo webhook `app/api/webhooks/pagbank/route.ts`, espelhando exatamente o
  padrão do Mercado Pago: nunca confia no corpo da notificação, sempre
  reconsulta a API do PagBank com nosso token antes de agir; transação com
  `FOR UPDATE` e checagem de status atual pra idempotência (reenvio do
  PagBank não baixa estoque duas vezes); só mexe em pedidos com
  `gateway_pagamento = 'pagbank'`.
- Checkout do site (`app/(loja)/checkout/page.tsx`) ganhou seletor visual
  Mercado Pago vs PagBank antes de confirmar o pedido.
- **Pendente:** o formato exato do payload do webhook do PagBank (quais campos
  de `id` ele manda em cada evento) não pôde ser 100% confirmado pela
  documentação consultada — o código tenta os campos mais prováveis
  (`id`, `checkout.id`, `data.id`, `charges[0].id`) mas isso **precisa ser
  validado contra o sandbox real** assim que a conta PagBank existir, antes
  de considerar essa fase testada de ponta a ponta.

### Fase 8 — Integração Bling (emissão de NF-e) [código pronto, falta credencial real pra testar]
- Confirmado via Context7 (docs oficiais atuais): base `https://api.bling.com.br/Api/v3`,
  `POST /notas-fiscais` (cria a nota) → `POST /nfe/{id}/enviar` (manda pra
  autorização na Sefaz) → `GET /notas-fiscais/{id}` (busca DANFE/PDF já
  autorizados). OAuth2 authorization-code flow (`/oauth/authorize`, `/oauth/token`
  com Basic Auth de client_id:client_secret) não veio explícito na documentação
  consultada — implementado com o padrão conhecido do Bling v3, **precisa validar
  contra o app real assim que existir**.
- Migration `010_bling.sql`: tabela isolada `TAB_INTEGRACAO_BLING` (access_token,
  refresh_token, expira_em) — de propósito **fora** de `TAB_CONFIGURACAO`, porque
  o `GET /api/admin/configuracoes` devolve todas as chaves de uma vez (usado pela
  tela de Configurações) e colocar segredo lá vazaria o token nessa resposta.
  `TAB_PEDIDO` ganha `bling_nota_id`, `bling_link_danfe`, `bling_link_pdf`.
- `lib/bling.ts`: fluxo OAuth completo (`montarUrlAutorizacaoBling`,
  `trocarCodigoPorTokenBling`, renovação automática via refresh_token quando o
  access_token está a menos de 1 min de expirar) + `emitirNotaFiscalBling()`.
- Rotas: `GET /api/admin/bling/conectar` (só admin, inicia OAuth com proteção
  CSRF via cookie `state`), `GET /api/admin/bling/callback` (troca code por
  token), `GET /api/admin/bling/status` (só admin; **nunca** devolve os tokens,
  só `{ conectado, expiraEm }`), `POST /api/admin/pedidos/[id]/emitir-nfe`
  (gatilho manual, nunca automático).
- Botão "Emitir NF-e" na tela do pedido (`/admin/pedidos/[id]`) — mostra
  link de DANFE/PDF depois de emitida; erro do Bling nunca apaga nem altera
  dado nenhum do pedido, só mostra a mensagem pro admin tentar de novo.
- Aba "Integrações" em `/admin/configuracoes` — conectar/reconectar o Bling e
  ver status.
- **Pendente:** endpoint/`grant_type` do OAuth e o formato exato do payload de
  `/notas-fiscais` (nomes de campo podem variar por versão) precisam ser
  validados contra o sandbox/conta real do Bling assim que existir — o código
  segue a documentação oficial disponível, mas nunca foi executado de ponta a
  ponta contra a API de verdade.

### Fase 9 — Revisão de segurança (obrigatória antes de considerar tudo pronto)
- Rodar a skill `revisar_seguranca` do projeto sobre tudo que for implementado
  nas fases 4, 6, 7 e 8 antes de dar como concluído.
- Conferir especificamente: nenhum dado de cartão/pagamento sensível é
  persistido no banco (só IDs de transação e status); segredos (Mercado Pago,
  PagBank, Bling, e-mail) só em variáveis de ambiente, nunca no código nem em
  log; validação de assinatura/autenticidade em todos os webhooks (Mercado
  Pago, PagBank); rate limiting nas rotas públicas sensíveis (`lib/rate-limit.ts`
  já existe, conferir cobertura); dados de cliente (CPF, endereço, telefone)
  só acessíveis por sessão autenticada correta (cliente vê só o próprio
  pedido, admin/operador conforme papel).
- Código novo comentado em português, sem nunca expor segredo/senha em
  comentário ou log.

### Fase 10 — Redesign do admin no estilo InMenteGestao [concluída]
- `components/admin/admin-shell.tsx` reescrito: sidebar cinza-escuro (`bg-slate-900`,
  largura 56) com grupos colapsáveis, acento âmbar (`amber-500`) no item ativo,
  topo com breadcrumb, barra de abas MDI (`bg-slate-800`) — mesma cara do
  InMenteGestao. **Tema sempre claro fixo** (decisão igual à deles: não seguir o
  tema escuro do Windows do operador).
- Corrigido o bug de layout que bagunçava a tela ao rolar: o shell agora é
  `h-screen overflow-hidden` com o `<main>` em `min-h-0 overflow-y-auto` — só o
  conteúdo rola, a sidebar fica fixa (antes era `min-h-screen`, que deixava a
  página inteira crescer e a sidebar "acabar" no meio da rolagem).
- Botão "Área administrativa" movido do rodapé para o topo do site (ícone no
  header, em `components/loja/header.tsx`; removido de `components/loja/footer.tsx`).
- Performance: todas as telas do admin que antes eram client-only com
  "Carregando..." (Produtos, Categorias, Cupons, Banners, Clientes, Usuários,
  Auditoria, Financeiro/Contas, Frete-faixas, Venda Balcão, Pedidos, Relatórios,
  Configurações) foram convertidas para **Server Component** que busca os dados
  no servidor e passa prontos para um componente `*-conteudo.tsx` de
  interatividade. Fim do flash de "Carregando..." a cada navegação.

## Backup do banco de dados

Dois mecanismos, **ambos prontos e desligados** — só ativar quando o projeto
virar um cliente em produção. Qual usar depende de onde o banco fica:

- **Banco LOCAL na VPS (cenário atual planejado — Hostinger):** usar
  `scripts/backup-local.sh`. Roda dentro da própria VPS via `cron` (o GitHub
  Actions, que roda na nuvem, não alcança um Postgres local). **Para ativar:**
  na VPS, `chmod +x scripts/backup-local.sh`, depois `crontab -e` e adicionar a
  linha comentada no topo do script (backup diário às 03:00). Mantém os últimos
  14 backups automaticamente.
- **Banco na NUVEM (só se um dia migrar pra Neon/Supabase):** usar
  `.github/workflows/backup-db.yml`. **Para ativar:** descomentar as **linhas
  25-26** do arquivo (o bloco `schedule:` / `- cron: '0 6 * * *'`) e cadastrar o
  secret `DATABASE_URL_BACKUP` no GitHub. Enquanto desligado, ainda dá pra rodar
  manualmente pela aba Actions (botão "Run workflow").

## Hospedagem (Hostinger) — o que já sabemos e o que falta

Verificado nos cabeçalhos HTTP de `https://inmentegestao.com.br` (site do
InMenteGestao já hospedado pelo cliente): `platform: hostinger`, `panel: hpanel`,
`X-Powered-By: Next.js`, `x-nextjs-cache: HIT`, `x-nextjs-prerender: 1`.
**Conclusão: a Hostinger do cliente roda Next.js de verdade** (SSR + cache),
então site + admin do Coisas Brasileiras funcionarão nessa hospedagem.

**Ponto em aberto (decidido resolver na hora do deploy):** o InMenteGestao usa
banco na **nuvem** (Supabase), não Postgres local. Ou seja, está confirmado que
a Hostinger roda o app, mas **não** está confirmado que ela roda um Postgres
local no mesmo plano. Duas saídas quando for publicar:
- **Recomendado:** usar Postgres gerenciado na nuvem (Neon/Supabase) — mesma
  arquitetura que o InMenteGestao já usa, funciona garantido com a Hostinger, e
  o backup via `.github/workflows/backup-db.yml` passa a valer. Só trocar a
  `DATABASE_URL` pra apontar pro banco na nuvem e rodar as migrations lá.
- **Alternativa:** Postgres local, só se o plano Hostinger permitir instalar/
  rodar Postgres e der acesso a `cron` (aí o backup certo é
  `scripts/backup-local.sh`). Precisa confirmar no painel antes.

## Fora de escopo (confirmado com o cliente)
- Orçamentos.
- iFood / outros marketplaces.
- Multi-loja.
- Venda por peso/fração (avaliar depois, se o catálogo mudar).
- Rastreio automático via API dos Correios (mantido manual por enquanto).
- Bling além de NF-e (sem sincronizar estoque/financeiro com o Bling).

## Convenções
- Idioma do código, telas e commits: português (mesmo padrão do InMenteGestao e
  demais projetos).
- Migrations SQL numeradas em `migrations/`, aplicadas manualmente na ordem —
  nunca editar uma já aplicada, sempre criar uma nova.
- Toda escrita feita pelo admin (produtos, categorias, contas, venda balcão)
  passa a registrar auditoria a partir da Fase 2.
