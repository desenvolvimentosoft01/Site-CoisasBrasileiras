# Plano — Evolução para ERP (Coisas Brasileiras)

Documento de acompanhamento da expansão do sistema em direção a um ERP completo. Atualizado a cada etapa concluída. Serve também de roteiro para replicar a mesma implementação em outro sistema/projeto no futuro (mesma stack: Next.js + PostgreSQL puro via `pg`, sem ORM).

Para decisões de arquitetura e o "porquê" por trás de cada escolha, ver a memória `projeto_coisas_brasileiras_erp.md`. Este documento é o "o quê" e "como está", não o "porquê".

## 2026-08-19 — Módulo fiscal: guarda do XML de saída, central de Notas Fiscais e DANFE completo

Objetivo do cliente, dito com essas palavras: *"o cliente precisa imprimir e salvar DANFE e XML tanto de entradas ou saídas, qualquer uma, sem precisar abrir o Bling"*.

- [x] **Migration 057** — `TAB_PEDIDO` ganha `xml_nfe`, `nfe_numero`, `nfe_serie`, `nfe_chave_acesso`, `nfe_data_emissao`. Mesma decisão da 054 (entrada): XML como TEXT no banco, pra entrar no backup — NF-e tem guarda obrigatória de 5 anos e o PDF do DANFE não substitui o arquivo.
- [x] `obterXmlNotaFiscalBling()` em `lib/bling.ts` — o campo `xml` do `GET /notas-fiscais/{id}` vem ora como conteúdo, ora como URL, dependendo da conta; trata os dois.
- [x] `lib/notas-fiscais.ts` — `listarNotasFiscais()` une entrada (`TAB_COMPRA`) e saída (`TAB_PEDIDO`) na leitura, e `garantirXmlNotaSaida()` baixa o XML do Bling na primeira vez e guarda. XML de nota autorizada é imutável, então as chamadas seguintes saem do banco.
- [x] Tela `/admin/notas-fiscais` — abas Todas/Entradas/Saídas, busca por número/nome/chave, filtro por período de emissão com atalhos de mês, filtro "só sem XML guardado", DANFE e XML por linha.
- [x] Rotas: `pedidos/[id]/danfe`, `pedidos/[id]/xml`, `compras/[id]/xml` (avulso; o lote pro contador continua em `compras/exportar-xml`) e `notas-fiscais` (listagem).
- [x] Botão **Imprimir DANFE** no detalhe do pedido, e pergunta "Deseja imprimir o DANFE agora?" logo após emitir. O DANFE sai do nosso gerador, não do link do Bling (que exige estar logado lá).
- [x] **DANFE**: quadro FATURA/DUPLICATAS (grupo `cobr` do XML, escondido em nota à vista) e **V. APROX. TRIBUTOS** (`vTotTrib`, exigido pela Lei 12.741/2012). Comparação feita contra uma DANFE real que o cliente emite hoje no sistema antigo.
- [x] DANFE de **homologação** (`tpAmb = 2`) sai carimbado "SEM VALOR FISCAL": a nota é autorizada e tem protocolo, então sem o carimbo o papel sairia idêntico ao de uma nota real.
- [x] Assinatura do software no rodapé do DANFE (`NOME_SISTEMA` / `FABRICANTE_SISTEMA` em `lib/constantes.ts`).

**Decisões de escopo registradas:**
- O certificado digital continua **só no Bling** — é ele que assina e transmite pra Sefaz. Nosso sistema nunca fala com a Sefaz; na entrada, só lê XML já autorizado (não precisa de certificado nenhum).
- Consultar a Sefaz direto (webservice `NFeDistribuicaoDFe`, pra puxar nota de entrada sem depender do Bling) foi avaliado e **adiado**: exige certificado A1 no nosso servidor, SOAP com assinatura XML e o fluxo de manifestação do destinatário. Mesma infraestrutura que o CT-e vai precisar — vale fazer os dois juntos.
- O lançamento da entrada guarda **quantidade e custo unitário**, sem ICMS/ST/IPI. Em nota com substituição tributária o custo real é maior que o registrado, e isso aparece no Lucro/DRE como margem melhor que a verdadeira. **Pendente de decisão do cliente**: só exibir os impostos na conferência, ou compor o custo real (custo + ST + IPI + frete rateado).

## 2026-08-19 — Coerência de módulos e o que falta pra ser ERP

Reorganização do menu (feita):
- [x] Grupo **Vendas** (Pedido de Venda, Orçamentos, Clientes) espelhando **Compras** (Cotação, Pedido de Compra, Entrada de NF, Fornecedores) — antes Clientes ficava solto enquanto Fornecedores estava dentro de Compras.
- [x] **Venda Balcão** continua fora do grupo, de propósito: é a tela mais aberta no dia a dia e cada clique a mais custa tempo de atendimento.
- [x] **Auditoria** saiu de Relatórios e foi pra Configurações — não é relatório de negócio, é administração do sistema.
- [x] **Notas Fiscais** e **Financeiro** ficam soltos, entre Compras e Marketing.

