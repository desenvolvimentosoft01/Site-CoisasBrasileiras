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
| `016_categoria_imagem.sql` | `TAB_CATEGORIA` ganha `imagem_url` (foto ilustrativa na grade de categorias da home) |
| `017_feedbacks.sql` | Cria `TAB_FEEDBACK` (depoimentos de cliente curados pelo admin, exibidos na home) |
| `018_canal_venda.sql` | `TAB_PEDIDO` ganha `canal` (site/whatsapp/instagram/balcao) — complementa `origem`, sem tabela de cadastro separada |
| `019_subcategorias.sql` | `TAB_CATEGORIA` ganha `categoria_pai_id` (auto-relacionamento — categoria sem pai é principal, com pai é subcategoria) |
| `020_fornecedores_compras.sql` | Cria `TAB_FORNECEDOR`, `TAB_COMPRA`, `TAB_COMPRA_ITEM`. `TAB_PRODUTO` ganha `custo` (custo médio ponderado, atualizado a cada compra recebida) |
| `021_bling_cancelamento.sql` | `TAB_PEDIDO` ganha `bling_nota_cancelada_em` (fecha o fluxo: emitir + cancelar NF-e) |
| `022_produto_ncm.sql` | `TAB_PRODUTO` ganha `ncm` — enviado por item na emissão de NF-e (não sincroniza cadastro com o Bling) |
| `023_clube_assinatura.sql` | `TAB_PRODUTO` ganha `preco_clube`. Cria `TAB_ASSINATURA_CLUBE` (assinatura recorrente via Mercado Pago PreApproval) |
| `024_codigo_barras.sql` | `TAB_PRODUTO` ganha `codigo_barras` (GTIN/EAN) — leitor da Venda Balcão, campo `gtin` da NF-e, matching na importação de XML |
| `025_compra_bling_nota.sql` | `TAB_COMPRA` ganha `bling_nota_id` (cruza nota de entrada do Bling com a compra lançada localmente) |
| `026_avaliacoes_produto.sql` | Cria `TAB_AVALIACAO_PRODUTO` (avaliação de compra verificada, com aprovação do admin — diferente de `TAB_FEEDBACK`) |
| `027_notificacao_estoque.sql` | Cria `TAB_NOTIFICACAO_ESTOQUE` ("avise-me quando voltar ao estoque") |
| `028_lista_desejos.sql` | Cria `TAB_LISTA_DESEJOS` (favoritos do cliente) |
| `029_compra_vencimento_fornecedor_ie.sql` | `TAB_COMPRA` ganha `data_vencimento`; `TAB_FORNECEDOR` ganha `inscricao_estadual` |
| `030_integracao_segredos.sql` | Cria `TAB_INTEGRACAO_SEGREDO` (chave/valor, isolada como `TAB_INTEGRACAO_BLING`) — Frenet, Mercado Pago e Email passam a ser configuráveis pelo admin, sem depender só de variável de ambiente |
| `031_bling_ultimo_erro.sql` | `TAB_INTEGRACAO_BLING` ganha `ultimo_erro`/`ultimo_erro_em` (exibido no painel de pendências fiscais) |
| `032_bling_nota_notificada.sql` | Cria `TAB_BLING_NOTA_NOTIFICADA` (controla quais notas de entrada pendentes do Bling já geraram notificação, evita duplicar aviso) |
| `033_bling_notas_pendentes_count.sql` | `TAB_INTEGRACAO_BLING` ganha `notas_pendentes` (contador exibido no badge do menu do admin) |
| `034_sobre_nos_midia.sql` | Cria `TAB_SOBRE_NOS_MIDIA` (fotos/vídeos da galeria da página Sobre Nós) |
| `035_dedup_endereco_pedido.sql` | Sem nova coluna — corrige dados duplicados de endereço/pedido (reenvio de checkout) |
| `036_pedidos_marketplace.sql` | `TAB_PEDIDO` ganha canal `marketplace` (constraint) e `bling_pedido_id`; cria `TAB_BLING_PEDIDO_PENDENTE` — importação de pedidos do Mercado Livre/Shopee via Bling |
| `037_nfe_envio_status.sql` | `TAB_PEDIDO` ganha `bling_nota_email_enviada_em` e `nota_fiscal_whatsapp_enviada_em` (rastreia se a NF-e foi enviada ao cliente por cada canal) |
| `038_preco_clube_percentual.sql` | `TAB_PRODUTO` ganha `preco_clube_tipo` ('fixo'/'percentual') — preço do Clube pode ser cadastrado como desconto percentual em vez de valor fixo |
| `039_orcamento_aprovacao_publica.sql` | `TAB_ORCAMENTO` ganha `token_aprovacao`, `cliente_email`, `canal_resposta`, `observacao_cliente`, `enviado_email_em`, `respondido_em` — aprovação pública do orçamento por link (WhatsApp/e-mail), sem precisar logar no admin |
| `040_pedido_situacao_nfe.sql` | `TAB_PEDIDO` ganha `bling_nota_situacao`/`bling_nota_situacao_atualizada_em` (situação detalhada da NF-e, além do já existente cancelamento) |
| `041_pedido_compra.sql` | Cria `TAB_PEDIDO_COMPRA` e `TAB_PEDIDO_COMPRA_ITEM` (pedido de compra enviado ao fornecedor, antes da nota chegar); `TAB_COMPRA` ganha `pedido_compra_id` pra referenciar o pedido que originou a entrada |
| `042_cotacao.sql` | Cria `TAB_COTACAO` e `TAB_COTACAO_ITEM` (cotação de preço com fornecedor, etapa anterior ao Pedido de Compra) |
| `043_pedido_compra_desconto.sql` | `TAB_PEDIDO_COMPRA` ganha `desconto` |
| `044_compra_chave_acesso.sql` | `TAB_COMPRA` ganha `chave_acesso` (chave de 44 dígitos da NF-e, opcional — preenchida automaticamente ao importar XML ou digitada manualmente) |
| `045_habilitar_rls.sql` | Habilita RLS em todas as tabelas (fecha a exposição via PostgREST do Supabase; a app conecta direto com role que ignora RLS, então nada muda no site/admin) |
| `046_marca.sql` | Coluna `marca` (`colorido`/`branco`) em produto, categoria, banner e pedido — unifica Coisas Brasileiras e Porcelanas Brancas num sistema só |
| `047_marca_feedback_orcamento.sql` | `marca` em feedback e orçamento, completando a separação da 046 |
| `048_rls_policy_deny_all.sql` | Policy de negação explícita, fechando o aviso do Security Advisor do Supabase |
| `049_marca_sobre_nos.sql` | `marca` na galeria da página "Sobre nós" (as mídias apareciam nos dois sites) |
| `050_lgpd_consentimento.sql` | Guarda quando o cliente aceitou a Política de Privacidade (prova do consentimento, art. 8º da LGPD) |
| `051_unificar_config_contato.sql` | Contato e rodapé deixam de ser por marca e passam a valer para as duas lojas — **revertido pela 055** |
| `052_status_processando_pagamento.sql` | Adiciona `processando_pagamento` à constraint de status de `TAB_PEDIDO` (usado pelo checkout transparente) |
| `053_pedido_mercadopago_payment_id.sql` | `TAB_PEDIDO` guarda o id do pagamento no Mercado Pago, para permitir estorno automático ao cancelar |
| `054_compra_xml_nfe.sql` | `TAB_COMPRA` ganha `xml_nfe`, `data_emissao`, `valor_total_nota` e `serie` — o XML importado passa a ser guardado (guarda fiscal de 5 anos, exportação para o contador e geração do DANFE) |
| `055_contato_por_marca.sql` | Contato, rodapé e `cor_primaria` voltam a ser por marca, copiando os valores atuais para as duas — **reverte a 051** e corrige a cor primária, que existia nas duas tabelas ao mesmo tempo |
| `056_codigo_barras_interno.sql` | `TAB_PRODUTO` ganha `codigo_barras_interno`: o EAN deixa de ser obrigatório e o código gerado internamente (faixa de prefixo 2) nunca é enviado como GTIN na NF-e |
| `065_transportadoras.sql` | `TAB_TRANSPORTADORA` (com código sequencial e `codigo_servico_frenet`) + `TAB_PEDIDO.transportadora_id`. Antes era texto livre por pedido — "Correios", "correios" e "CORREIOS " no mesmo banco. A coluna de texto **continua existindo**: guarda o que foi digitado nos pedidos antigos e é o nome que vai no e-mail do cliente. A migration aproveita os nomes já digitados, cria um cadastro para cada e vincula os pedidos |
| `064_pedido_pago_em.sql` | `TAB_PEDIDO.pago_em`: a data em que o dinheiro entrou, que é o que o fluxo de caixa usa. Antes só existia `criado_em` — na venda balcão dá na mesma, mas no site o cliente pode fechar hoje e pagar o boleto três dias depois, e o caixa ficava errado nos dois dias. Backfill com `criado_em` nos pedidos já pagos |
| `063_permissao_por_tela.sql` | `TAB_USUARIO_PERMISSAO` (PK usuario_id + tela): guarda só as **exceções** ao padrão do papel. O catálogo de telas vive no código (`lib/telas-admin.ts`) e o banco registra quem foge dele — tela nova entra pelo catálogo, sem migration. Admin ignora a tabela: enxerga tudo por definição |
| `062_movimentacao_estoque.sql` | `TAB_ESTOQUE_MOVIMENTO`: histórico de toda alteração de estoque (compra recebida, venda, estorno de cancelamento, ajuste manual) com motivo, origem, quem fez e o saldo depois do movimento. O saldo continua em `TAB_PRODUTO.estoque` — esta tabela é o histórico ao lado, não a fonte do saldo |
| `061_custo_real_item_compra.sql` | `TAB_COMPRA_ITEM` passa a guardar a composição do custo (produto, ICMS-ST, IPI, frete rateado, seguro, outros, desconto). `custo_unitario` deixa de ser o preço do produto e passa a ser o **custo real**, que é o que alimenta o custo médio no recebimento — antes o Lucro/DRE mostrava margem maior que a real em nota com ST ou IPI |
| `060_recursos_do_plano.sql` | `TAB_RECURSO` (exceções do plano) e a chave `plano` em `TAB_CONFIGURACAO`: define quais módulos e integrações a instalação enxerga. Mercado Livre, Shopee e iFood nascem desligados neste cliente |
| `059_senha_provisoria.sql` | `TAB_USUARIO_ADMIN` ganha `senha_provisoria` e `senha_alterada_em`: senha criada ou resetada por outra pessoa vale só até o primeiro acesso, e o middleware bloqueia o painel até a troca. Usuários existentes não foram marcados |
| `058_codigo_sequencial_cadastros.sql` | Cada cadastro (produto, fornecedor, cliente, categoria, usuário, banner, feedback, conta, tipo de entrega, avaliação e mídia do Sobre Nós) ganha `codigo` sequencial próprio, gerado por *sequence* do Postgres e numerado retroativamente por ordem de cadastro — é por ele que o cliente procura o registro, e não pelo UUID interno. Cupom fica de fora: o código dele é o texto da promoção |
| `057_pedido_xml_nfe.sql` | `TAB_PEDIDO` ganha `xml_nfe` e os campos de identificação da nota de saída — o XML autorizado é baixado do Bling e guardado aqui, do mesmo jeito que a 054 fez com a entrada |

