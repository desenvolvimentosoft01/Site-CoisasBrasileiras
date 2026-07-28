# Plano — Evolução para ERP (Coisas Brasileiras)

Documento de acompanhamento da expansão do sistema em direção a um ERP completo. Atualizado a cada etapa concluída. Serve também de roteiro para replicar a mesma implementação em outro sistema/projeto no futuro (mesma stack: Next.js + PostgreSQL puro via `pg`, sem ORM).

Para decisões de arquitetura e o "porquê" por trás de cada escolha, ver a memória `projeto_coisas_brasileiras_erp.md`. Este documento é o "o quê" e "como está", não o "porquê".

## Checklist de go-live (produção de verdade)

Marcar conforme for resolvendo. Levantado em 2026-07-27.

- [ ] **Banco de dados**: confirmar se a Vercel usa o Neon de produção (`DATABASE_URL` do projeto na Vercel) — nunca foi confirmado, ver seção "Infraestrutura" mais abaixo. Todas as migrations (`000` até a mais recente) aplicadas nesse banco.
- [ ] **Bling**: trocar do app de teste pro app de produção no painel Bling (se for o caso). Reconectar em Configurações > Integrações > Bling com a conta real da loja (fluxo OAuth já pronto). `BLING_CLIENT_ID`/`BLING_CLIENT_SECRET` do app de produção como variável de ambiente na Vercel.
- [ ] **Mercado Pago**: token de acesso e chave pública **de produção** (não `TEST-...`) em Configurações > Integrações > Mercado Pago. Cadastrar a URL do webhook (`https://seudominio.com/api/webhooks/mercadopago`) no painel do Mercado Pago e colocar a "assinatura secreta" gerada em `MERCADOPAGO_WEBHOOK_SECRET` (env var — ainda não foi movido pro banco).
- [ ] **Frenet**: token real da conta em Integrações > Frenet. CEP de origem configurado em Configurações > Frete. `ShippingServiceCode` reais das transportadoras usadas, pra validação automática de rastreio funcionar (pendente).
- [ ] **Email**: credenciais reais (Gmail com senha de app, ou outro provedor) em Integrações > Email.
- [ ] **Infraestrutura**: `AUTH_SECRET` de produção gerado (valor aleatório longo). Domínio próprio apontado pra Vercel (`NEXT_PUBLIC_SITE_URL` correto). Cloudinary configurado (`CLOUDINARY_*`), já que Vercel é serverless e não tem disco persistente pra upload de imagem.

## Fronteiras decididas (não fazer)

- **Fiscal** (NF-e, NFC-e, SPED Fiscal): sempre terceirizado ao **Bling**. Nunca implementar emissão/apuração fiscal própria.
- **Contabilidade formal** (livro diário/razão, balanço, IRPJ/CSLL, SPED Contábil/ECF): fora do sistema — fica com o contador do cliente.
- **Bling**: escopo travado em emissão de NF-e de venda. Não sincroniza estoque nem recebe compras/entradas (fonte de verdade do estoque é sempre este sistema).
- **Multi-tenant**: adiado conscientemente. Cada cliente novo = banco Postgres novo (mesmo schema/migrations) + deploy separado. Revisitar schema único (`empresa_id`) só se/quando escalar para muitos clientes.

## Módulos: Site (loja pública) × Sistema (painel admin/ERP)

Separação por onde a tela vive e quem usa — cliente final navegando no site, ou o lojista/operador logado no painel. Útil pra saber rápido "isso é uma tela pra quem compra ou pra quem vende".

### Site (`app/(loja)/*`, público, sem login ou com login de cliente)

- Home (banners, categorias, destaques, "mais vendidos")
- Catálogo (`/produtos`) e produto individual (`/produtos/[slug]`)
- Carrinho (`/carrinho`) e Checkout (`/checkout`)
- Login de cliente (`/entrar`) e Minha Conta (`/minha-conta`) — dados, endereços, histórico de pedidos
- Acompanhar pedido (`/pedido/[id]`) — timeline de status e rastreio
- Componentes globais do site: Header, Footer, banner de anúncio no topo, botão flutuante de WhatsApp

### Sistema (`app/admin/*`, login de `TAB_USUARIO_ADMIN`, papéis admin/operador)

**Vendas e atendimento**
- Dashboard, Venda Balcão (PDV), Pedidos, Orçamentos, Clientes

**Catálogo**
- Cadastro de Produtos, Categorias, Estoque

**Compras** *(novo — Fase 1 deste plano)*
- Fornecedores, Compras (entrada de mercadoria, custo, recebimento)

**Marketing**
- Cupons, Banners *(conteúdo exibido no site, mas gerenciado só pelo sistema)*, Feedbacks

**Financeiro**
- Financeiro (contas a pagar/receber), Relatórios > Lucro/DRE *(novo — Fase 3)*

**Relatórios**
- Vendas, Lucro/DRE *(novo)*, Estoque, Auditoria

**Configurações**
- Usuários, Configurações da Loja (Contato, Frete, Aparência, Anúncio, Custos *(novo — Fase 2)*, Integrações/Bling)

Módulos novos das fases deste plano (Fornecedores, Compras, Lucro/DRE, Custos) são **100% Sistema** — nenhum aparece no site público, o que é esperado: são ferramentas de gestão interna do lojista, não algo que o cliente final vê ou interage.

## Fases

### Fase 1 — Fornecedores e Compras (base do custo real)
Status: ✅ concluída (2026-07-25)