Ausências mapeadas, em ordem de importância (nenhuma feita ainda):
- [ ] **Movimentação de estoque (kardex)** — hoje o estoque é um número que sobe e desce, sem histórico de por que mudou. Sem isso, divergência de inventário não tem como ser investigada. É a lacuna mais séria.
- [ ] **Ajuste de estoque com motivo** (quebra, perda, contagem) — a tela de Estoque deixa editar a quantidade direto, sem registrar o porquê.
- [x] **Fluxo de caixa** — `/admin/financeiro/fluxo-caixa`. Realizado (venda paga + conta quitada, pela data do pagamento) por dia ou movimento a movimento, com saldo anterior e acumulado, mais a aba **Previsão**: contas em aberto dos próximos 30 dias partindo do caixa real de hoje. Sem tabela nova — caixa é leitura. Migration 064 trouxe `TAB_PEDIDO.pago_em`, que é a data que o caixa usa.
- [x] **Transportadoras como cadastro** — `/admin/transportadoras` (Vendas > Transportadoras), migration 065. O campo do pedido virou seleção do cadastro, que já traz o código de serviço da Frenet junto. O texto antigo continua sendo mostrado nos pedidos despachados antes disso.
- [x] **Permissão por tela** — catálogo em `lib/telas-admin.ts`, exceções em `TAB_USUARIO_PERMISSAO` (063). O menu esconde o que a pessoa não pode abrir e o layout do admin bloqueia por URL (middleware manda o `x-pathname`), então digitar o endereço na mão não passa. Edição pelo botão **Permissões** na tela de Usuários.

## Checklist pra retomar (sessão de 2026-08-19/20 parou aqui)

Na ordem combinada com o cliente. Os três primeiros já estão aprovados, é só executar.

**1. Custo real na entrada de NF** *(aprovado, é o próximo)*
- [ ] Ler ICMS-ST, IPI, desconto e frete por item do XML (`lib/nfe-xml.ts` já lê o resto).
- [ ] Compor o custo: valor unitário + ST + IPI + frete rateado, e usar esse custo no recebimento (`lib/compras.ts`, custo médio ponderado).
- [ ] Guardar a composição por item (migration nova em `TAB_COMPRA_ITEM`), pra auditoria: hoje só existe `custo_unitario`.
- [ ] Exibir o detalhamento na tela de lançamento — o cliente quer ver imposto na hora de lançar, tanto na entrada manual quanto na importação por XML.
- **Por que importa:** hoje o custo ignora ST e IPI, e o Lucro/DRE mostra margem melhor que a real.

**2. Foto do produto** *(JÁ EXISTIA — conferido em 2026-08-20)*
- [x] O cadastro de produto aceita várias fotos, e o input usa `capture="environment"`: no celular abre a câmera direto (`components/admin/produto-form.tsx`).
- [x] A Venda Balcão mostra a foto na grade de busca de produto, com "Sem imagem" quando não há (`components/admin/venda-balcao-conteudo.tsx`).
- Nada a fazer aqui. Se o cliente achar que falta algo, é ajuste de tamanho/posição, não funcionalidade.

**3. Visual do InMenteGestao — continuação** *(decisão: opção B, adotar o visual de lá; feito: ícones de linha, grade escura, barra de ferramentas clara, login)*
- [x] `ModalDetalhe` com navegação anterior/próximo entre os registros da grade ("1 de 3") e botão Editar no rodapé. *(feito 2026-08-20)*
- [x] Barra de status no rodapé da grade. *(feito 2026-08-20 — em 8 telas)*
- [x] Linha de filtros padronizada (`components/admin/linha-filtros.tsx`), aplicada em Notas Fiscais. *(falta levar às demais grades que têm filtro próprio)*
- [ ] Subtítulo nas telas de cadastro: "Duplo clique na linha para editar · Selecione para habilitar ações na barra".
- [x] Botão "Duplicar" — feito em Produtos. *(falta avaliar se faz sentido em Clientes/Fornecedores; em cadastro sem campo repetitivo, duplicar não ajuda)*
- [ ] Tela de Plano e Recursos no mesmo padrão das demais: barra com Gravar/Cancelar em vez de salvar a cada clique. Hoje cada marcação já grava sozinha (PUT em `/api/admin/recursos`), o que é seguro mas foge do padrão do sistema — o cliente pediu o CRUD explícito.