## Módulos do painel admin (`app/admin/*`)

Todos os `page.tsx` são Server Components que consultam o banco direto (`query()`) e passam os dados iniciais para um componente client `*Conteudo` em `components/admin/`.

- **dashboard** ("Visão Geral") — indicadores gerais (produtos ativos, pedidos hoje, faturamento do mês, pendentes, estoque baixo) + últimos pedidos (com canal, forma de pagamento e indicador de "provavelmente abandonado").
- **venda-balcao** — PDV: produtos (com leitor de código de barras e cadastro rápido), clientes, tipos de entrega e grade combinada de pedidos site+balcão.
- **pedidos** ("Pedido de Venda") — lista todos os pedidos (site + balcão + marketplace), com cliente via LEFT JOIN. Status "Pago" nunca é definido manualmente aqui — só pelo webhook do Mercado Pago; a tela restringe as transições possíveis conforme o status atual. Mostra a situação detalhada da NF-e no Bling (não só emitida/cancelada) e se ela já foi enviada ao cliente por e-mail e por WhatsApp. Pedidos de Mercado Livre/Shopee entram automaticamente via importação do Bling (canal `marketplace`, cron diário — ver `app/api/cron/importar-pedidos-marketplace`).
- **orcamentos** — documento pré-venda (`TAB_ORCAMENTO`), convertido em pedido balcão quando aprovado. Suporta aprovação pública por link (token único, sem precisar logar no admin) enviado por e-mail (com PDF anexado) ou WhatsApp.
- **clientes** — cadastro (aba, não modal), com endereço completo e busca automática por CEP (BrasilAPI). Flag de quem veio do site (tem `senha_hash`) vs. cadastrado só pelo admin. Exclusão física só é permitida sem pedido vinculado; havendo histórico, só inativar.
- **produtos**, **categorias**, **estoque** — CRUD de catálogo. Produto exige NCM e código de barras (GTIN/EAN, validado por dígito verificador). Preço do Clube pode ser fixo ou percentual de desconto (`preco_clube_tipo`).
- **precos** — reajuste de preços em massa (percentual ou valor fixo, com pré-visualização) ou edição direta de uma linha na grade. Restrito a papel "admin".
- **fornecedores** — cadastro, com endereço e Inscrição Estadual.
- **cotacoes** ("Cotação") — cotação de preço com um ou mais fornecedores (`TAB_COTACAO`/`TAB_COTACAO_ITEM`), etapa opcional antes do Pedido de Compra. Restrito a "admin".
- **pedidos-compra** ("Pedido de Compra") — pedido formal enviado ao fornecedor por e-mail ou WhatsApp (`TAB_PEDIDO_COMPRA`/`TAB_PEDIDO_COMPRA_ITEM`, com desconto), referenciado depois pela Entrada de NF quando a mercadoria chega. Restrito a "admin".
- **compras** ("Entrada de NF") — lançamento da entrada em si (manual ou por importação de XML de NF-e), com filtros por fornecedor/data/status/observação, painel de notas de entrada pendentes no Bling, e referência ao Pedido de Compra que originou a entrada. Atualiza custo médio ponderado e dá alta no estoque ao ser recebida. Chave de acesso da NF-e (44 dígitos) é preenchida automaticamente ao importar XML ou pode ser digitada manualmente em nota lançada sem XML.
- **cupons**, **banners**, **feedbacks**, **avaliacoes** — CRUD de marketing. Avaliações são de produto, feitas pelo cliente (compra verificada) e passam por aprovação do admin.
- **sobre-nos** — textos e galeria de fotos/vídeos (`TAB_SOBRE_NOS_MIDIA`) da página institucional Sobre Nós.
- **clube** — assinantes do clube (assinatura recorrente via Mercado Pago), gerida pelo próprio cliente + webhook — sem CRUD manual aqui.
- **financeiro** — contas a pagar/receber (`TAB_CONTA`) + faturamento do site. Restrito a papel "admin".
- **financeiro/fluxo-caixa** — entradas e saídas realizadas por data de pagamento (`lib/fluxo-caixa.ts`), por dia ou movimento a movimento, com saldo anterior e acumulado. Não tem tabela própria de propósito: caixa é leitura (venda paga + conta quitada), e duplicar isso criaria duas versões do mesmo fato. Conta em aberto não entra — é previsão, e fica em Contas.
- **relatorios** — vendas por período (com filtro por canal/status/categoria, vendas de hoje, produtos mais/menos vendidos), resumo de estoque (com filtro de estoque zerado), lucro/DRE.
- **auditoria** — últimos 500 registros de `TAB_AUDITORIA`. Restrito a "admin".
- **usuarios** — CRUD de usuários do admin. Restrito a "admin".
- **configuracoes** — edita `TAB_CONFIGURACAO` (contato, frete, aparência, custos/impostos) e as integrações (Bling, Mercado Pago, Frenet, Email), cada uma em sua própria aba (só para "admin").