- [x] Migration `020_fornecedores_compras.sql`: `TAB_FORNECEDOR`, `TAB_PRODUTO.custo`, `TAB_COMPRA`, `TAB_COMPRA_ITEM` (aplicada no banco local **e no Neon de produção**)
- [x] CRUD de Fornecedores (`/admin/fornecedores`, API `app/api/admin/fornecedores`) — endereço completo, CNPJ/CPF com máscara, ativo/inativo
- [x] CRUD de Compras (`/admin/compras`, API `app/api/admin/compras`) — fornecedor, itens (produto/quantidade/custo unitário), frete, número da nota, observação
- [x] Ação "Receber compra" (`lib/compras.ts` → `receberCompra`): transação com `FOR UPDATE` na compra e nos produtos (mesmo padrão do webhook do Mercado Pago) — dá alta no estoque e recalcula `custo` por média ponderada
- [x] Ao receber, gera automaticamente uma conta a pagar em `TAB_CONTA` vinculada à compra (`compra.conta_id`)
- [x] Ação "Cancelar compra" (só permitida enquanto `pendente`, antes de afetar estoque/financeiro)
- [x] Entrada de menu novo "Compras" no `admin-shell.tsx` (Compras + Fornecedores)

- [x] Pendência opcional resolvida (2026-07-26): custo médio atual e margem % exibidos (somente leitura) no formulário de produto (`components/admin/produto-form.tsx`), quando o produto já tem custo > 0 — margem recalcula em tempo real conforme o preço de venda é editado.

### Fase 2 — Despesas e configuração de custo (valores em branco até a implantação)
Status: ✅ concluída (2026-07-25)

- [x] Configuração de taxa do gateway de pagamento (% + valor fixo), por gateway — nova aba **Configurações > Custos**: `taxa_mercadopago_percentual`, `taxa_mercadopago_fixo`, `taxa_pagbank_percentual`, `taxa_pagbank_fixo` em `TAB_CONFIGURACAO` (chave/valor, sem migration nova — reaproveita a tabela existente)
- [x] Configuração de alíquota de imposto (Simples Nacional, % sobre faturamento) — `aliquota_imposto_percentual` na mesma aba
- [ ] Frete não repassado ao cliente como despesa (ex: quando `frete_gratis_acima_de` zera o frete cobrado mas o custo real via Melhor Envio continua existindo) — **adiado pra Fase 3**: é mais um cálculo do relatório de lucro do que uma configuração nova, não precisa de campo extra

### Fase 3 — Relatórios financeiros (todos os tipos, não só "lucro real")
Status: ✅ concluída (2026-07-25)

Pedido do cliente: cobrir todas as possibilidades de relatório de custo/margem/lucro, não só um recorte único — "lucro real" foi apenas o motivo original, o contador da loja pode querer outras visões depois.

- [x] Nova tela **Relatórios > Lucro / DRE** (`/admin/relatorios/lucro`, restrita a papel "admin"), com filtro de período (mesmo padrão de `/admin/relatorios`)
- [x] DRE gerencial completo: Faturamento − CMV − taxas de pagamento (por gateway, usando as configs da Fase 2) − imposto estimado − despesas fixas (`TAB_CONTA` tipo pagar, excluindo categoria `compra` pra não contar o custo em dobro) = Lucro líquido
- [x] Margem por produto (preço − custo, ranking do maior pro menor)
- [x] Margem por categoria
- [x] Comparação com o período anterior de mesma duração (faturamento e lucro líquido, com % de variação)
- [x] Aviso no topo da tela quando taxas/imposto ainda não foram configurados (Fase 2 em branco) — deixa claro que o número está incompleto
- [x] Lógica extraída em `lib/relatorio-lucro.ts` (`calcularDRE`, `periodoAnterior`), reaproveitável

**Limitação documentada meio código** (`lib/relatorio-lucro.ts`): CMV e margem usam o custo médio **atual** do produto (`TAB_PRODUTO.custo`), não um custo "congelado" no momento da venda — o pedido não guarda o custo unitário de cada item vendido. Aproximação aceitável pro relatório gerencial; ficaria mais preciso se `TAB_PEDIDO_ITEM` guardasse o custo do produto no momento da venda, mas isso é mudança de schema maior, não fizemos agora.

Ticket médio e produtos mais vendidos por quantidade já existiam em `/admin/relatorios` (Fase anterior ao plano ERP) — não duplicados aqui.

### Fase 4 — Bling: fechar lacunas na emissão de NF-e
Status: ✅ concluída (2026-07-25)

- [x] **Reenvio/nova tentativa de emissão em caso de falha**: já funcionava sem precisar de código novo — o botão "Emitir NF-e" só some quando `bling_nota_id` é gravado com sucesso; se a chamada ao Bling falhar antes de salvar, o botão continua disponível pro admin tentar de novo. Só documentado aqui, não foi uma lacuna real.
- [x] **Cancelamento de nota emitida pelo admin** (lacuna real, agora fechada):
  - Migration `021_bling_cancelamento.sql`: `TAB_PEDIDO.bling_nota_cancelada_em` (aplicada local + Neon)
  - `lib/bling.ts` → `cancelarNotaFiscalBling()` (exige justificativa ≥ 15 caracteres, regra da Sefaz)
  - `POST /api/admin/pedidos/[id]/cancelar-nfe`
  - `POST /api/admin/pedidos/[id]/emitir-nfe` ajustada: só bloqueia reemissão se já tem nota **e não foi cancelada** — depois de cancelada, permite emitir uma nova pro mesmo pedido
  - UI em `/admin/pedidos/[id]`: botão "Cancelar NF-e" com campo de justificativa; depois de cancelada, mostra aviso e libera "Emitir NF-e" de novo
- [x] Mantido fora de escopo, como decidido: nenhuma sincronização de estoque/compras/financeiro com o Bling

### Fase 4.1 — NCM no produto, enviado na emissão de NF-e (2026-07-26)

Usuário perguntou sobre enviar produtos pro Bling (evitar recadastro duplicado). Pesquisa na documentação oficial (Context7) mostrou que **não precisa sincronizar catálogo de produto** — o campo de NCM (`classificacaoFiscal` na API do Bling) pode ir direto no item da nota fiscal, sem o produto precisar existir cadastrado no Bling. Resolve o problema sem criar um segundo "dono" de cadastro de produto (mesmo raciocínio usado pra não sincronizar estoque).

