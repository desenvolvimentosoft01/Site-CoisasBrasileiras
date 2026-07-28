# Plano — Evolução para ERP (Coisas Brasileiras)

Documento de acompanhamento da expansão do sistema em direção a um ERP completo. Atualizado a cada etapa concluída. Serve também de roteiro para replicar a mesma implementação em outro sistema/projeto no futuro (mesma stack: Next.js + PostgreSQL puro via `pg`, sem ORM).

Para decisões de arquitetura e o "porquê" por trás de cada escolha, ver a memória `projeto_coisas_brasileiras_erp.md`. Este documento é o "o quê" e "como está", não o "porquê".

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
- [ ] Notificação automática de "voltou ao estoque" (cliente deixa e-mail, sistema avisa sozinho quando repor)
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