## Integrações externas (`lib/`)

PagBank foi removido — todo pagamento hoje é só Mercado Pago.

- **`lib/mercadopago.ts`** — Checkout Pro (compra avulsa) + `PreApproval` (assinatura recorrente do Clube). Usado no checkout, no webhook (consulta pagamento/assinatura) e na tela de configurações do Clube.
- **`lib/frenet.ts`** — cotação real de frete por CEP (múltiplas transportadoras) e validação de código de rastreio (`/tracking/trackinginfo`). Sem token configurado, o frete cai automaticamente na tabela de faixas por região/peso (`TAB_FRETE_FAIXA`).
- **`lib/bling.ts`** — OAuth2, emissão **e cancelamento** de NF-e (não sincroniza estoque/financeiro, não sincroniza cadastro de produto — NCM e GTIN vão por item na hora de emitir). `BLING_CLIENT_ID`/`BLING_CLIENT_SECRET` são credenciais do app (env, nível de deploy); token de acesso da loja fica em `TAB_INTEGRACAO_BLING` e renova sozinho via refresh_token quando expira em <60s.
- **`lib/bling-marketplace.ts`** — importa pedidos de Mercado Livre/Shopee que chegaram no Bling (canal `marketplace` em `TAB_PEDIDO`, cruzado por `bling_pedido_id`). Chamado pelo cron `app/api/cron/importar-pedidos-marketplace` 1x/dia. Outro cron, `app/api/cron/notas-bling-pendentes`, atualiza o contador de notas de entrada pendentes no Bling. Ambos exigem `CRON_SECRET` (header `Authorization: Bearer`) pra autenticar o agendador — sem a variável definida, respondem 401. Quem dispara é o crontab da VPS via `scripts/cron-vps.sh` (ver `DOCS/cron-vps.md`).
- **`lib/nfe-xml.ts`** — leitura (não emissão) de XML de NF-e de entrada: extrai fornecedor, itens e chave de acesso, valida o dígito verificador da chave (módulo 11) sem consultar a Sefaz. Usado na Entrada de NF pra pré-preencher o lançamento a partir do XML que o fornecedor manda.
- **`lib/email.ts`** — Nodemailer/Gmail. Templates: pedido criado, pedido pago, novo pedido (aviso ao admin), status atualizado, rastreio salvo, "voltou ao estoque".
- **`lib/cloudinary.ts`** — upload assinado via API REST (sem SDK). Só necessário em ambiente serverless sem disco persistente; na VPS (ambiente atual) cai pro disco local.