- [x] Migration `022_produto_ncm.sql`: `TAB_PRODUTO.ncm` (aplicada local + Neon)
- [x] Campo NCM (opcional, só dígitos, até 8 caracteres) no cadastro de produto (`produto-form.tsx`)
- [x] `lib/bling.ts` → `emitirNotaFiscalBling()`: envia `classificacaoFiscal` por item quando o produto tem NCM cadastrado
- [x] CFOP deixado de fora de propósito — o Bling calcula automaticamente pela UF de origem/destino; não é uma decisão fiscal que faça sentido tomar no nosso sistema
- [x] Tributação (ICMS/PIS/COFINS por operação) continua 100% no Bling — depende do regime tributário da empresa, que só existe cadastrado lá; nosso sistema guarda só o "rótulo" (NCM), não uma tabela de alíquotas
- [x] Certificado digital: confirmado que fica configurado só dentro do painel do Bling (upload do A1 ou configuração do A3) — nosso sistema nunca vê nem manipula o certificado, só a conexão OAuth já existente

**Decisão sobre CT-e/MDF-e**: usuário perguntou sobre "emitir DFe pelo sistema" — esclarecido que são documentos de quem **presta serviço de transporte próprio** (frota/logística própria). O cliente real (loja de porcelana, despacha só via Correios/transportadora contratada, sem frota própria) nunca vai precisar desses documentos — mantido fora de escopo, não é uma lacuna, é simplesmente um tipo de documento que não se aplica a esse perfil de negócio (nem a um futuro cliente do mesmo tipo — e-commerce sem frota própria).

**Carta de Correção Eletrônica (CC-e)**: usuário pediu pra completar o fluxo (cancelamento já existe). **Não implementada ainda** — a documentação do Bling disponível via Context7 é enxuta e não trouxe um endpoint confirmado pra CC-e; decidido não "chutar" o formato de uma ação fiscal sem confirmação (mesmo cuidado que já vale pra NF-e/PagBank, registrado no `PLAN.md` como pendente de validação contra conta real). **Por enquanto, CC-e fica manual direto no painel do Bling** (recurso que já existe lá). Retomar implementação quando houver acesso a uma conta Bling real pra validar o endpoint certo.

### Fase 4.2 — Importação de XML de NF-e na entrada de Compra (2026-07-27)

Usuário perguntou como funciona a entrada de compra hoje (era manual). Confirmado que importar XML de nota de **entrada** (a que o fornecedor já emitiu e autorizou) não tem nenhuma sobreposição com o certificado digital do Bling — é só leitura de um arquivo já pronto, sem assinar nem comunicar com a Sefaz.

- [x] `lib/nfe-xml.ts`: parser de XML de NF-e (`fast-xml-parser`) + `validarChaveAcesso()` (dígito verificador módulo 11, validação local, sem consultar a Sefaz)
- [x] `POST /api/admin/compras/importar-xml` (admin, só leitura — não grava nada no banco)
- [x] UI em Compras > Cadastro: botão "Importar XML da NF-e", preenche fornecedor/número/data/frete automaticamente
- [x] **Fornecedor**: casa por CNPJ com os já cadastrados; se não achar, cadastra automaticamente a partir dos dados do XML (decisão do usuário) — registra auditoria (`tela: "Compras (importação XML)"`)
- [x] **Itens**: ficam pendentes de mapeamento manual — admin associa cada item do XML a um produto do catálogo (pré-seleciona por SKU quando bate, mas sempre pede confirmação, decisão do usuário) antes de entrarem na compra
- [x] Aviso visual se a chave de acesso não bater na validação (arquivo pode estar incompleto/alterado) — não bloqueia, só avisa

## Revisão de segurança (skill `revisar_seguranca`) — 2026-07-26

Rodada sobre todos os arquivos alterados/criados nas Fases 1-4.1 (usuário perguntou "está tudo completo, podemos vender?" antes de rodar). Achados e correções:

- [x] **Race condition em `POST /api/admin/compras/[id]/cancelar`**: fazia `SELECT` + `UPDATE` sem lock — corrigido, agora usa `transacao()` com `SELECT ... FOR UPDATE` (mesmo padrão de `receberCompra()`), evitando que "cancelar" e "receber" disparados quase juntos colidam.
- [x] **Falta de transação em `POST /api/admin/compras`**: criava a compra e os itens em queries separadas, podendo deixar uma compra "órfã" com itens incompletos se uma falhasse no meio. Corrigido — tudo dentro de `transacao()`.
- [x] **Mesmo risco de corrida em `emitir-nfe`/`cancelar-nfe`**: checagem de status e chamada ao Bling sem lock. Corrigido — ambas as rotas agora envolvem toda a operação (checagem + chamada externa + gravação) numa `transacao()` com `SELECT ... FOR UPDATE` no pedido. Trade-off aceito conscientemente: o lock fica ativo durante a chamada de rede ao Bling (pode levar alguns segundos), mas é uma ação de admin de baixa frequência — não é um endpoint de alto tráfego.
- [x] **Compras/Fornecedores restritos a papel "admin"**: antes qualquer "operador" logado via custo de compra e dados de fornecedor (revela margem indiretamente), diferente de Financeiro/Usuários/Auditoria/Lucro-DRE. Alinhado — rotas de API trocadas de `exigirSessao()` pra `exigirAdmin()`, `/admin/compras` e `/admin/fornecedores` adicionados ao `middleware.ts` (bloqueio de rota) e marcados `somenteAdmin: true` no menu (`admin-shell.tsx`), pra nem aparecer pro operador.
- [x] **Mobile**: tabelas de "Margem por produto/categoria" em `relatorio-lucro-conteudo.tsx` não tinham `overflow-x-auto` (padrão usado no resto do admin) — corrigido.
- Comentários: sem problemas notáveis.

