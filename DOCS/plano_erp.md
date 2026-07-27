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