### Segredos configuráveis pelo admin (`lib/segredos.ts`)

Frenet, Mercado Pago e Email deixaram de depender só de variável de ambiente — o admin configura/troca direto em Configurações > Integrações, sem precisar de acesso ao painel de hospedagem (mesmo racional que já existia pro Bling). `getSegredo(chave)` lê de `TAB_INTEGRACAO_SEGREDO`, cai pra `process.env` se não houver nada configurado no banco (nada quebra num deploy novo antes do admin configurar), com cache em memória de 30s. Tabela isolada de `TAB_CONFIGURACAO` de propósito: o endpoint que devolve config geral nunca pode vazar um segredo.

## Autenticação e autorização

- **`lib/auth.ts`** — sessão via cookie assinado com HMAC-SHA256 (Web Crypto, compatível com Edge Runtime do middleware). Segredo: `AUTH_SECRET` (obrigatório). Duas sessões independentes: admin (`admin_sessao`) e cliente (`cliente_sessao`).
  - O cookie do admin (`OPCOES_COOKIE_SESSAO_ADMIN`) **não tem `maxAge`**: é cookie de sessão de navegador, apagado quando a janela fecha, pra que abrir o sistema caia sempre na tela de entrada. Quem lembra usuário e senha é o gerenciador do navegador, via `name`/`autoComplete` no formulário — não o cookie.
  - Como o `maxAge` era o que expirava a sessão, o prazo passou pra dentro do token (campo `expira`, 7 dias, coberto pela assinatura). `lerTokenSessao()` recusa token vencido **e** token sem o campo — os do formato antigo, que só morriam pelo `maxAge`, valem como vencidos. Efeito colateral esperado: todo mundo faz um login a mais no primeiro deploy dessa mudança.
  - A sessão do cliente da loja segue persistente de propósito — comprador espera continuar logado.