**3.1. Tela de Cores do Sistema — separar site e sistema**
- [ ] Hoje a tela de Cores altera um conjunto só, e o admin herda a cor da loja. O cliente quer **dois conjuntos separados**: cores do site público e cores do painel.
- [ ] Abrir para alteração **tudo o que pode ser alterado** (fundo, cabeçalho da grade, barra de ferramentas, botões por variante, selos de status, menu lateral), e não só a cor primária.
- [ ] Lembrar que a cor é por marca desde a migration 055 (Coisas Brasileiras e Porcelanas Brancas têm valores próprios).

**3.2. Ajustes vistos em tela (2026-08-20)**
- [x] ~~**Canais de venda desligados no plano continuam aparecendo nos filtros**~~ *(feito 2026-08-20: `canaisLiberados()` em `lib/canal-pedido.ts`, usado no filtro de Pedido de Venda)*. Texto original: — o seletor de canal (Pedido de Venda, Venda Balcão, relatórios) mostra Mercado Livre e Shopee mesmo com a integração desligada. Filtrar a lista de canais pelos recursos ligados **em todas as telas**, do mesmo jeito que já foi feito nas Configurações.
- [x] Campo de código de barras cortado na Venda Balcão. *(feito 2026-08-20)*
- [x] Botão "Importar do Mercado Livre / Shopee" só aparece com marketplace liberado. *(feito 2026-08-20)*

**3.3. Separar o que cada tela responde: Pedido de Venda x Venda Balcão** *(APROVADO pelo cliente em 2026-08-20 — executar a recomendação abaixo)*

Como está hoje: **Pedido de Venda Balcão** é a tela de *lançar* a venda presencial (PDV com carrinho), e **Pedido de Venda** é a *listagem de todos os pedidos*, de qualquer canal — site, WhatsApp, Instagram, balcão, Mercado Livre e Shopee (`TAB_PEDIDO.canal`, ver `lib/canal-pedido.ts`). Ou seja, a venda lançada no balcão aparece nas duas telas, o que confunde.

Opções a discutir com o cliente antes de mexer:
- **(a) Manter uma listagem só, com o filtro de canal em evidência.** É o modelo de ERP mais comum ("todo pedido é pedido, o canal é um atributo") e não duplica tela. Só precisa deixar o filtro de canal óbvio e tirar do filtro os canais que o plano não libera.
- **(b) Separar em duas listagens**: "Pedidos da loja" (site, WhatsApp, Instagram, balcão) e "Pedidos de marketplace" (Mercado Livre, Shopee, iFood). Faz sentido se a operação de marketplace for diferente — prazo de envio, etiqueta, regras próprias.
- **(c) Renomear pra desfazer a ambiguidade**: a tela de listagem vira "Pedidos" e a de lançamento continua "Pedido de Venda Balcão".

Dois fatos que pesam na decisão (levantados pelo cliente):
- A tela de Venda Balcão **deixa escolher o canal** da venda (Balcão presencial, WhatsApp, Instagram — `CANAIS_VENDA_BALCAO`), ou seja, ela não é só "presencial": é o lançamento manual de qualquer venda que não veio do site.
- Ela também tem uma **aba "Vendas" com histórico**, que mostra praticamente o mesmo que a listagem de Pedido de Venda, com filtros parecidos. É essa duplicação que incomoda.

Decisão: **uma listagem só** — executar assim:
- [x] Renomear a tela de listagem para **"Pedidos"**. *(feito 2026-08-20)*
- [x] Filtro de canal escondendo o que o plano não libera. *(feito 2026-08-20)*
- [x] Aba "Vendas" da Venda Balcão reduzida ao que foi lançado ali nos últimos 7 dias, com link para Pedidos. *(feito 2026-08-20)*
- [ ] Conferir se algum lugar do sistema aponta para a listagem esperando o nome antigo.

Racional:
- **Venda Balcão** fica sendo apenas o *lançamento* (PDV com carrinho e escolha de canal). A aba "Vendas" dela deixa de ser uma segunda listagem geral e passa a mostrar só **o que foi lançado ali recentemente** (as vendas do dia/da sessão), que é o uso real: conferir o que acabei de vender.
- **Pedido de Venda** vira **"Pedidos"**: a listagem única de tudo, de qualquer canal, com o filtro de canal em evidência e respeitando o plano.
- Assim cada tela responde uma pergunta diferente: "quero vender agora" e "quero achar um pedido". Hoje as duas respondem as duas, e por isso parecem iguais.

**4. Carregamento e desempenho** *(prioridade alta — o cliente comparou com o InMenteGestao, que "está bem mais ágil")*
- [x] Indicador de carregamento ao abrir tela — barra fina no topo, acionada pelo menu e pelas abas. *(feito 2026-08-20)*
- [ ] Lentidão ao **abrir as telas** e ao **entrar** (o clique em "Entrar" demora).