**Nota de escopo consciente**: o custo (`TAB_PRODUTO.custo`) continua visível pra qualquer papel que edite produto (`produto-form.tsx`), igual ao preço de venda — não foi restrito a admin porque exigiria threading do papel da sessão até esse componente client, mudança maior não pedida explicitamente. Revisitar se fizer sentido.

### Fase 5 — Venda internacional (confirmado como plano concreto do cliente, não hipótese)
Status: ⏸️ pausada a pedido do usuário (2026-07-26) — as fases 1-4 (base do ERP de gestão) estão concluídas; venda internacional fica fora do escopo ativo por enquanto, retomar quando o cliente confirmar que é hora de avançar nisso

- [ ] Gateway de pagamento internacional (Stripe), rodando ao lado do Mercado Pago/PagBank
- [ ] Multi-moeda (preço-base + exibição/cobrança na moeda do visitante)
- [ ] Frete internacional (cálculo próprio, provavelmente valor fixo por região no início)
- [ ] Exportação fiscal (DU-E/Siscomex) — fora do sistema, fica com despachante aduaneiro/contador

### Fase 6 — Clube de assinatura (desconto exclusivo por produto) — pedido do cliente
Status: ✅ implementada (2026-07-27), pendente de teste contra Mercado Pago real

Cliente pediu uma forma de "clube": cliente com assinatura ativa vê um preço com desconto em produtos marcados como elegíveis, com selo tipo "oferta apenas para o clube" na página do produto (exemplo visual mostrado pelo usuário: preço cheio riscado + preço de clube ao lado).

- [x] **Cobrança recorrente automática de verdade**, confirmada via Mercado Pago (`PreApproval`/assinaturas), mesma conta já usada no checkout — nenhum gateway novo
- [x] Migration `023_clube_assinatura.sql`: `TAB_PRODUTO.preco_clube`, `TAB_ASSINATURA_CLUBE` (cliente, `mp_preapproval_id`, status, valor, próximo vencimento) — aplicada local + Neon
- [x] `lib/clube.ts`: `criarAssinaturaClube`, `cancelarAssinaturaClube`, `sincronizarAssinaturaClube` (sempre rebusca na API do MP antes de confiar, mesmo padrão do webhook de pagamento), `clienteTemClubeAtivo`
- [x] `POST /api/cliente/clube/assinar` e `/cancelar`, `GET /api/cliente/clube` (status atual) — todas exigem sessão de cliente
- [x] Webhook do Mercado Pago (`app/api/webhooks/mercadopago/route.ts`) estendido pro tópico `subscription_preapproval` (confirmado via Context7 — nome exato do tópico), com a mesma validação de assinatura (`x-signature`) já usada no pagamento avulso
- [x] Valor da mensalidade configurável em **Configurações > Custos** (`clube_valor_mensalidade`), decisão do usuário
- [x] Campo "Preço do Clube" no cadastro de produto (`produto-form.tsx`) — vazio = produto não participa
- [x] Página de produto: preço de clube + selo "Oferta exclusiva para membros do Clube" só pra quem tem assinatura `autorizada`; teaser discreto pra quem não é membro ainda
- [x] "Minha Conta" ganhou seção Clube: assinar (redireciona pro checkout do MP), ver status/próxima cobrança, cancelar
- [x] Tela admin `/admin/clube` (só leitura, restrita a admin) listando assinantes e status — criação/cancelamento continua sendo self-service do cliente
- [x] Proteção contra duplo-clique criando duas assinaturas em paralelo (`criarAssinaturaClube` bloqueia se já existe uma não-cancelada)

**Pendência antes de operar com assinatura real**: assim como PagBank/Bling, o fluxo do Mercado Pago `PreApproval` nunca foi executado contra uma conta real — precisa validar o `init_point` redirecionando corretamente e o webhook `subscription_preapproval` chegando com o formato esperado.

### Fase 7 — Troca Melhor Envio → Frenet + múltiplas opções de frete no checkout (2026-07-27)
Status: ✅ implementada, pendente de teste contra conta Frenet real

Usuário perguntou se o checkout mostrava várias opções de frete (não mostrava — só a mais barata) e confirmou que o provedor real era pra ser Frenet, não Melhor Envio (decisão original da primeira conversa, que tinha ficado só documentada mas nunca implementada — quem foi implementado numa sessão anterior foi Melhor Envio).

- [x] `lib/melhorenvio.ts` removido, substituído por `lib/frenet.ts` (`cotarFreteFrenet`, `frenetConfigurado`) — **formato do payload/resposta não confirmado contra API real** (documentação oficial é renderizada em JS, não pôde ser lida automaticamente); segue o formato publicamente conhecido da Frenet (`POST /shipping/quote`, header `token`). Risco mitigado pelo fallback existente: se o formato estiver errado, a chamada falha e cai automaticamente na tabela de faixas por região, nunca trava o checkout.
- [x] `lib/configuracoes.ts`: `calcularFrete()` (uma opção) virou `calcularOpcoesFrete()` (lista de opções, ordenada da mais barata pra mais cara)
- [x] `/api/frete` devolve a lista completa de opções (transportadora, serviço, valor, prazo)
- [x] Checkout do site (`app/(loja)/checkout/page.tsx`): mostra as opções como rádio, cliente escolhe, pré-selecionada a mais barata por padrão
- [x] `/api/checkout`: recebe qual opção o cliente escolheu (transportadora+serviço), mas **recalcula tudo no servidor** e usa o preço da opção correspondente recém-calculada — nunca confia em preço de frete vindo do client (mesmo princípio já seguido em todo o checkout)
- [x] `.env.example` atualizado: `MELHOR_ENVIO_TOKEN`/`MELHOR_ENVIO_API_URL` → `FRENET_TOKEN`/`FRENET_API_URL`