- **`lib/auth-servidor.ts`** — helpers pra rotas de API: `exigirSessao()` (401 sem sessão admin), `exigirAdmin()` (403 se papel != admin), `exigirSessaoCliente()` (401 sem sessão cliente).
- **`middleware.ts`** — protege `/admin/*` (exceto `/admin/entrar`); redireciona pra login sem sessão. Não tem mais lista própria de rotas restritas (duplicava a regra): só repassa o `x-pathname` pro layout decidir.
- **`lib/cores.ts`** — `CORES_TEMA` (site, por marca) e `CORES_SISTEMA` (painel). Cada chave vira uma variável CSS aplicada no wrapper raiz, com o padrão repetido em `:root` para o que renderiza em portal (modal, menu suspenso). Superfícies compartilhadas são **classe** em `app/globals.css` (`.cabecalho-grade`, `.selo-sucesso`, `.acao-perigo`…), nunca utilitário Tailwind repetido: o selo "Ativo" aparece em 18 telas e a cor dele não pode virar 18 edições. Cada ação e selo tem UMA cor base; fundo e borda saem por `color-mix`.
- **`lib/telas-admin.ts`** — catálogo das telas do admin (rota, label, grupo, `padraoOperador`) + `telaDaRota()` e `podeAbrir()`. Fonte única: tela nova entra aqui, sem migration.
- **`lib/permissoes-servidor.ts`** — lê/grava as exceções em `TAB_USUARIO_PERMISSAO`. `app/admin/layout.tsx` bloqueia por URL usando isso, e o menu esconde o que a pessoa não pode abrir — digitar o endereço na mão não passa.
- **admin vs operador**: coluna CHECK em `TAB_USUARIO_ADMIN`. "admin" tem acesso irrestrito (ignora `TAB_USUARIO_PERMISSAO`); "operador" segue o padrão do catálogo mais as exceções definidas na tela de Usuários, botão **Permissões**.
- **`lib/auditoria-servidor.ts`** — `registrarAuditoriaServidor()`, chamada **dentro da rota de API**, não pela tela. A auditoria de `lib/auditoria.ts` é disparada pela interface e por isso não pega chamada direta na API. As ações sensíveis passam por aqui: credenciais de integração (grava só **quais chaves** mudaram, nunca o valor), plano/recursos, permissões, emissão e cancelamento de NF-e, status de pedido (com o estorno do Mercado Pago junto), configurações da loja, aceite de cotação, conversão de orçamento, pedidos de compra, tipos de entrega e faixas de frete. Falha ao auditar nunca desfaz a ação — vai pro log do servidor.