**Suspeita principal, a checar antes de qualquer otimização:** o banco está em `aws-1-us-west-2` (Oregon, EUA) e a VPS é da Hostinger. Se a VPS estiver no Brasil ou na Europa, **cada ida ao banco custa 150–250ms só de viagem**. A Visão Geral faz 7 consultas e o layout faz mais algumas — mesmo em paralelo, esse custo fixo aparece em toda tela. O InMenteGestao roda na Vercel, provavelmente perto do banco dele, o que explicaria a diferença sem que o código daqui seja pior.

- [ ] **Medir antes de mexer**: cronometrar um `SELECT 1` a partir da VPS. Acima de 100ms, o problema é distância, e nenhuma otimização de SQL resolve.
- [x] **Decidido em 2026-08-20: mover o banco para São Paulo.** Roteiro passo a passo em `DOCS/migracao-banco-sao-paulo.md` (o Supabase não muda a região de um projeto existente — é criar novo em `sa-east-1` e migrar os dados).
- [ ] Depois da migração: usar o pooler em **transaction mode** (porta 6543) e subir o `DB_POOL_MAX` de 3 para 5–10 — o teto baixo foi remendo para o `EMAXCONNSESSION` do session mode.
- [ ] No login: além das consultas, há o `bcrypt.compare` (custo proposital) e o carregamento da Visão Geral logo depois. Medir os dois separados antes de concluir.
- [ ] Descartar também: consultas sem índice nas grades e o `staleTimes.dynamic` do router.

**5. Favicon**
- [ ] A aba do navegador mostra o ícone genérico de globo no sistema e no site; deveria mostrar a logo da loja. Existe `app/icon.webp` — verificar por que não está sendo usado (formato/rota).

**6. Módulos que faltam pra ser ERP** *(mapeados, não iniciados)*
- [ ] Movimentação de estoque (kardex) — a lacuna mais séria.
- [ ] Ajuste de estoque com motivo (quebra, perda, contagem).
- [x] Fluxo de caixa, com projeção de saldo.
- [x] Transportadoras como cadastro.
- [x] Permissão por tela.

**7. Fiscal — próximos passos**
- [ ] CT-e / DACTE.
- [ ] Consulta direta à Sefaz (`NFeDistribuicaoDFe`) pra puxar nota de entrada sem depender do Bling — exige certificado A1 no servidor, SOAP com assinatura e manifestação do destinatário. Mesma infraestrutura do CT-e; fazer os dois juntos.

**Pendências operacionais**
- [ ] Aplicar em produção as migrations **059** (senha provisória) e **060** (plano e recursos). A 057 e a 058 já foram aplicadas.
- [ ] Validar se o 404 do Bling sumiu com o fallback `/notas-fiscais` → `/nfe`; se aparecer a mensagem nova, é permissão do app em developer.bling.com.br.
- [ ] Conferir no GitHub se o repositório está **privado** (não deu pra checar do ambiente de desenvolvimento).
- [ ] Testar a emissão de NF-e em homologação pelo Bling, ponta a ponta.

## Pendências pra retomar (sessão de 2026-07-28 parou aqui)

- [x] **Cadastro de Produtos**: formulário compacto + rótulos encurtados. Validado visualmente com o cliente em 2026-07-28.
- [ ] **Reajuste de Preços em massa** (`/admin/precos`): pedido do cliente pra permitir editar preço direto na grade (linha a linha) — feito, mas nunca foi confirmado visualmente pelo cliente que ficou como ele imaginou.
- [ ] Confirmar com o cliente se o CRUD de Clientes ficou como esperado (aba em vez de modal, endereço com CEP) — acabou de ser feito, sem validação visual ainda.
- [x] Auditoria dos demais formulários do admin atrás do bug de alinhamento — feita por varredura de rótulos longos dentro de grades multi-coluna. Corrigidos: Configurações ("Taxa fixa por transacao (R$)"), Cupons ("Valor minimo da compra (R$)", "Limite de usos (opcional)"), Compras ("Numero da nota (opcional)", "Vencimento (prazo de pagamento)"). Fornecedores, Usuários, Contas e Feedbacks conferidos e sem risco (rótulos curtos ou formulário de coluna única).
- [ ] Perguntar se falta mais algum campo no cadastro completo de Cliente (hoje: dados cadastrais + 1 endereço principal — não suporta múltiplos endereços por cliente no admin, só o site tem isso).

## 2026-07-28 — Padrão CRUD estilo InMenteGestao (barra de ferramentas + seleção de linha)

Pedido explícito do cliente: replicar o padrão visual do InMenteGestao (`C:\InMenteGestao\in-mente-gestao-sistema`) — barra de ferramentas com ícones (Novo/Editar/Excluir na grade; Gravar/Limpar/Cancelar no cadastro) e linha de tabela selecionável (clique seleciona e destaca, duplo-clique abre pra editar), em vez de só botões de texto soltos e ícones por linha.