**Pendência antes de operar com frete real via Frenet**: testar contra uma conta Frenet real (token de teste ou produção) pra confirmar que o payload/resposta batem com o que o código espera. Até lá, funciona normalmente através do fallback (tabela de faixas por região).

### Fase 7.1 — Validação real de código de rastreio via Frenet (2026-07-27)
Status: ✅ implementada, pendente de teste contra conta Frenet real

Usuário perguntou se o código de rastreio era validado de verdade (só tinha validação de formato). Confirmado via busca que a Frenet tem endpoint de rastreamento (`POST /tracking/trackinginfo`, header `token`), mas ele **exige `ShippingServiceCode`** (código de serviço da transportadora, específico de cada conta Frenet) — não dá pra inferir/chutar esse código com segurança.

- [x] `lib/frenet.ts` → `rastrearPedidoFrenet()`: consulta status real + histórico de eventos do rastreio
- [x] `POST /api/admin/pedidos/[id]/validar-rastreio`
- [x] UI na tela do pedido: campo opcional "Código do serviço Frenet" + botão "Validar" — **nunca bloqueia o salvamento do rastreio**, é uma ação manual à parte
- [x] Validação de formato (client-side, não bloqueia): se a transportadora for "Correios" e o código não bater com o padrão (2 letras + 9 números + 2 letras), mostra aviso
- [x] Botão "Salvar rastreio" renomeado pra "Salvar e notificar cliente" (mais claro sobre o que a ação faz)

**Bug real corrigido nessa revisão**: a notificação por e-mail ao salvar rastreio/status usava `INNER JOIN` com `TAB_CLIENTE` — pedido sem `cliente_id` (venda avulsa) sumia da busca e o e-mail era pulado **silenciosamente**, sem log nem erro. Trocado pra `LEFT JOIN` + log de aviso quando não há e-mail pra notificar.

**Pendência**: como a cotação de frete (Fase 7) já usa Frenet, o ideal seria guardar automaticamente o `ShippingServiceCode` escolhido no checkout dentro do próprio pedido, pra já vir preenchido aqui em vez do admin digitar de novo — não implementado ainda, o campo fica manual por enquanto.

### Fase 8 — Código de barras (GTIN/EAN) do produto (2026-07-27)
Status: ✅ implementada

Usuário perguntou se o código de barras que o cliente já tem nos produtos estava coberto no sistema — não estava (nenhum campo existia). Adicionado nos três lugares onde faz diferença prática:

- [x] Migration `024_codigo_barras.sql`: `TAB_PRODUTO.codigo_barras` (aplicada local + Neon)
- [x] Campo no cadastro de produto (`produto-form.tsx`)
- [x] **Leitor no PDV (Venda Balcão)**: campo dedicado que aceita leitor USB/scanner (funciona como teclado + Enter) — lê o código, casa com o produto e adiciona direto no carrinho, sem precisar clicar na grade
- [x] **NF-e (Bling)**: campo `gtin` enviado por item, junto com o NCM
- [x] **Importação de XML de compra**: `lib/nfe-xml.ts` extrai `cEAN` do item; pré-seleção do produto no mapeamento agora prioriza código de barras (mais confiável, é sempre o mesmo em qualquer lugar) e cai pro SKU se não achar

### Fase 9 — Painel "Notas do Bling" (acompanhamento de entrada) (2026-07-27)
Status: ✅ implementada, lançamento em si continua via importação de XML

Usuário perguntou se dava pra ter uma tela recebendo as notas de fornecedor automaticamente. Confirmado via Context7 que o Bling expõe `GET /notas-fiscais?tipo=0` (notas de entrada) — dá pra listar sem tocar em certificado (fica isolado no Bling). Mas o formato dos **itens** de cada nota não está confirmado na documentação disponível, então o lançamento (criar a compra de fato) continua via importação de XML — a tela serve de painel de acompanhamento pra saber o que já foi lançado e o que falta.

- [x] Migration `025_compra_bling_nota.sql`: `TAB_COMPRA.bling_nota_id` (link local, aplicada em ambos os bancos)
- [x] `lib/bling.ts` → `listarNotasEntradaBling()`
- [x] `GET /api/admin/bling/notas-entrada`: lista as notas de entrada do Bling, cruza com o que já virou `TAB_COMPRA` localmente, classifica em pendente/lançada/cancelada
- [x] Nova aba **Compras > Notas do Bling**: filtro por status, botão "Lançar entrada" (pendente) que abre o Cadastro pré-vinculado àquela nota — ao importar o XML e salvar, a compra fica marcada como lançada e some da lista de pendentes
- [ ] **Pendência futura** (quando tiver conta Bling real conectada): confirmar o schema do detalhe da nota (`GET /notas-fiscais/{id}`) pra preencher os itens automaticamente, sem precisar do XML separado

### Fase 10 — Diferenciais de site/sistema (wishlist aprovada pelo usuário, ainda não iniciada)
Status: 🔲 a fazer — aguardando ordem de prioridade

Lista de melhorias sugeridas numa conversa exploratória ("o que mais pode ter de diferencial"), todas aprovadas pelo usuário ("gostei"), mas nenhuma iniciada ainda — registrado aqui pra não perder.

**Site (experiência do cliente)**
- [x] **Avaliações de produto** (2026-07-27) — implementada, ver detalhe abaixo
- [ ] Lista de desejos (favoritar produto sem comprar)
- [ ] Busca com filtro avançado (categoria + faixa de preço + "só com desconto do clube")
- [x] **Notificação automática de "voltou ao estoque"** (2026-07-27) — ver detalhe abaixo
- [ ] Programa de indicação (cupom por indicação de amigo)

**Sistema (gestão)**
- [ ] Previsão de reposição de estoque (velocidade de venda x estoque atual, "vai faltar em X dias")
- [ ] Metas de vendas no dashboard (meta do mês x realizado)
- [ ] Segmentação de clientes (quem compra mais, quem não compra há X meses) pra campanha de reativação
- [ ] Multiusuário com permissão mais granular (hoje só admin/operador)