## Sistema de abas MDI do admin

- **`lib/abas-admin-store.ts`** — store Zustand persistido em `localStorage`. "Dashboard" é fixa e nunca fecha. `abrirAba` evita duplicata por path; `fecharAba` retorna o path anterior pra quem chamou decidir se navega.
- **`components/admin/tab-bar.tsx`** — ao mudar de rota, detecta a seção do menu lateral e abre a aba automaticamente (mesmo em acesso direto/F5) — a URL é sempre a fonte da verdade, a barra só reflete o histórico da sessão. Tem setas de rolagem nas pontas (aparecem só quando há overflow real, via `ResizeObserver`).

## Cálculo de frete

1. Se `subtotal >= frete_gratis_acima_de` (configurável), frete grátis — checagem sempre em primeiro lugar, independente da fonte do cálculo abaixo.
2. Com Frenet configurado (`lib/frenet.ts`, token em `TAB_INTEGRACAO_SEGREDO`) e CEP de origem cadastrado, o checkout cota em tempo real com várias transportadoras e mostra a lista de opções (valor + prazo) pro cliente escolher — cotação de verdade, não estimativa.
3. Sem Frenet configurado, cai na tabela local: `lib/configuracoes.ts` mapeia UF → região IBGE (`REGIAO_POR_UF`) e busca em `TAB_FRETE_FAIXA` a faixa (região + peso) mais específica; peso mínimo assumido é 0.3kg se o produto não tiver `peso_kg` cadastrado.
4. Sem faixa cadastrada nem Frenet, cai no `frete_valor_base` fixo (nunca trava o checkout).