- [x] `components/admin/barra-ferramentas.tsx` — porta do `BarraFerramentas.tsx` de lá, mesma estrutura de props (`botoes: {label, icon, onClick, variante, disabled}[]`) e cores por variante (primary/danger/success/warning/default).
- [x] Aplicado nas 11 telas do escopo: Categorias, Produtos (+ `produto-form.tsx`), Clientes, Banners, Fornecedores, Cupons, Usuários, Contas Financeiro, Tipos de Entrega, Feedbacks, Orçamentos (+ `orcamento-form.tsx`).
- Telas com grid de cards (Banners, Feedbacks) usam `ring-2 ring-amber-400` pra destacar seleção, em vez de fundo de linha (não têm tabela).
- Orçamentos manteve os ícones de ação específicos por status (Aprovar/Recusar/Converter) fora da barra — são transições de estado do domínio, não CRUD padrão; a barra cobre só Novo/Editar (desabilitado fora de "aberto")/Excluir (desabilitado se "convertido").
- **Fora de escopo por decisão do cliente**: Pedidos, Avaliações, Compras, Faixas de Frete, Reajuste de Preços, Estoque, Auditoria — não se encaixam no molde lista+formulário sem forçar a estrutura (moderação, formulário multi-etapa, edição inline, seleção múltipla própria, log só-leitura).

## 2026-07-28 — Badge de notas pendentes do Bling no menu do admin

- [x] Migration `033_bling_notas_pendentes_count.sql`: `TAB_INTEGRACAO_BLING.notas_pendentes`, atualizado pelo cron a cada execução (total atual, não só as novas). Aplicada em local e Neon.
- [x] `GET /api/admin/bling/notas-pendentes-count`: só lê do banco, nunca chama o Bling direto — o badge não pode bater na API deles toda vez que alguém abre o admin.
- [x] Badge amarelo no item "Compras" do menu lateral, mostrando a quantidade de notas pendentes quando > 0. Só admin.

## 2026-07-28 — Notificação de notas de fornecedor pendentes no Bling

- [x] Migration `032_bling_nota_notificada.sql`: `TAB_BLING_NOTA_NOTIFICADA` marca quais notas já geraram aviso, pra não notificar a mesma nota todo dia. Aplicada em local e Neon.
- [x] `app/api/cron/notas-bling-pendentes/route.ts`: verifica notas de entrada dos últimos 30 dias no Bling, cruza com o que já foi lançado (`TAB_COMPRA.bling_nota_id`) e com o que já foi notificado, e manda e-mail pro admin com as pendentes novas. Protegida por `CRON_SECRET` (obrigatório desde 2026-08-18 — sem a variável, a rota responde 401).
- [x] `vercel.json`: cron diário às 12h UTC (09h BRT) chamando essa rota. **Substituído em 2026-08-18** pelo crontab da VPS (`scripts/cron-vps.sh`, ver `DOCS/cron-vps.md`) — o `vercel.json` foi removido, já que a produção é Hostinger e o Vercel Cron nunca chegou a rodar lá.

## Correção: limite de estoque no carrinho não valia pro botão "Adicionar ao carrinho" da grade

- **Bug relatado pelo cliente**: os botões +/- respeitavam o estoque, mas clicar repetidamente em "Adicionar ao carrinho" no card da grade/home ia empilhando quantidade sem limite nenhum.
- **Causa raiz**: o limite só existia nos componentes de UI (`SeletorQuantidade`), nunca dentro da própria store (`adicionar()` em `lib/carrinho-store.ts`) — qualquer chamada que não passasse pelos botões +/- (como o clique direto no card) escapava do limite.
- [x] Corrigido na store, centralizado: `adicionar()` agora sempre limita ao `estoque` do item, somando com o que já está no carrinho — vale pra qualquer ponto de entrada, não só os botões +/-.
- [x] `ProdutoCard` também desabilita visualmente o botão ("Máximo no carrinho") quando a quantidade no carrinho já bate o estoque, em vez de deixar clicar sem efeito.

## 2026-07-28 — Site: seletor +/- de quantidade e exibição de estoque disponível

- [x] `components/loja/seletor-quantidade.tsx`: componente compartilhado com botões +/- (em vez do spinner nativo `type="number"`, que no mobile é ruim de usar e varia de navegador pra navegador). Reaproveitado no carrinho (drawer e página `/carrinho`) e no botão de adicionar da página de detalhe do produto.
- [x] `TAB_PRODUTO.estoque` agora acompanha o item no carrinho (`ItemCarrinho.estoque`, opcional pra não quebrar carrinho já salvo no localStorage de quem já tinha itens antes dessa mudança) — o "+" para de aumentar quando bate no estoque disponível, em vez de deixar pedir mais do que existe.
- [x] Quantidade disponível em estoque exibida tanto no card da grade (home + `/produtos`) quanto na página de detalhe do produto — texto normal se tiver bastante, aviso em âmbar se `estoque <= 5` ("Últimas X unidades"), vermelho se esgotado.