### Fase 10.1 — Avaliações de produto (2026-07-27)
Status: ✅ implementada

Primeiro item da Fase 10 escolhido pelo usuário. **Diferente de `TAB_FEEDBACK`** (depoimentos curados pelo admin pra home) — aqui é o cliente avaliando um produto específico que comprou.

- [x] Migration `026_avaliacoes_produto.sql`: `TAB_AVALIACAO_PRODUTO` (produto, cliente, nota 1-5, comentário, aprovado, `UNIQUE(produto_id, cliente_id)` — uma avaliação por cliente por produto)
- [x] **Compra verificada**: só quem tem pedido `pago` com aquele produto pode avaliar (checado no servidor, não é so uma checagem de UI)
- [x] **Moderação**: avaliação nasce `aprovado = false`, só aparece no site depois que o admin aprova — nova tela `/admin/avaliacoes` (Grade com filtro pendentes/aprovadas/todas, aprovar ou excluir)
- [x] Página de produto: resumo de estrelas (média + contagem) perto do título, lista das avaliações aprovadas, formulário de envio (só aparece pra quem comprou e ainda não avaliou)
- [x] Auditoria registrada nas ações de aprovar/excluir

### Fase 10.2 — Notificação automática "voltou ao estoque" (2026-07-27)
Status: ✅ implementada

- [x] Migration `027_notificacao_estoque.sql`: `TAB_NOTIFICACAO_ESTOQUE` (produto, e-mail, `notificado_em`, `UNIQUE(produto_id, email)` — reseta pra `NULL` se a pessoa se cadastra de novo depois de já ter sido avisada, cobrindo o ciclo esgotou-voltou-esgotou de novo)
- [x] `lib/notificar-estoque.ts` → `notificarClientesEstoqueVoltou(produtoId)`: só dispara se o estoque ficou positivo, manda e-mail (`templateVoltouEstoque`) pra todo mundo pendente, marca como notificado
- [x] **100% automático, sem intervenção do admin** — plugado nos três únicos pontos do sistema que aumentam estoque: `lib/compras.ts` (receber compra), `PATCH /api/admin/estoque/[id]` (ajuste manual), `PUT /api/admin/produtos/[id]` (edição de cadastro). Conferido que não existe nenhum outro ponto de alta de estoque no sistema.
- [x] Rota pública `POST /api/produtos/[id]/notificar-estoque` (sem login — qualquer visitante pode deixar o e-mail)
- [x] Componente `NotificarEstoque` na página de produto, aparece só quando o produto está esgotado

### Fase 11 — Correções e ajustes de qualidade (2026-07-27, registrado, execução em andamento)
Status: 🟡 em andamento

Leva de correções pedida pelo usuário depois de olhar telas reais. Registrado tudo aqui antes de começar a mexer, pra não perder nada:

- [x] **Status "Aguardando pagamento" x abandonado**: heurística de tempo (>24h sem confirmação = "Provavelmente abandonado", visual só, não muda o status real no banco — o sistema não tem como saber com certeza sem o MP avisar) aplicada na grade combinada (Venda Balcão > Vendas)
- [x] **Forma de pagamento do site salva e exibida**: `lib/mercadopago.ts` → `rotuloFormaPagamentoMP()` traduz `payment_type_id`/`payment_method_id` do MP (Pix/Boleto/Cartão de crédito/débito), gravado em `TAB_PEDIDO.forma_pagamento` pelo webhook, exibido na grade e na tela de detalhe do pedido
- [x] **Boleto e Pix confirmados**: no site já funcionam sem nenhuma mudança de código (Checkout Pro do MP mostra todos os métodos habilitados na conta do vendedor automaticamente — sem restrição no payload da preferência). Na Venda Balcão, "Boleto" adicionado como opção manual (só tinha Pix/cartão/dinheiro)
- [x] **Código de barras (EAN) agora obrigatório** no cadastro de produto — validado no client (`produto-form.tsx`) e no servidor (`POST`/`PUT /api/admin/produtos`)
- [x] **Auditoria de campos obrigatórios** (amostragem dirigida, não 100% exaustiva): NCM também virou obrigatório (junto do EAN); revisão de todas as telas `*-conteudo.tsx` com formulário de cadastro mostrou que as que não tinham validação client-side (`frete-faixas-conteudo.tsx`) já são protegidas no servidor (API rejeita com erro amigável) — sem risco de dado inválido gravado, só falta feedback mais rápido na tela (não corrigido, baixa prioridade)
- [x] **Auditoria de formatação**: achados e corrigidos 3 campos de telefone/CPF-CNPJ sem máscara (`clientes-conteudo.tsx`, `venda-balcao-conteudo.tsx` cadastro rápido, `orcamento-form.tsx`). Campos monetários com `type="number"` (frete-faixas, cupons, contas financeiro) ficaram como estão — são um padrão diferente do `mascaraMoeda` (texto com vírgula), mas igualmente seguros (o browser já impede caractere inválido); não convertidos, seria retrabalho estético sem ganho funcional
- [x] **"Salvar rastreio" agora notifica o cliente por e-mail** mesmo sem trocar o status (antes só disparava em mudança de status)
- [x] **Campo de vencimento na Compra** (prazo de pagamento real, separado da data da compra) — achado numa revisão pedida pelo usuário: a conta a pagar automática usava a data da compra como vencimento, sem sentido pra fornecedor que dá prazo
- [x] **Inscrição Estadual no Fornecedor** — campo comum em cadastro B2B que faltava
- [x] **Regime Tributário nas Configurações** — informativo (não sincroniza com o Bling, que tem o próprio cadastro fiscal)
- [x] **Menu de categorias do site virou dropdown único** ("Categorias" com mega-menu), liberando espaço no cabeçalho — antes cada categoria principal era um item solto
- [x] **Acesso rápido aos favoritos**: página `/favoritos` + ícone no cabeçalho do site, sem precisar entrar em Minha Conta
- [x] **Cadastro rápido de produto via leitor de código de barras** (Venda Balcão): se o código não bate com nenhum produto, abre modal perguntando se quer cadastrar na hora (só nome + preço) — cria o produto deliberadamente incompleto (sem NCM), com aviso visual (△ amarelo) na grade de Produtos pra lembrar de completar depois