Rastreio: a tela de pedido valida o código digitado contra a API real da Frenet (`rastrearPedidoFrenet`) automaticamente antes de salvar e notificar o cliente — não é só checagem de formato.

## Fluxo de pedido e pagamento

**Checkout (`app/api/checkout/route.ts`)**:
1. Exige sessão de cliente e reconfirma que está `ativo` no banco (sessão pode ter sido emitida antes de uma inativação).
2. Dentro de uma transação: grava endereço, revalida cada item com `FOR UPDATE` (preço e estoque recalculados no servidor, nunca confia no client), calcula frete real, revalida cupom com `FOR UPDATE` (evita estourar `uso_maximo` em checkouts simultâneos), grava pedido (`aguardando_pagamento`) e itens. **Estoque não é baixado aqui.**
3. Fora da transação, cria a preferência de checkout no Mercado Pago; erro do gateway retorna 502 genérico, sem vazar detalhe interno.
4. Dispara e-mail de "pedido criado" sem bloquear a resposta.

**Webhook Mercado Pago (`app/api/webhooks/mercadopago/route.ts`)**:
1. Valida assinatura (`x-signature`/`x-request-id` vs `MERCADOPAGO_WEBHOOK_SECRET` via HMAC + comparação de tempo constante) — pulado se o segredo não estiver configurado (ex: dev).
2. Sempre rebusca o pagamento na API do MP por id (nunca confia só no corpo da notificação).
3. Dentro de transação, trava o pedido (`FOR UPDATE`); se o status já é o mesmo, não faz nada (idempotência contra reenvio).
4. Ao virar "pago" pela primeira vez, baixa estoque de cada item e dispara e-mails ao cliente e ao admin.
5. Sempre responde `{ recebido: true }`, mesmo com erro interno, pra evitar reenvio infinito do MP por erro nosso.

Também trata o tópico `subscription_preapproval` (assinatura do Clube), sincronizando o status em `TAB_ASSINATURA_CLUBE`.

## Deploy

Ver seção "Deploy" do `README.md` para o estado atual (produção em VPS na Hostinger, banco no Supabase, crons pelo crontab do servidor).