## 2026-07-28 — Assinatura secreta do webhook do Mercado Pago vira configurável pelo admin

- [x] `MERCADOPAGO_WEBHOOK_SECRET` deixou de ser só variável de ambiente — agora é `mercadopago_webhook_secret` em `TAB_INTEGRACAO_SEGREDO`, mesmo padrão dos outros segredos. Campo novo na aba Mercado Pago de Configurações > Integrações. `getSegredo()` cai pro env var (`MERCADOPAGO_WEBHOOK_SECRET`) se não houver nada configurado no banco, então nada quebra em deploys que ainda não migraram.
- [x] `app/api/webhooks/mercadopago/route.ts`: `assinaturaValida()` virou assíncrona pra usar `getSegredo()`.
- Com isso, os três segredos configuráveis (Mercado Pago, Frenet, Email) + a assinatura do webhook estão completos na tela — não falta mais nenhum campo pra essas integrações funcionarem via admin.

## 2026-07-28 — E-mail automático ao emitir NF-e

- [x] `templateNotaFiscalEmitida` em `lib/email.ts`, disparado por `POST /api/admin/pedidos/[id]/emitir-nfe` depois que a emissão no Bling é confirmada (fora da transação — falha no envio nunca desfaz a emissão, que já aconteceu de verdade). Cliente recebe o link do DANFE por e-mail automaticamente, sem o admin precisar mandar manualmente.
- O link também continua disponível manualmente na tela do pedido ("Ver DANFE"/"Ver PDF"), pro admin mandar por WhatsApp se quiser — os dois convivem, não é um ou outro.

## 2026-07-28 — Painel de pendências fiscais em Configurações > Bling

- [x] Migration `031_bling_ultimo_erro.sql`: `TAB_INTEGRACAO_BLING` ganha `ultimo_erro`/`ultimo_erro_em`. Aplicada em local e Neon.
- [x] `lib/bling.ts`: qualquer chamada que falhar (`chamarBling`) grava a mensagem de erro na integração; emissão e cancelamento bem-sucedidos limpam esse campo. Objetivo: o contador/admin não precisa entrar no site do Bling só pra descobrir que uma emissão falhou (ex: certificado digital não configurado, exatamente o caso real que motivou isso).
- [x] `Configurações > Integrações > Bling` mostra um card de "Pendência fiscal" com a última mensagem de erro e o horário, se houver. Some sozinho na próxima emissão/cancelamento com sucesso.

## 2026-07-28 — Estorno de estoque ao cancelar NF-e

- [x] `POST /api/admin/pedidos/[id]/cancelar-nfe` agora devolve ao estoque a quantidade de cada item do pedido, dentro da mesma transação do cancelamento no Bling — mesmo padrão de ERP (cancelar a nota de saída estorna a mercadoria). Antes, cancelar a nota não mexia em estoque nenhum, e não existia NENHUMA rotina de devolução automática no sistema (nem no cancelamento do pedido em si).
- [x] Dispara `notificarClientesEstoqueVoltou()` pra cada produto do pedido depois do estorno, caso o produto tenha voltado de 0 pra positivo e existam clientes esperando aviso.
- [x] Aviso visual adicionado no formulário de cancelamento (`/admin/pedidos/[id]`) avisando que o estoque será estornado, antes do admin confirmar.
- **Ainda não cobre**: cancelamento do **pedido** (status → "cancelado") sem cancelar a nota separadamente não estorna estoque. Se isso também for necessário, avisar pra implementar.

## 2026-07-28 — Ações rápidas no card de produto (site: home + catálogo)

- [x] `ProdutoCard` (usado na home e no `/produtos`) virou client component e ganhou: coração de favoritar (ícone, redireciona pro login se não estiver logado) e botão "Adicionar ao carrinho" — ambos direto no card da grade, sem precisar abrir o produto. Botão desabilita e mostra "Esgotado" quando `estoque <= 0`.
- [x] Servidor (`app/(loja)/page.tsx` e `app/(loja)/produtos/page.tsx`) passa a consultar `TAB_LISTA_DESEJOS` do cliente logado (se houver sessão) numa query só, montando um `Set` de produto_ids favoritados — evita N+1 (uma query por card) e evita esperar um fetch client-side pra saber o estado inicial do coração.

## Checklist de go-live (produção de verdade)

Marcar conforme for resolvendo. Levantado em 2026-07-27.