## 2026-07-27 — Ajustes de pedidos: paridade de exibição + restrição de status

- [x] **Lógica de "status de exibição" centralizada** em `lib/status-pedido.ts` (`ROTULOS_STATUS` + `statusExibicao()`), extraída da Venda Balcão. Antes só a grade combinada de Venda Balcão mostrava o ícone de canal, forma de pagamento e o aviso "Provavelmente abandonado" (heurística de 24h sem pagamento); `/admin/pedidos` (lista separada) e o widget "Últimos pedidos" do Dashboard ficaram desatualizados e não mostravam nada disso. Agora as três telas usam a mesma função, então não há mais divergência.
- [x] **Restrição de alteração manual de status do pedido**: não é mais possível setar "Pago" manualmente pela tela `/admin/pedidos/[id]` — esse status só é definido automaticamente pela confirmação de pagamento do Mercado Pago (webhook). Quando o pedido está "Aguardando pagamento", a tela não mostra mais um seletor de status livre; mostra um badge estático + botão "Cancelar pedido" (única ação segura nesse estado). Nos demais estados, o seletor permite só as transições operacionais (em separação → enviado → entregue, cancelar), nunca "Pago" nem voltar pra "Aguardando pagamento".
  - Reforçado também no servidor (`PUT /api/admin/pedidos/[id]`): a rota agora rejeita explicitamente `status: "pago"` vindo de qualquer chamada manual, já que o webhook do MP grava esse status direto no banco (não passa por essa rota) — proteção contra alguém liberar um pedido sem o pagamento ter de fato entrado, mesmo via chamada direta de API.

## 2026-07-27 — Bug sistêmico: `<Select>` mostrava o `value` bruto em vez do rótulo (`__todas__`, `aumento`...)

- [x] Causa raiz: `SelectPrimitive.Root` do `@base-ui/react` só resolve o texto exibido (`Select.Value`) pro rótulo do item quando recebe a prop `items` (mapa `value -> rótulo`). Sem isso, mostra o `value` bruto — daí telas como Relatório de Estoque e Auditoria exibirem `__todas__`/`__todos__` em vez de "Todas as categorias"/"Todos", e o Reajuste de Preços mostrar "percentual"/"aumento" em vez dos rótulos com acento e formatação.
- [x] Corrigido uma única vez em `components/ui/select.tsx`: o `Select` (antes um alias direto de `SelectPrimitive.Root`) virou um componente que varre os `<SelectItem>` dentro dos `children` e monta o mapa `items` sozinho, sem precisar mexer em cada uma das 9 telas que usam `<Select>`. Continua aceitando `items` explícito se algum dia for necessário sobrescrever.

## 2026-07-27 — Site: botão "voltar" e "comprar agora" na página de produto

- [x] Link "Voltar para todos os produtos" no topo de `/produtos/[slug]`, levando pra `/produtos`.
- [x] `AdicionarCarrinhoButton`: "Adicionar ao carrinho" virou `variant="outline"` e ganhou um irmão "Comprar agora" (`variant` padrão, destaque) que adiciona o item ao carrinho e leva direto pro `/checkout` — padrão convencional de e-commerce (compra rápida sem passar pela tela de carrinho).

## 2026-07-27 — Balão de dica em campos de formulário (corrige desalinhamento de grid)

- [x] `components/ui/campo-dica.tsx`: ícone "?" clicável (popover do `@base-ui/react`, já usado no resto do projeto) ao lado do rótulo do campo. Corrige o mesmo tipo de bug do reajuste de preços: texto de ajuda longo embaixo de um campo, dentro de uma grade de colunas, empurrava só aquela célula pra baixo e desalinhava a linha inteira com os campos vizinhos.
- [x] Trocado em `produto-form.tsx` (código de barras, NCM, preço do Clube), `compras-conteudo.tsx` (vencimento da compra) e `configuracoes-conteudo.tsx` (valor base de frete) — os únicos hints que de fato estavam dentro de uma grade multi-coluna com irmãos sem hint. Textos de ajuda fora de grid (coluna única) não têm esse risco e ficaram como estavam.

## 2026-07-27 — Substituídos os `confirm()`/`alert()` nativos do navegador por modal e toast próprios

- [x] `components/admin/confirm-provider.tsx`: `ConfirmProvider` + hook `useConfirmar()`, monta um `AlertDialog` (`components/ui/alert-dialog.tsx`, já existia mas não era usado em lugar nenhum) uma única vez no `AdminShell`. Qualquer tela chama `await confirmar("mensagem")` ou `await confirmar({ descricao, destrutivo: true })` em vez de `confirm(...)` — mesmo comportamento (bloqueia até o usuário decidir), mas com a cara do sistema em vez da caixa feia do navegador (que também alguns navegadores/extensões bloqueiam silenciosamente).
- [x] `<Toaster />` do `sonner` (biblioteca já estava instalada, mas nunca tinha sido montada) adicionada no `AdminShell`; todo `alert(erro)` de mensagem de erro virou `toast.error(erro)`.
- [x] Varridos e trocados todos os 17 arquivos de `components/admin/*-conteudo.tsx` que usavam `confirm`/`alert` nativos: Avaliações, Banners, Categorias, Clientes, Compras, Contas (Financeiro), Cupons, Estoque, Feedbacks, Fornecedores, Faixas de Frete, Orçamentos, Produtos, Tipos de Entrega, Usuários. Confirmado com grep que não sobrou nenhuma ocorrência.