- [ ] **Banco de dados**: produção usa Postgres no Supabase, configurado na `DATABASE_URL` da VPS. Confirmar que todas as migrations (`000` até a mais recente) estão aplicadas nesse banco.
- [ ] **Bling**: trocar do app de teste pro app de produção no painel Bling (se for o caso). Reconectar em Configurações > Integrações > Bling com a conta real da loja (fluxo OAuth já pronto). `BLING_CLIENT_ID`/`BLING_CLIENT_SECRET` do app de produção no `.env` da VPS.
- [ ] **Mercado Pago**: token de acesso e chave pública **de produção** (não `TEST-...`) em Configurações > Integrações > Mercado Pago. Cadastrar a URL do webhook (`https://seudominio.com/api/webhooks/mercadopago`) no painel do Mercado Pago e colocar a "assinatura secreta" gerada em Configurações > Integrações > Mercado Pago (já é configurável pelo admin desde 2026-07-28, não precisa mais mexer em variável de ambiente).
- [ ] **Frenet**: token real da conta em Integrações > Frenet. CEP de origem configurado em Configurações > Frete. `ShippingServiceCode` reais das transportadoras usadas, pra validação automática de rastreio funcionar (pendente).
- [ ] **Email**: credenciais reais (Gmail com senha de app, ou outro provedor) em Integrações > Email.
- [ ] **Infraestrutura**: `AUTH_SECRET` de produção gerado (valor aleatório longo). Domínio próprio apontado pro host escolhido (`NEXT_PUBLIC_SITE_URL` correto). Cloudinary configurado (`CLOUDINARY_*`) — não é necessário: a produção é VPS na Hostinger, com disco persistente.
- [x] **Cron das notas do Bling** (`app/api/cron/notas-bling-pendentes`): resolvido em 2026-08-18. Disparo agora é pelo crontab da VPS chamando `scripts/cron-vps.sh`, que faz o `curl` com o header `Authorization: Bearer $CRON_SECRET`. Passo manual pendente no servidor: instalar as linhas do crontab e definir `CRON_SECRET` no `.env` (ver `DOCS/cron-vps.md`).

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

**Carta de Correção Eletrônica (CC-e)**: usuário pediu pra completar o fluxo (cancelamento já existe). **Não implementada ainda** — a documentação do Bling disponível via Context7 é enxuta e não trouxe um endpoint confirmado pra CC-e; decidido não "chutar" o formato de uma ação fiscal sem confirmação (mesmo cuidado que já vale pra NF-e/PagBank: pendente de validação contra conta real). **Por enquanto, CC-e fica manual direto no painel do Bling** (recurso que já existe lá). Retomar implementação quando houver acesso a uma conta Bling real pra validar o endpoint certo.

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

## 2026-07-28 — Clientes: cadastro completo (endereço + CEP) e virou aba, não modal

- [x] Tela de Clientes (`clientes-conteudo.tsx`) reescrita pra abrir o formulário numa aba própria (Lista/Formulário, igual Categorias, Cupons etc.), em vez de modal — pedido explícito do cliente.
- [x] Cadastro/edição de cliente ganhou seção de endereço completo (CEP, logradouro, número, complemento, bairro, cidade, estado), gravado em `TAB_ENDERECO` com `principal = true` (mesma tabela que o checkout do site usa, cliente já podia ter endereço via lá — só o admin não tinha como editar).
- [x] CEP com autopreenchimento via BrasilAPI (`https://brasilapi.com.br/api/cep/v1/{cep}`), mesmo padrão já usado no checkout público (`app/(loja)/checkout/page.tsx`).
- [x] `GET /api/admin/clientes/[id]` criado (não existia) — traz cliente + endereço principal pro formulário de edição. `POST`/`PUT` de clientes agora fazem upsert do endereço principal quando `cep` + `logradouro` vêm preenchidos.

## 2026-07-28 — Campos numéricos: máscara de NCM e bloqueio de letras

- [x] `mascaraNCM()` — NCM exibido no padrão da Receita (`0000.00.00`), limitado a 8 dígitos. Guardado no banco só com os dígitos.
- [x] `somenteDigitos()` e `mascaraDecimal()` / `decimalParaNumero()` em `lib/mascaras.ts`. Estoque e estoque mínimo passaram a aceitar só dígitos; peso e dimensões aceitam dígitos com uma vírgula (padrão BR), convertidos pra ponto só na hora de salvar.
- [x] `components/ui/input.tsx` bloqueia as teclas `e`, `E`, `+` e `-` em qualquer campo numérico (`type="number"`, `inputMode="numeric"` ou `"decimal"`). O `type="number"` do navegador deixa digitar notação científica e sinal, o que virava `NaN` ao salvar. Corrigido no componente compartilhado, cobrindo os ~19 campos numéricos do admin de uma vez.

## 2026-07-28 — Alinhamento de grade: `items-start` + rótulo de 1 linha

Fechamento do assunto do desalinhamento. A regra final é **`items-start` na grade + rótulo que cabe em 1 linha**:

- `items-start` alinha as células pelo topo. Como todos os rótulos têm a mesma altura (`min-h-5`), os campos ficam na mesma linha — e conteúdo que aparece *abaixo* do campo (mensagem de validação do EAN, input escondido que o `Select` do base-ui renderiza) não desloca mais nada.
- `items-end` foi tentado antes e estava errado: alinhava pelo rodapé, então o input escondido do `Select` empurrava o rótulo "Valor" pra baixo no Reajuste de Preços, e a mensagem de validação do EAN deslocaria o campo pra cima quando aparecesse.
- "Cod. de barras *" virou **"EAN *"** — mesmo encurtado ainda quebrava linha na coluna estreita (o `*` caía sozinho na 2ª linha).

## 2026-07-28 — Convenção: rótulo curto + explicação no balão de dica

Fechando o assunto do desalinhamento de grade, a regra do projeto passa a ser: **o rótulo (`<Label>`) precisa caber em 1 linha; todo texto explicativo vai no `<CampoDica>`** (ícone "?" ao lado). `components/ui/label.tsx` reserva `min-h-5` (1 linha) — rótulo que quebra linha fica mais alto que os vizinhos da mesma grade e desalinha os campos abaixo.

Rótulos encurtados nesta rodada (explicação movida pro balão): Produtos ("Cod. de barras", "SKU", "Promocional (R$)", "Clube (R$)"), Configurações ("Taxa fixa (R$)"), Cupons ("Valor minimo (R$)", "Limite de usos"), Compras ("Numero da nota", "Vencimento").

## 2026-07-28 — Produtos: formulário mais compacto (menos espaçamento)

- [x] Ajuste de densidade no `produto-form.tsx` a pedido do cliente ("ERP geralmente é mais apertado") — `space-y-6`→`space-y-4`, `gap-6`→`gap-4`, `gap-4`→`gap-3` nos grids, `CardHeader` com `pb-2`. Mudança só visual/espaçamento, sem alterar campos.
- [ ] **Pendente**: cliente ainda não validou visualmente se ficou bom o suficiente — revisar com ele na próxima sessão antes de considerar fechado.

## 2026-07-28 — Botão "Limpar" nas telas de cadastro (padrão CRUD do InMenteGestao)

- [x] Adicionado botão "Limpar" (entre Cancelar e Salvar) em todos os 11 formulários de cadastro do admin: Produtos, Orçamentos, Clientes, Categorias, Banners, Fornecedores, Cupons, Usuários, Contas (Financeiro), Tipos de Entrega, Feedbacks. Reseta os campos ao estado original — em branco se for um cadastro novo, ou de volta aos valores salvos se estiver editando — sem fechar o formulário.

## 2026-07-28 — Relatórios: estoque zerado, vendas de hoje, ordenar mais/menos vendidos

- [x] Relatório de Estoque: novo filtro "Somente estoque zerado" + card "Zerados" no resumo (antes só tinha "abaixo do mínimo").
- [x] Relatório de Vendas: cards "Vendas de hoje" e "Faturamento de hoje" (reaproveita a lista de pedidos do período já carregada, filtrando por data de hoje — só funciona se o período escolhido cobrir a data atual, o que é o padrão).
- [x] "Produtos mais vendidos" perdeu o `LIMIT 10` da query (agora traz todos do período) e ganhou um botão de alternar ordenação (mais vendidos ↔ menos vendidos), pra identificar também os produtos parados.

## 2026-07-27 — Rótulo de campo com texto longo desalinhava a grade do formulário

- [x] Causa: `components/ui/label.tsx` não reservava altura fixa — um rótulo mais comprido que quebra em 2 linhas (ex: "Codigo de barras (GTIN/EAN-13) *" + ícone de dica) ficava mais alto que os rótulos vizinhos na mesma grade, empurrando só aquele campo pra baixo e desalinhando a linha inteira (reportado pelo cliente com print do Cadastro de Produtos).
- [x] Corrigido uma única vez no componente compartilhado (`min-h-9`, reserva espaço pra até 2 linhas) — resolve em qualquer tela que use `<Label>`, não só no formulário de produto.

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
- [x] Definido: a produção roda em VPS na Hostinger com o banco no Supabase (o Neon era do ambiente antigo). A `DATABASE_URL` fica só no `.env` da VPS, nunca versionada.

## Para replicar no outro sistema

Este plano assume a mesma base do Coisas Brasileiras (`TAB_PRODUTO`, `TAB_CONTA`, `TAB_CONFIGURACAO`, padrão de migrations numeradas em `migrations/*.sql`, rotas `app/api/admin/*` protegidas por `exigirSessao()`/`exigirAdmin()`). Ao portar para o outro projeto, primeiro confirmar que essas mesmas tabelas-base existem (ou adaptar os nomes) antes de copiar as migrations das fases acima.