## 2026-07-27 — CRUD completo em Clientes (excluir, respeitando histórico de venda)

- [x] Auditoria de CRUD em todas as telas do admin: a única lacuna real era Clientes, que só tinha inativar (sem excluir). As demais exceções (Pedidos, Compras, Auditoria sem exclusão livre) são propositais — histórico de venda/fiscal não pode ser apagado.
- [x] `DELETE /api/admin/clientes/[id]` adicionada, no mesmo padrão de Produtos: tenta excluir de verdade; se o cliente já tiver pedido vinculado (violação de FK, código `23503`), recusa com mensagem pedindo pra inativar em vez de excluir. Ou seja, exclusão física só é possível pra cadastro sem nenhuma venda (ex: duplicado, erro de digitação); cliente com histórico de compra nunca pode ser removido do banco, só inativado — o que já existia.
- [x] Botão "Excluir" adicionado na grade de Clientes (`components/admin/clientes-conteudo.tsx`), ao lado do botão de inativar já existente.

## 2026-07-27 — Grade editável de preços (correção de layout + edição em linha)

- [x] Corrigido bug de alinhamento em `/admin/precos`: os campos "Tipo"/"Direção"/"Valor" usavam `<label>` cru em vez do componente `Label` compartilhado (`components/ui/label.tsx`, que é `flex` e por isso quebra linha). Um `<label>` puro é inline por padrão, então ficava ao lado do campo em vez de em cima — mesmo bug pode acontecer em qualquer tela nova que não use o componente `Label`; auditei o restante de `components/admin` e não achei outra ocorrência.
- [x] A coluna "Preço novo" da grade agora é editável linha a linha (não só via o reajuste em massa por %/valor fixo): dá pra digitar o preço direto na célula e clicar em "Salvar" pra gravar só aquele produto, sem precisar selecioná-lo nem preencher o reajuste em massa. Selecionar o checkbox da linha continua controlando o que entra no "Aplicar em lote".

## 2026-07-27 — Reajuste de preços em massa

- [x] Nova tela `/admin/precos` (item "Reajuste de Preços" no menu Produtos, só admin): seleciona produtos por categoria/busca, aplica reajuste por percentual ou valor fixo (aumento ou redução), com pré-visualização do preço novo lado a lado com o custo e o preço atual antes de confirmar. Opcionalmente aplica o mesmo reajuste no preço promocional. `PUT /api/admin/precos` grava em transação, recebendo do client a lista final de preços já calculados (não o percentual) — o que o admin vê na pré-visualização é exatamente o que é gravado.
- Preço por entrada de fornecedor **já existia** desde a Fase 1 (`lib/compras.ts` → `receberCompra()`: custo médio ponderado recalculado automaticamente a cada recebimento de compra) — só o reajuste manual de preço de venda em lote estava faltando, e é isso que essa tela cobre.

## 2026-07-27 — Validação real de código de barras (checksum EAN-13/EAN-8)

- [x] `lib/codigo-barras.ts`: `validarCodigoBarras()` confere não só o tamanho (13 ou 8 dígitos) mas o dígito verificador (algoritmo GTIN/EAN padrão), tanto no cadastro/edição de produto (`produto-form.tsx`, com feedback visual em tempo real) quanto nas rotas `POST`/`PUT /api/admin/produtos`. O cadastro rápido via leitor na Venda Balcão (`/api/admin/produtos/rapido`) continua **sem** essa validação bloqueante de propósito — não pode travar uma venda real por causa de um código de barras fora do padrão.

## Concluído fora da ordem das fases (pedidos pontuais do cliente)

- [x] Logo configurável pelo admin (Configurações > Aparência), com upload via Cloudinary/disco local, fallback pro arquivo padrão
- [x] Tela de login redesenhada (referência visual: Voti) — fundo com gradiente na cor primária da loja, card flutuante, campos com ícone, toggle de mostrar/ocultar senha
- [x] Botão "Voltar ao site" na tela de login e no cabeçalho do painel admin
- [x] Correção: middleware redireciona usuário já logado para fora de `/admin/entrar` (antes renderizava o login dentro do shell do admin)

## Modelo de dados novo (Fase 1)

```
TAB_FORNECEDOR
  id, razao_social, nome_fantasia, cnpj_cpf, telefone, email,
  cep, logradouro, numero, complemento, bairro, cidade, estado,
  observacao, ativo, criado_em

TAB_PRODUTO (alteração)
  + custo NUMERIC(10,2) -- custo médio ponderado atual

TAB_COMPRA
  id, fornecedor_id, numero_nota, status (pendente|recebida|cancelada),
  valor_frete, data_compra, observacao, conta_id (FK TAB_CONTA), criado_em, atualizado_em

TAB_COMPRA_ITEM
  id, compra_id, produto_id, quantidade, custo_unitario
```

## Infraestrutura

- [x] Banco de produção **Neon** identificado e confirmado com as migrations `000`–`019` já aplicadas; `020_fornecedores_compras.sql` aplicada em 2026-07-25. **A string de conexão do Neon não fica neste documento nem em nenhum arquivo versionado** — guardar só em `.env.local`/variável de ambiente do deploy (gitignored), nunca commitada.
- [ ] Confirmar se o Neon é o banco que a Vercel usa em produção (`DATABASE_URL` do projeto na Vercel) ou se é um banco à parte — definir isso antes do próximo deploy.

## Para replicar no outro sistema

Este plano assume a mesma base do Coisas Brasileiras (`TAB_PRODUTO`, `TAB_CONTA`, `TAB_CONFIGURACAO`, padrão de migrations numeradas em `migrations/*.sql`, rotas `app/api/admin/*` protegidas por `exigirSessao()`/`exigirAdmin()`). Ao portar para o outro projeto, primeiro confirmar que essas mesmas tabelas-base existem (ou adaptar os nomes) antes de copiar as migrations das fases acima.
