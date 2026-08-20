# Manual do Sistema — Coisas Brasileiras

Este manual explica, em linguagem simples, como funciona o site da loja (o que o cliente vê e usa) e o painel administrativo (o que o dono da loja usa no dia a dia) — campo por campo, botão por botão, e com o cálculo por trás de todo número que a tela mostra. Não é preciso nenhum conhecimento técnico para acompanhar.

## Sumário

**Parte 1 — Site público**
Cabeçalho e rodapé · Home · Catálogo · Página de produto · Carrinho · Checkout · Criar conta e login · Minha conta · Favoritos · Confirmação do pedido · Sobre nós · Contato · Aprovação de orçamento por link

**Parte 2 — Painel administrativo**
Visão Geral · Venda Balcão · Grupo Vendas (Pedido de Venda, Orçamentos, Clientes) · Grupo Produtos (Cadastro de Produtos, Categorias, Estoque, Reajuste de Preços) · Grupo Compras (Cotação, Pedido de Compra, Entrada de NF, Fornecedores) · Notas Fiscais · Financeiro · Grupo Marketing (Cupons, Banners, Sobre Nós, Feedbacks, Avaliações, Clube) · Grupo Relatórios (Vendas, Lucro/DRE, Estoque) · Grupo Configurações (Usuários, Configurações da Loja, Pastas das Notas Fiscais, Auditoria) · Trocar minha senha

**Parte 3 — Perguntas frequentes e avisos gerais**

---

# Parte 1 — Site público

É o site que os clientes acessam para conhecer e comprar os produtos.

## Cabeçalho (aparece em todas as páginas)

Resumo: barra fixa no topo com a logo, o menu de navegação e os ícones de busca, favoritos, conta e carrinho.

- **Logo e nome da loja**: clicar volta para a página inicial.
- **"Todos os produtos"**: leva para o catálogo completo.
- **"Categorias"**: um menu que abre ao passar o mouse (no computador) mostrando as categorias e, quando existem, as subcategorias de cada uma. Clicar em uma leva para o catálogo já filtrado por aquela categoria.
- **"Destaques"**: leva para a seção de destaques na página inicial.
- **"Sobre nós"**: leva para a página institucional.
- **"Contato"**: leva para a página de contato.
- **Ícone de área administrativa** (visível só no computador): leva para a tela de login do painel administrativo.
- **Ícone de lupa (buscar)**: leva para o catálogo de produtos.
- **Ícone de coração (favoritos)**: se o cliente estiver logado, vai para a página "Meus favoritos"; se não estiver, vai para a tela de login.
- **Ícone de pessoa (minha conta)**: se logado, vai para "Minha conta"; se não, vai para a tela de login.
- **Ícone de sacola (carrinho)**: leva para a página do carrinho. Mostra uma bolinha com o número de itens quando há produtos no carrinho.
- **Botão de menu (☰, aparece só no celular)**: abre/fecha uma versão da navegação (mesmos links acima) empilhada, própria para telas pequenas.

## Rodapé (aparece em todas as páginas)

Resumo: bloco no final da página com logo, texto sobre a loja, links institucionais e canais de contato.

- Logo, nome da loja e um texto de apresentação (configurado pelo admin; se não houver, mostra um texto padrão).
- Links **"Sobre nós"** e **"Contato"**.
- Avisos fixos: "Envio para todo o Brasil" e "Pix, cartão e boleto".
- Link para **WhatsApp** (só aparece se o número estiver cadastrado) - abre uma conversa já com uma mensagem pronta.
- Link para o **Instagram** (só aparece se cadastrado).
- Link de **e-mail** (só aparece se cadastrado) - abre o programa de e-mail do cliente.
- Direitos autorais com o ano atual e nome da loja.

## Botão flutuante do WhatsApp

Resumo: um botão verde redondo, fixo no canto inferior direito da tela, em todas as páginas. Só aparece se a loja tiver um número de WhatsApp cadastrado. Clicar abre uma conversa no WhatsApp com uma mensagem inicial já preenchida (configurável pelo admin; se não houver, usa uma mensagem padrão).

---

## Home (página inicial)

Resumo: primeira página que o cliente vê, com banners promocionais, categorias, produtos mais vendidos, destaques e depoimentos de clientes.

- **Banners rotativos** (carrossel): imagens/frases cadastradas pelo admin, trocam automaticamente a cada 5 segundos. Se nenhum banner for cadastrado, aparecem 3 banners padrão de exemplo.
  - Setas nas laterais (◀ ▶): passam para o banner anterior/próximo.
  - Bolinhas na parte de baixo: clicar em uma pula direto para aquele banner.
  - Clicar em qualquer parte do banner leva ao link configurado (ou para "Todos os produtos" se não houver link).
- **"Navegue por categoria"**: grade com as categorias principais cadastradas. Só aparece se houver categorias. Clicar em uma categoria abre o catálogo já filtrado por ela.
- **"Mais vendidos"**: só aparece se houver produtos vendidos pelo site (vendas feitas no balcão não contam aqui). Mostra até 8 produtos, do mais vendido para o menos vendido.
- **"Destaques da loja"**: mostra até 8 produtos cadastrados mais recentemente. Se a loja ainda não tem produtos, aparece a mensagem "Nenhum produto cadastrado ainda. Assim que o admin cadastrar produtos, eles aparecem aqui."
- **"O que nossos clientes dizem"**: até 6 depoimentos (nome, foto, nota em estrelas e texto) cadastrados pelo admin. Só aparece se houver depoimentos cadastrados.

Cada produto exibido usa o **cartão de produto** (ver detalhes na seção abaixo).

### Cartão de produto (usado na Home, Catálogo e Favoritos)

- Foto do produto (ou um ícone de sacola, se não houver foto).
- Nome do produto.
- Preço: se o produto tiver preço promocional, mostra o preço "de" riscado e o "por" em destaque. Se o cliente for assinante do Clube e o produto tiver Preço Clube, mostra a etiqueta "Preço Clube", o preço riscado e o preço com desconto do clube, além do selo com a porcentagem de desconto (ex: "20% OFF"). Se o cliente não for assinante mas o produto tem Preço Clube, aparece uma linha avisando quanto os assinantes pagariam.

**Como o preço exibido é decidido:** o sistema sempre mostra o menor preço que aquele cliente específico tem direito. Ordem de prioridade: 1) se é assinante do Clube e o produto tem Preço Clube, usa o Preço Clube; 2) senão, se o produto tem preço promocional, usa o promocional; 3) senão, usa o preço normal cadastrado. Quando o Preço Clube foi cadastrado como percentual (ver Cadastro de Produtos), o valor exibido é: Preço normal − (Preço normal × percentual ÷ 100).
- Aviso de estoque: "Esgotado" (em vermelho) se não houver estoque; "Últimas X unidades" (em laranja) se restarem 5 ou menos; ou "X em estoque" nos demais casos.
- **Ícone de coração** (canto superior direito da foto): favorita/desfavorita o produto. Se o cliente não estiver logado, é levado para a tela de login.
- **Botão "Adicionar ao carrinho"**: adiciona 1 unidade do produto ao carrinho sem sair da página (o botão mostra "Adicionado" por 1,5 segundo). Fica desabilitado e mostra "Esgotado" se não houver estoque, ou "Máximo no carrinho" se a quantidade já no carrinho atingiu o estoque disponível.
- Clicar em qualquer parte do cartão (fora dos botões) leva à página do produto.

---

## Catálogo de produtos

Resumo: lista todos os produtos ativos da loja, com opção de busca por nome e filtro por categoria (pelo link clicado no menu).

- **Título da página**: "Todos os produtos" (quando não há filtro de categoria) ou "Produtos" (quando há).
- **Campo de busca** ("Buscar produtos..."): campo de texto opcional. Ao digitar e apertar Enter (ou o botão de busca do teclado), filtra os produtos cujo nome contém o texto digitado. O resultado da busca fica salvo no endereço da página, então pode ser compartilhado.
- Lista de produtos (cartões de produto, ver seção acima), filtrados pela categoria escolhida no menu e/ou pelo texto buscado.
- Se nenhum produto for encontrado, mostra "Nenhum produto encontrado para '[busca]'." ou "Nenhum produto encontrado.".
- Observação: filtrar por uma categoria principal também traz os produtos das subcategorias dela.

---

## Página de produto

Resumo: mostra todos os detalhes de um produto específico, com fotos, preço, opção de compra e avaliações de outros clientes.

- **"Voltar para todos os produtos"**: link no topo que volta ao catálogo.
- **Galeria de fotos**: foto principal grande e, se houver mais de uma imagem, miniaturas abaixo - clicar em uma miniatura troca a foto principal.
- **Nome do produto**.
- **Nota média em estrelas**: só aparece se o produto já tiver avaliações aprovadas; mostra a média (ex: "4.5") e o total de avaliações.
- **Preço**: mesma lógica do cartão de produto (preço normal, promocional ou Clube). Quando o produto tem Preço Clube e o cliente não é assinante, aparece um aviso com o valor que os assinantes pagam e um link **"Saiba mais"** que leva para "Minha conta" já preparado para iniciar a assinatura do Clube.
- **Descrição do produto** (texto livre cadastrado pelo admin), se houver.
- Aviso fixo: "Envio para todo o Brasil".
- **Botão de favoritar** ("Adicionar à lista de desejos" / "Na lista de desejos"): mesma lógica do coração do cartão, mas em formato de botão com texto.
- **Seletor de quantidade** (botões "-" e "+"): escolhe quantas unidades comprar, limitado ao estoque disponível.
- **Botão "Adicionar ao carrinho"**: adiciona a quantidade escolhida ao carrinho (some no lugar do texto "Adicionado" por 1,5 segundo).
- **Botão "Comprar agora"**: adiciona o produto ao carrinho e já leva direto para o checkout.
- Se o produto estiver esgotado (estoque zero), os botões de compra somem e aparece o aviso de estoque:
  - **Formulário "Produto esgotado - avise-me quando chegar"**: campo de **e-mail** (obrigatório, precisa ser um e-mail válido) e botão **"Avisar"**. Ao enviar, mostra a mensagem "Pronto! Avisamos por e-mail assim que o produto voltar ao estoque."
- Indicador de estoque: "Últimas X unidades em estoque" (em laranja, quando restam 5 ou menos) ou "X em estoque".

### Avaliações (na página de produto)

- Se o cliente não estiver logado: mostra "Entre na sua conta pra avaliar este produto (disponível pra quem já comprou)." com link para o login.
- Se estiver logado mas nunca comprou o produto: a área de avaliação não aparece.
- Se já comprou e ainda não avaliou:
  - **Seletor de nota**: 5 estrelas clicáveis, de 1 a 5. É obrigatório escolher uma nota - se tentar enviar sem escolher, aparece "Escolha uma nota".
  - **Campo de comentário** (opcional): caixa de texto livre.
  - **Botão "Enviar avaliação"**: envia a nota e o comentário. Depois de enviada, mostra "Avaliação enviada! Ela aparece aqui assim que for aprovada." (ou seja, passa por aprovação do admin antes de aparecer publicamente).
- Se já avaliou: mostra "Você já avaliou este produto.".
- **Lista de avaliações aprovadas**: nota em estrelas, nome do cliente, data e comentário (se houver) de cada avaliação já aprovada pelo admin. Se não houver nenhuma, mostra "Nenhuma avaliação ainda.".

---

## Carrinho de compras

Resumo: mostra os produtos que o cliente adicionou, permite ajustar quantidades, aplicar cupom de desconto e ver o total antes de ir para o checkout.

- Se o carrinho estiver vazio: mostra "Seu carrinho está vazio" e o botão **"Ver produtos"** (leva ao catálogo).
- **Lista de itens**: para cada produto, mostra foto, nome (link para a página do produto), preço unitário, seletor de quantidade e subtotal do item.
  - **Botão "X" (remover item)**: remove o produto do carrinho.
  - **Seletor de quantidade** (−/+): ajusta quantas unidades daquele produto, limitado ao estoque.
- **Campo de cupom**: campo de texto "Código do cupom" e botão **"Aplicar"**. Se o cupom for inválido, mostra a mensagem de erro devolvida (ex.: "Cupom inválido"). Se aplicado com sucesso, mostra "Cupom [CÓDIGO] aplicado (-R$ X)" com um "X" para remover o cupom.
- **Resumo "Total no carrinho"**:
  - Subtotal (soma dos produtos).
  - Frete: calculado automaticamente com base no valor do carrinho; mostra "Grátis" quando for zero.
  - Aviso "Frete grátis em compras acima de R$ X" quando aplicável e o frete ainda não for grátis.
  - Linha de desconto do cupom, se houver.
  - Total final.
  - **Botão "Continuar para a finalização de compra"**: leva ao checkout.

**Como o total é calculado:** Total = Subtotal dos produtos + Frete − Desconto do cupom. O frete some da conta (fica "Grátis") automaticamente quando o subtotal atinge o valor mínimo configurado em Configurações > Frete — é por isso que o total às vezes cai de repente quando o cliente adiciona mais um item ao carrinho.

## Gaveta do carrinho (aparece sobre qualquer página, ao clicar no ícone de carrinho no cabeçalho)

- Painel que desliza da direita, com a lista resumida dos itens (foto, nome, seletor de quantidade, subtotal) e o subtotal geral.
- **Botão "X" (fechar)** e clicar fora do painel: fecha a gaveta.
- **Botão "Continuar comprando"**: fecha a gaveta e mantém o cliente na página atual.
- **Botão "Ver carrinho"**: fecha a gaveta e leva para a página completa do carrinho.
- Se vazio, mostra "Seu carrinho está vazio.".

---

## Checkout (finalização de compra)

Resumo: tela onde o cliente informa o endereço de entrega, escolhe a forma de envio e confirma o pedido antes de ser levado ao Mercado Pago para pagar.

- Se o cliente não estiver logado: mostra "Entre na sua conta - Você precisa estar logado para finalizar a compra." com o botão **"Entrar"** (leva à tela de login e volta automaticamente para o checkout depois).
- Se o carrinho estiver vazio: mostra "Seu carrinho está vazio" e o botão **"Ver produtos"**.

### Formulário "Endereço de entrega"

- **CEP** (obrigatório, só números, até 9 caracteres contando o traço): ao completar 8 dígitos, o site busca automaticamente o endereço (rua, bairro, cidade, estado) e preenche os campos abaixo sozinho. Enquanto busca, aparece um ícone de carregamento. Se a busca falhar, o cliente preenche o endereço manualmente - não impede de continuar.
- **Número** (obrigatório): número do imóvel.
- **Logradouro** (obrigatório): nome da rua, preenchido automaticamente pela busca do CEP (pode ser editado).
- **Complemento** (opcional): apartamento, bloco, etc.
- **Bairro** (obrigatório).
- **Cidade** (obrigatório).
- **Estado (UF)** (obrigatório, até 2 letras, sempre convertido para maiúsculas).
- **Botão "Confirmar pedido"**: envia o pedido. Enquanto processa, mostra "Finalizando...". Se der erro, mostra a mensagem de erro (ex.: "Não foi possível finalizar o pedido"). Se der certo, o carrinho é esvaziado e o cliente é levado para a página do Mercado Pago para pagar (Pix, cartão ou boleto).
- Aviso abaixo do botão: "Você será redirecionado para o Mercado Pago para concluir o pagamento (Pix, cartão ou boleto, conforme disponibilidade)."

### Resumo do pedido (lateral)

- Lista dos itens com quantidade e subtotal.
- Subtotal geral.
- **Opções de frete**: só aparecem depois que o CEP é preenchido (precisa do estado identificado). Enquanto calcula, mostra "Calculando opções de frete...". Se não encontrar nenhuma opção, mostra "Nenhuma opção de frete encontrada.". Cada opção mostra transportadora, serviço, prazo em dias úteis (se informado) e valor ("Grátis" quando zero) - o cliente escolhe uma clicando nela (a mais barata já vem pré-selecionada).
- Aviso de frete grátis acima de determinado valor, se configurado.
- **Campo de cupom**: mesmo comportamento do carrinho.
- Linha de desconto do cupom, se aplicado.
- Total final.

**Como o frete é calculado:** primeiro o sistema confere se o subtotal já passou do valor de "frete grátis acima de R$ X" (Configurações > Frete) — se passou, o frete é zero e pronto, sem nem precisar calcular o resto. Se não passou, e a loja tiver a Frenet configurada, ele pede uma cotação real pra Frenet com base no CEP do cliente e no peso somado dos produtos do carrinho, trazendo as opções reais de transportadora. Sem a Frenet configurada, ele usa a tabela de faixas por região/peso cadastrada em Configurações > Frete; e, na ausência de qualquer faixa que sirva, cai no valor fixo configurado como último recurso — assim o checkout nunca trava sem oferecer nenhuma opção de frete.

---

## Criar conta (cadastro)

Resumo: formulário para o cliente criar uma conta na loja.

- **Nome** (obrigatório): texto livre.
- **Email** (obrigatório): precisa ser um e-mail válido.
- **Telefone** (opcional): campo numérico com máscara de telefone brasileiro aplicada automaticamente enquanto digita.
- **Senha** (obrigatório): campo de senha com opção de mostrar/ocultar os caracteres digitados.
- **Botão "Criar conta"**: envia o cadastro. Mostra "Criando conta..." enquanto processa. Se der erro, mostra a mensagem (ex.: "Não foi possível criar a conta"). Se der certo, o cliente já entra logado e é levado para a página inicial.
- Link **"Entrar"**: para quem já tem conta, leva à tela de login.

## Entrar (login)

Resumo: formulário para o cliente acessar a conta já existente.

- **Email** (obrigatório).
- **Senha** (obrigatório, com opção de mostrar/ocultar).
- **Botão "Entrar"**: mostra "Entrando..." enquanto processa. Se der erro, mostra a mensagem (ex.: "Não foi possível entrar"). Se der certo, o cliente é levado de volta para a página de onde veio (por exemplo, o checkout) ou para a página inicial.
- Link **"Cadastre-se"**: para quem ainda não tem conta.

---

## Minha conta

Resumo: painel central do cliente logado, com dados pessoais, assinatura do Clube, lista de desejos, endereços salvos e histórico de pedidos. Se o cliente não estiver logado, é automaticamente enviado para a tela de login.

- **Botão "Sair"** (topo): encerra a sessão do cliente e volta para a página inicial.

### Dados pessoais

- **Nome** (obrigatório): editável.
- **Email**: mostrado mas não pode ser alterado por aqui.
- **Telefone** (opcional): com máscara de telefone.
- **CPF** (opcional): com máscara de CPF/CNPJ.
- **Botão "Salvar alterações"**: mostra "Salvando..." enquanto processa e, ao concluir, a palavra "Salvo!" aparece ao lado por 2 segundos.

### Clube

- Se o cliente **não é assinante** (ou cancelou): mostra a mensalidade do Clube e o texto "Assine o Clube por R$ X/mês e tenha preço exclusivo em produtos selecionados." com o **botão "Assinar o Clube"**. Ao clicar, abre em uma nova aba a página de pagamento do Mercado Pago para a assinatura (mostra "Abrindo..." enquanto processa). Se o valor da mensalidade ainda não estiver configurado, o botão fica desabilitado com o aviso "Assinatura ainda não disponível.".
- Se há uma tentativa de assinatura **pendente** (pagamento não concluído): mostra o aviso "Sua última tentativa de assinatura não foi concluída. Clique abaixo pra tentar de novo." junto com o botão de assinar.
- Se **já é assinante ativo**: mostra o status ("Ativa", "Pausada" ou "Cancelada"), o valor da mensalidade e a data da próxima cobrança (quando houver). Se estiver "Ativa", aparece o **botão "Cancelar assinatura"**, que abre uma janela de confirmação:
  - **Janela "Cancelar assinatura do Clube?"**: aviso de que o cliente perde o preço exclusivo imediatamente, mas pode assinar de novo depois. Botões **"Manter assinatura"** (fecha sem fazer nada) e **"Cancelar assinatura"** (confirma o cancelamento).
- Se algo der errado, aparece a mensagem de erro correspondente.
- Observação: se o cliente chegar a essa tela vindo do link "Saiba mais" na página de um produto com Preço Clube, e ainda não for assinante, o site já dispara o fluxo de assinatura automaticamente.

### Lista de desejos (dentro de Minha conta)

- Lista dos produtos favoritados: foto, nome (link para o produto), preço (com "Esgotado" em vermelho se aplicável).
- **Botão "X" (remover)**: tira o produto da lista de desejos.
- Se vazia: "Nenhum produto favoritado ainda.".

### Endereços salvos

- Lista os endereços já usados em compras anteriores (criados automaticamente no primeiro checkout - não há formulário para cadastrar endereço manualmente aqui).
- Se não houver nenhum: "Nenhum endereço salvo ainda - ele é criado automaticamente no primeiro checkout.".

### Meus pedidos

- Lista todos os pedidos do cliente: status (ex.: "Aguardando pagamento", "Pago", "Em separação", "Enviado", "Entregue", "Cancelado"), código de rastreio (se houver), data e valor total.
- Clicar em um pedido leva à página de confirmação/acompanhamento daquele pedido.
- Se não houver pedidos: "Você ainda não fez nenhum pedido.".

---

## Favoritos

Resumo: lista separada (fora de "Minha conta") com todos os produtos que o cliente favoritou. Exige login - se não estiver logado, é enviado para a tela de login.

- Lista de produtos favoritados: foto, nome (link para a página do produto), preço (com "Esgotado" em vermelho, se aplicável).
- **Botão "X" (remover)**: tira o produto da lista.
- Se vazia: "Você ainda não favoritou nenhum produto." com o link **"Ver catálogo"**.

---

## Confirmação/acompanhamento do pedido

Resumo: página que mostra o status de um pedido específico, acessada pelo link em "Meus pedidos" (ou depois de finalizar uma compra).

- Ícone de confirmação e título "Pedido recebido!" com o status atual por extenso (ex.: "Pago").
- **Linha do tempo visual** (só aparece se o pedido já foi pago): mostra as etapas "Pago", "Separação", "Enviado", "Entregue", destacando em verde as já concluídas.
- **Bloco de rastreio** (só aparece se houver código de rastreio cadastrado): nome da transportadora e código de rastreio, com a instrução "Use o código acima no site da transportadora".
- **Resumo dos itens**: quantidade, nome e subtotal de cada produto, e o total geral do pedido.
- **Link "Baixar nota fiscal (DANFE)"** (só aparece se a nota fiscal já foi emitida pelo admin): abre a nota fiscal em uma nova aba.
- **Botão "Continuar comprando"**: leva de volta ao catálogo.

---

## Sobre nós

Resumo: página institucional com o texto de apresentação da loja e fotos/vídeos, ambos cadastrados pelo admin.

- Texto sobre a loja (dividido em parágrafos). Se ainda não houver texto cadastrado, mostra "A [Nome da loja] ainda não cadastrou o texto desta página. Em breve, mais informações aqui.".
- Galeria de fotos e vídeos (aceita fotos, vídeos do YouTube/Vimeo/link externo, ou vídeos enviados diretamente), cada um com legenda opcional. Só aparece se houver itens cadastrados.

---

## Contato

Resumo: página com os canais de contato da loja, todos configurados pelo admin. Só aparecem os canais que estiverem cadastrados.

- **WhatsApp**: clicar abre uma conversa no WhatsApp (com mensagem pronta, se configurada).
- **E-mail**: clicar abre o programa de e-mail do cliente já com o destinatário preenchido.
- **Instagram**: clicar abre o perfil da loja no Instagram em uma nova aba.
- **Endereço**: exibido apenas como texto (não é um link).
- Se nenhum canal estiver cadastrado, mostra "Nenhum canal de contato cadastrado ainda.".

---

## Aprovação de orçamento (link enviado por e-mail/WhatsApp)

Resumo: página pública, acessada por um link exclusivo enviado ao cliente (por e-mail ou WhatsApp), onde ele visualiza um orçamento preparado pela loja e decide aprovar ou recusar. Não exige login.

- Nome da loja, título do orçamento, número (formato "OR.0000") e nome do cliente.
- Tabela com os itens do orçamento: descrição, quantidade, valor unitário e total de cada item.
- Subtotal e desconto (se houver) e o **valor total**.
- **Condições** (texto livre cadastrado pela loja), se houver.
- Se o link for inválido ou o orçamento não existir: mostra "Orçamento não encontrado ou link inválido.".
- Se o orçamento **ainda não foi respondido**:
  - **Botão "Aprovar orçamento"**: registra a aprovação imediatamente (mostra "Enviando..." durante o processo).
  - **Botão "Recusar orçamento"**: abre um campo de observação opcional ("Quer explicar o motivo da recusa? (opcional)") antes de confirmar, com os botões **"Confirmar recusa"** e **"Voltar"** (cancela e volta para as duas opções iniciais).
- Depois de respondido (nessa visita ou em uma visita anterior), a página mostra a decisão já tomada: "Você aprovou este orçamento." ou "Você recusou este orçamento.", indicando por qual canal a resposta foi dada (e-mail ou WhatsApp) e, se recusado, a observação deixada pelo cliente.

### Página relacionada: resposta de cotação de fornecedor

Existe uma página semelhante em formato (`/cotacao/responder/[token]`), mas ela é destinada a **fornecedores**, não a clientes finais da loja: o fornecedor informa, para cada item solicitado, a quantidade que consegue entregar e o preço unitário, vê o total calculado automaticamente e envia com o botão **"Enviar cotação"**. É obrigatório informar o preço de todos os itens antes de enviar.

---

# Parte 2 — Painel administrativo

Área de uso exclusivo do dono da loja e da equipe autorizada, acessada em `/admin`. Existem dois tipos de usuário:

- **admin** — acesso total, sem restrição.
- **operador** — acesso ao dia a dia operacional, mas **sem acesso** a: Financeiro, Notas Fiscais, Reajuste de Preços, Cotação, Pedido de Compra, Entrada de NF, Fornecedores, Relatório de Lucro/DRE, Auditoria, Usuários e Configurações da Loja. Essas telas nem aparecem no menu para o operador.

**Senha de primeiro acesso.** Quando o administrador cria um usuário (ou troca a senha de alguém), essa senha vale só até o primeiro acesso: ao entrar, a pessoa é levada direto para a tela de troca e o painel fica bloqueado até ela criar uma senha própria. Depois disso, ninguém além dela sabe a senha. Qualquer pessoa pode trocar a própria senha quando quiser, pelo link **"Trocar minha senha"**, no rodapé do menu lateral, embaixo do nome do usuário.

**Código dos cadastros.** Produtos, fornecedores, clientes e categorias têm um código próprio (1, 2, 3...), gerado automaticamente pelo sistema ao salvar e mostrado na primeira coluna da grade. Ele serve pra localizar o registro rapidamente e pode ser copiado, mas não pode ser digitado nem alterado — quem numera é o sistema.

A seguir, cada tela do menu lateral, agrupada da mesma forma que aparece no painel.

## Visão Geral (Dashboard)

Tela inicial ao entrar no painel. Mostra um resumo rápido do negócio: quantidade de produtos ativos, pedidos feitos hoje, faturamento do mês, pedidos pendentes e produtos com estoque baixo. Logo abaixo, uma lista dos últimos pedidos, com o canal de venda (site, WhatsApp, Instagram, balcão, marketplace), a forma de pagamento e um indicador de pedidos "provavelmente abandonados" (cliente iniciou a compra mas não pagou). Acesso: todo usuário do admin.

---

## Grupo Vendas

### Venda Balcão

Tela usada pra registrar uma venda feita presencialmente na loja (no balcão), sem passar pelo carrinho do site. Também mostra o histórico de vendas já feitas (tanto pelo balcão quanto pelo site).

A tela tem duas abas: **Produtos** (onde se monta a venda) e **Vendas** (histórico).

#### Aba "Produtos" (montar a venda)

**Busca e seleção de produtos**

- Campo **"Buscar produto..."**: digite parte do nome do produto pra filtrar a lista mostrada.
- Campo **"Ler código de barras..."**: campo pensado pra um leitor de código de barras USB (que funciona como um teclado). Ao ler um código e apertar Enter:
  - Se o código bate com um produto cadastrado, o produto é adicionado direto no carrinho.
  - Se o código não é válido (o dígito verificador não confere), aparece o aviso "Código de barras inválido (dígito verificador não confere) - leia de novo" e nada é adicionado.
  - Se o código é válido mas nenhum produto está cadastrado com ele, abre uma janela oferecendo cadastro rápido do produto (ver abaixo).
- Botões de **categoria** (em formato de pílula, ao lado da busca): filtram os produtos mostrados por categoria. O botão "todas" mostra tudo.
- Clicar em um **card de produto** adiciona 1 unidade dele ao carrinho. Se o produto estiver sem estoque (estoque menor que 1), o card fica apagado e não pode ser clicado. Cada card mostra: imagem (ou "Sem imagem"), nome, preço (já usando o preço promocional se houver) e o estoque disponível ("Est: X").

**Janela "Produto não cadastrado" (cadastro rápido pelo código de barras)**

Abre automaticamente quando um código de barras válido é lido mas não pertence a nenhum produto.

- Mostra o código de barras lido e, se ele for válido, o aviso "Código de barras válido".
- Campo **Nome do produto**: obrigatório.
- Campo **Preço (R$)**: obrigatório, aceita só valor em dinheiro (máscara de moeda).
- Aviso fixo: "Esse é um cadastro rápido, só com o essencial pra vender agora. Depois vá em Produtos e complete o cadastro (NCM, categoria, fotos, dimensões) antes de emitir nota fiscal desse item."
- Botão **Cancelar**: fecha a janela sem cadastrar nada (a venda continua sem esse item).
- Botão **Cadastrar e adicionar**: só habilitado se nome e preço estiverem preenchidos; cadastra o produto (com estoque zerado, sem categoria e sem imagem) e já adiciona ele ao carrinho. Enquanto salva mostra "Cadastrando...".

**Carrinho (painel lateral)**

- Lista os itens adicionados, cada um com nome, preço unitário e:
  - Botão **"−"**: diminui 1 unidade (não deixa ir abaixo de 1; se chegar a 0 o item some da lista, mas isso só acontece removendo pelo lixeira).
  - Contador de **quantidade**.
  - Botão **"+"**: aumenta 1 unidade; fica desabilitado quando a quantidade já bateu no estoque disponível daquele produto.
  - Ícone de **lixeira**: remove o item inteiro do carrinho.
- **Cliente (opcional)**: três formas de informar quem está comprando:
  - Campo **"Buscar cliente cadastrado..."**: digita nome/e-mail/telefone e escolhe um cliente já cadastrado na lista que aparece.
  - Link **"+ Cadastrar novo cliente (completo)"**: abre um mini formulário com Nome (obrigatório), E-mail (opcional), Telefone e CPF/CNPJ (opcional). Botão **Salvar cliente** grava o cliente de verdade no cadastro de clientes (fica disponível pra próximos atendimentos também); botão **Cancelar** fecha o mini formulário sem salvar.
  - Ou, sem cadastro nenhum, preencher só **Nome** e **Telefone** avulsos ("cadastro rápido, sem conta no site") — esses dados ficam só naquela venda, não viram um cliente cadastrado.
  - Se um cliente já estiver selecionado, aparece o nome dele com um "x" pra remover a seleção.
- **Total**: soma automática de todos os itens do carrinho.
- Botão **"Ir para pagamento"**: só habilita quando há pelo menos 1 item no carrinho. Abre a janela de finalização da venda.

**Janela "Finalizar venda"**

- Mostra o **Total** da venda.
- Campo **Forma de pagamento**: lista suspensa com Dinheiro, Pix, Boleto, Cartão de crédito, Cartão de débito. Vem com "Dinheiro" marcado por padrão.
- Campo **Canal da venda**: lista suspensa com os canais de venda balcão disponíveis.
- Campo **Tipo de entrega (opcional)**: só aparece se existirem tipos de entrega cadastrados. Padrão é "Sem entrega (venda direta no balcão)".
- Mostra um selo com o nome do cliente selecionado ou digitado, se houver.
- Botão **Cancelar**: fecha a janela sem finalizar a venda.
- Botão **Confirmar venda**: registra a venda de fato (baixa o estoque dos produtos, grava o pedido). Mostra "Finalizando..." enquanto processa. Se der erro, mostra a mensagem em vermelho. Se der certo, mostra "Venda finalizada com sucesso!" por alguns segundos, limpa o carrinho e os campos, e atualiza a lista de produtos (com o estoque já baixado) e o histórico de vendas.

#### Aba "Vendas" (histórico)

- Filtro em abas: **Todas**, **Site**, **Balcão** — filtra a lista de vendas mostrada pela origem.
- Tabela com colunas: Cliente, Canal, Status, Total, Data.
  - Se o status calculado da venda for "Provavelmente abandonado", ele aparece destacado em laranja.
  - Ao lado do status, se houver forma de pagamento registrada, ela é mostrada também.
- Clicar em uma linha da tabela abre uma janela de detalhe rápido da venda, mostrando: nome e telefone do cliente, canal, status, data, lista de itens comprados com quantidade e valor, e o total.
  - Botão **Fechar**: fecha a janela de detalhe.
  - Botão **Abrir pedido completo**: leva para a tela de detalhe completo do pedido (ver seção "Pedido de Venda" abaixo).

Acesso: todo usuário do admin.

### Pedido de Venda

Lista todos os pedidos (vindos do site, do balcão, ou importados de marketplaces como Mercado Livre e Shopee) e permite abrir o detalhe de cada um.

#### Cabeçalho

- Botão **"Importar do Mercado Livre / Shopee"**: busca no Bling pedidos novos desses marketplaces e importa pro sistema. Enquanto roda, mostra "Importando...". Ao terminar, aparece um aviso informando quantos pedidos foram importados e quantas pendências restaram.
- Se houver pedidos de marketplace que não puderam ser importados automaticamente, aparece um quadro de aviso amarelo listando cada pendência (canal, número do pedido, motivo). Cada linha tem um botão **"x"** pra descartar aquela pendência (o próximo import vai tentar de novo do zero se ela ainda existir no Bling).

#### Abas de status (filtro da lista)

Abas: **Todos**, **Aguardando pagamento**, **Pago**, **Em separação**, **Enviado**, **Entregue**, **Cancelado**. Cada aba mostra, entre parênteses, a quantidade de pedidos naquele status. Clicar em uma aba filtra a tabela abaixo.

#### Tabela de pedidos

Colunas: Cliente, Canal, Status, Total, Data. Clicar em qualquer parte da linha abre a tela de detalhe completo do pedido.

Se não houver nenhum pedido cadastrado ainda, aparece a mensagem "Nenhum pedido ainda. Essa tela vai preencher quando o checkout do site estiver pronto." Se houver pedidos mas nenhum bater com o filtro de status escolhido, aparece "Nenhum pedido com esse status."

Acesso: todo usuário do admin.

### Detalhe do pedido

Mostra e permite gerenciar tudo sobre um pedido específico: status, nota fiscal, rastreio, dados do cliente e itens.

No topo há uma navegação com o link **"Lista de pedidos"** (volta pra tela anterior) e a aba atual "Detalhe do pedido".

O título mostra "Pedido" e, se for uma venda balcão, um selo laranja "Venda balcão". Abaixo, a data em que o pedido foi feito.

Se o pedido veio do Mercado Livre ou da Shopee, aparece um quadro informando a origem e o número do pedido no marketplace (via Bling).

#### Bloco "Status"

- Se o status atual for **"Aguardando pagamento"**: aparece um selo indicando isso e o aviso "Só vira 'Pago' quando o Mercado Pago confirmar - não dá pra marcar manualmente (evita liberar pedido sem o pagamento ter entrado de verdade). Só resta cancelar." O único botão disponível é **Cancelar pedido**.
- Para qualquer outro status: aparece uma lista suspensa pra trocar o status manualmente, com as opções: **Em separação**, **Enviado**, **Entregue**, **Cancelado**. Importante: as opções **"Pago"** e **"Aguardando pagamento"** nunca aparecem como escolha manual — "Pago" só é confirmado automaticamente pelo Mercado Pago (ou já nasce pago, no caso de venda balcão), e não faz sentido voltar pro estado de aguardando pagamento na mão. Se o pedido já estiver com status "Pago", ele aparece na lista mas travado (não pode ser escolhido de novo, só informativo).
- Se houver forma de pagamento registrada, ela é exibida abaixo.

#### Bloco "Nota fiscal (Bling)"

**Se ainda não há nota emitida (ou a anterior foi cancelada):**
- Se existir uma nota anterior cancelada, mostra aviso com a data do cancelamento e que pode emitir uma nova.
- Botão **"Emitir NF-e"**: dispara a emissão da nota fiscal no Bling. Mostra "Emitindo..." enquanto processa. Se falhar, mostra a mensagem de erro.

**Se já há nota emitida (e não cancelada):**
- Mostra "NF-e emitida (Bling #número)".
- Selo com a situação atual da nota (conforme o Bling).
- Botão **"Atualizar situação no Bling"**: consulta de novo o status da nota diretamente no Bling. Mostra "Consultando..." enquanto roda, e a data/hora da última consulta.
- Se o cliente tiver e-mail cadastrado, mostra se a nota já foi enviada por e-mail (com data) ou o aviso "Ainda não enviada por e-mail (falha no envio)".
- Links **"Ver DANFE"** e **"Ver PDF"**: abrem os documentos da nota em nova aba (só aparecem se o Bling forneceu os links).
- Botão **"Cancelar NF-e"**: abre um mini formulário de cancelamento com:
  - Aviso: "O estoque dos itens deste pedido será estornado automaticamente ao cancelar a nota."
  - Campo **Justificativa do cancelamento**: obrigatório, mínimo de 15 caracteres (exigência da Sefaz). O placeholder sugere exemplos como "Erro no valor da nota, pedido cancelado pelo cliente...".
  - Botão **Confirmar cancelamento** (vermelho/destrutivo): só habilita quando a justificativa tem 15 caracteres ou mais. Mostra "Cancelando..." enquanto processa.
  - Botão **Voltar**: fecha o formulário sem cancelar nada.

#### Bloco "Rastreio"

- Campo **Transportadora**: texto livre, com sugestão "Ex: Correios, Jadlog...".
- Campo **Código de rastreio**: o texto digitado é automaticamente colocado em maiúsculas. Se a transportadora escolhida for "Correios" e o código não seguir o formato padrão dos Correios (2 letras + 9 números + 2 letras, ex: BR123456789BR), aparece um aviso amarelo alertando o formato incomum — mas o sistema deixa salvar assim mesmo, é só um alerta.
- Sub-bloco **"Validar rastreio na Frenet (opcional)"**:
  - Campo **Código do serviço Frenet**: encontrado no painel da conta Frenet.
  - Botão **"Validar agora"**: só habilita se código de rastreio e código de serviço estiverem preenchidos. Consulta a Frenet pra ver se o rastreio realmente existe e mostra os eventos de rastreamento encontrados (status e local). Mostra "Validando..." enquanto roda; se o código não existir de verdade, mostra erro.
  - Aviso explicativo: se o código de serviço Frenet estiver preenchido, o sistema valida o rastreio automaticamente ao clicar em "Salvar e notificar cliente" — e se o código não existir na transportadora, o salvamento e a notificação ficam bloqueados. Sem o código de serviço preenchido, não dá pra validar (fica só o aviso de formato) e o salvamento funciona normalmente.
- Botão **"Salvar e notificar cliente"**: grava a transportadora e o código de rastreio no pedido. Mostra "Salvando..." enquanto processa e, ao concluir, "Salvo e cliente notificado!" por alguns segundos.

#### Bloco "Cliente"

- Mostra nome, e-mail e telefone do cliente (quando existirem).
- Se houver telefone, botão **"Enviar status por WhatsApp"**: abre o WhatsApp Web/App já com uma mensagem pronta contendo o número do pedido, o status atual e (se houver) o código de rastreio e a transportadora. Ao clicar, o sistema marca automaticamente que o envio foi feito, mostrando depois "Marcado como enviado em [data/hora]".

#### Bloco "Endereço de entrega"

Mostra o endereço completo cadastrado no pedido (logradouro, número, complemento, bairro, cidade/estado, CEP). Se o pedido for uma venda balcão sem entrega, mostra "Venda balcão - sem entrega."

#### Bloco "Itens"

Lista cada item comprado com quantidade e valor total daquele item, e o total geral do pedido no final.

### Orçamentos

Tela pra montar propostas de orçamento pra clientes, enviar por e-mail/WhatsApp, acompanhar se o cliente aprovou ou recusou, e converter orçamentos aprovados em vendas de verdade.

#### Aba de lista (grade de orçamentos)

**Filtro em abas**: Todos, Em aberto, Aprovados, Recusados, Convertidos — cada uma mostra a quantidade de orçamentos naquele status e filtra a tabela.

**Barra de ferramentas** (os botões abaixo agem sobre o orçamento selecionado na tabela, clicando na linha):

- **Novo**: abre o formulário de cadastro de um orçamento novo.
- **Atualizar**: recarrega a lista de orçamentos (mostra "Atualizando..." enquanto roda) — útil pra ver se o cliente já respondeu.
- **Editar**: abre o orçamento selecionado pra edição. Só fica habilitado se o orçamento estiver com status "Em aberto".
- **Converter em venda**: abre a janela de conversão. Só fica habilitado se o orçamento estiver "Aprovado".
- **Enviar e-mail**: envia o orçamento por e-mail pro cliente. Só habilitado se o orçamento estiver "Em aberto".
- **Enviar WhatsApp**: abre o WhatsApp com uma mensagem e link pro cliente aprovar/recusar o orçamento. Só habilitado se estiver "Em aberto".
- **Excluir** (botão vermelho): exclui o orçamento. Desabilitado se o orçamento já estiver "Convertido" (pra não perder o vínculo com a venda gerada). Pede confirmação antes: "Excluir o orçamento #número?"

**Tabela de orçamentos**: colunas Número (no formato OR.0001), Cliente (com o título do orçamento acima do nome, se houver), Status, Total, Data, e uma coluna de Ações com ícones que reproduzem os mesmos botões da barra de ferramentas conforme o status de cada linha:
- Ícone de **olho**: abre a janela de detalhe rápido daquele orçamento.
- Se **Em aberto**: ícones de WhatsApp, e-mail, lápis (editar), check verde (marcar como aprovado) e "x" vermelho (marcar como recusado).
- Se **Aprovado**: ícone de seta circular (converter em venda).
- Se **não estiver Convertido**: ícone de lixeira (excluir).

Clicar duas vezes numa linha "Em aberto" também abre a edição direto.

**Janela "Converter orçamento em venda"**:
- Mostra o total do orçamento.
- Campo **Forma de pagamento**: Dinheiro, Pix, Cartão de crédito, Cartão de débito.
- Aviso: "Isso vai gerar uma venda (baixando o estoque dos itens vinculados a produtos) e marcar este orçamento como convertido."
- Botão **Cancelar**: fecha sem converter.
- Botão **Confirmar venda**: efetiva a conversão. Mostra "Convertendo..." enquanto processa; erro aparece em vermelho se algo falhar.

**Janela de detalhe rápido (ícone de olho)**: mostra Título, Cliente, Status, Subtotal, Desconto, Total, Data e, quando existirem, data de envio por e-mail e a resposta do cliente (se aprovou/recusou, por qual canal e quando, mais a observação que o cliente deixou, se houver).

#### Formulário de orçamento (Novo / Editar)

Abre no lugar da lista quando se clica em Novo ou Editar.

**Barra de ferramentas do formulário:**
- **Gravar**: salva o orçamento (criação ou edição).
- **Limpar**: descarta as alterações não salvas e volta os campos ao estado original (do orçamento carregado, ou em branco se for novo).
- **Atualizar status** (só aparece quando está editando um orçamento existente): consulta o status mais recente do orçamento (útil pra ver se o cliente respondeu enquanto a tela estava aberta). Mostra "Atualizando..." enquanto roda.
- **Cancelar**: fecha o formulário sem salvar e volta pra lista.

Se o orçamento já tiver um status registrado (edição), aparece uma faixa colorida com a situação: "Aguardando resposta do cliente" (azul), "Aprovado pelo cliente" (verde), "Recusado pelo cliente" (vermelho) ou "Convertido em venda" (cinza) — junto com data de envio por e-mail, data/canal de resposta e a observação deixada pelo cliente, se houver.

**Bloco "Itens"** (obrigatório pelo menos 1 item válido pra salvar):
- Cada linha de item tem:
  - **Produto (opcional) ou descrição**: lista suspensa pra escolher um produto já cadastrado (preenche descrição e valor automaticamente) ou pode digitar a descrição livre no campo de texto abaixo, sem vincular a um produto do estoque.
  - **Quantidade**: numérico, aceita casas decimais.
  - **Valor unit. (R$)**: numérico, aceita casas decimais.
  - **Subtotal**: calculado automaticamente (quantidade × valor unitário), só exibição.
  - Ícone de **lixeira**: remove aquela linha de item.
- Botão **"Adicionar item"**: acrescenta uma nova linha vazia.
- Campo **Condições (opcional)**: texto livre em área maior, com sugestão "Ex: validade de 15 dias, entrada de 50% para iniciar a produção...".

**Bloco "Cliente":**
- Campo **Título (opcional)**: nome/apelido pro orçamento, ex: "Kit de porcelanas".
- Se um cliente cadastrado já estiver selecionado: mostra o nome dele com um "x" pra remover a seleção, e um campo **E-mail** (pra onde o orçamento será enviado).
- Se nenhum cliente estiver selecionado:
  - Campo **Buscar cliente cadastrado**: busca por nome ou e-mail e permite escolher um cliente já cadastrado.
  - Ou, "sem cadastro": campos **Nome do cliente** (obrigatório pra salvar o orçamento) e **Telefone**.

**Bloco "Totais":**
- **Subtotal**: soma automática de todos os itens (cada item = Quantidade × Valor unitário).
- Campo **Desconto (R$)**: numérico, valor a abater do subtotal.
- **Total**: Subtotal − Desconto (nunca fica negativo — se o desconto for maior que o subtotal, o total trava em zero).

**Validações ao clicar em Gravar:**
- "Nome do cliente é obrigatório" — se o campo de nome estiver vazio.
- "Adicione pelo menos um item válido" — se nenhuma linha tiver descrição preenchida e quantidade maior que zero.
- Qualquer outro erro retornado ao salvar aparece em vermelho abaixo da barra de ferramentas.

Acesso: todo usuário do admin.

### Clientes

Tela de cadastro e gestão dos clientes da loja (tanto os que se cadastraram pelo site quanto os cadastrados manualmente no balcão).

A tela tem duas abas: **Lista** e **Formulário** (a aba Formulário só aparece depois que se clica em Novo ou Editar, ou enquanto está editando).

#### Aba "Lista"

**Filtros:**
- Campo de busca **"Buscar por nome, email ou telefone..."**: filtra a lista conforme o texto digitado.
- Botão **"Limpar filtros"**: só aparece quando há busca digitada ou o filtro de status não está em "Ativos"; ao clicar, zera a busca e volta o filtro de status pra "Ativos".
- Abas de status: **Ativos**, **Inativos**, **Todos** — filtra a lista pelo campo "ativo" do cliente.

**Barra de ferramentas** (agem sobre o cliente selecionado, clicando na linha da tabela):
- **Novo**: abre o formulário de cadastro de cliente em branco.
- **Editar**: abre o formulário preenchido com os dados do cliente selecionado. Desabilitado se nenhum cliente estiver selecionado.
- **Inativar / Reativar**: o texto e o ícone mudam conforme o status atual do cliente selecionado (se está ativo, mostra "Inativar"; se inativo, mostra "Reativar"). Pede confirmação: "Quer mesmo inativar/reativar o cliente '[nome]'?"
- **Excluir** (botão vermelho): exclui o cliente. Pede confirmação com o aviso: "Excluir o cliente '[nome]'? Só funciona se ele nunca tiver feito nenhum pedido." Importante: a exclusão só tem efeito de fato quando o cliente nunca teve nenhum pedido vinculado — se já tiver histórico de compra, o sistema recusa a exclusão (por causa do vínculo com o pedido) e o certo nesse caso é inativar em vez de excluir.

**Tabela de clientes**: colunas Nome, Origem (selo "Site" ou "Balcão"), Email, Telefone, CPF/CNPJ, Status (selo "Ativo" ou "Inativo"), e a coluna Ações com ícones que repetem os botões da barra de ferramentas por linha: olho (ver detalhe rápido), lápis (editar), Inativar/Reativar, e lixeira (excluir).

Clicar duas vezes numa linha também abre a edição direto.

**Janela de detalhe rápido (ícone de olho)**: mostra Origem, Email, Telefone, CPF/CNPJ, Status e a data em que o cliente foi cadastrado ("Cliente desde").

#### Aba "Formulário" (Novo cliente / Editando)

**Barra de ferramentas:**
- **Gravar**: só habilita com o campo Nome preenchido (e não durante o carregamento). Salva o cadastro (criação ou edição).
- **Limpar**: descarta alterações não salvas — volta os campos aos dados originais do cliente (se estiver editando) ou limpa tudo (se for novo).
- **Cancelar** (botão vermelho): fecha o formulário sem salvar e volta pra lista.

**Bloco "Dados cadastrais":**
- **Nome**: obrigatório.
- **E-mail (opcional)**: só aparece no cadastro de cliente novo (não aparece mais quando já se está editando um cliente existente — editar um cliente não mexe no e-mail/senha de login dele no site). Placeholder: "Só se o cliente for usar o site".
- **Telefone**: aceita máscara automática de telefone.
- **CPF/CNPJ**: aceita máscara automática de CPF ou CNPJ.

**Bloco "Endereço (opcional)":**
- **CEP**: ao digitar um CEP completo (8 dígitos), o sistema busca automaticamente o endereço (rua, bairro, cidade, estado) através de um serviço público de consulta de CEP e preenche os campos abaixo sozinho. Se a busca falhar, não trava o cadastro — o usuário preenche o endereço na mão.
- **Número**
- **Logradouro**
- **Complemento**
- **Bairro**
- **Cidade**
- **Estado**: campo limitado a 2 letras, convertidas automaticamente pra maiúsculas (sigla da UF).

Acesso: todo usuário do admin.

---

## Grupo Produtos

### Cadastro de Produtos

Tela onde você cria, edita, consulta e exclui os produtos vendidos na loja. É aqui que ficam o preço, o estoque, as fotos, as categorias e os dados fiscais de cada item.

A tela tem duas abas: **Grade** (lista de produtos) e **Cadastro** (formulário de criação/edição).

#### Aba Grade

- Mostra a lista de produtos já cadastrados, com as colunas: Nome, SKU, Categorias, Preço, Estoque e Status.
- Se o produto não tiver NCM e/ou código de barras preenchido, aparece um ícone de alerta (triângulo amarelo) ao lado do nome, avisando "Cadastro incompleto".
- Se o produto tiver preço promocional, a grade mostra o preço normal riscado e o preço promocional ao lado.
- Se o estoque estiver igual ou abaixo do estoque mínimo definido, o número do estoque aparece destacado em amarelo.
- **Filtros da grade** (abas internas acima da tabela): Ativos (padrão ao abrir a tela), Inativos, Todos.
- Clicar em uma linha da tabela a seleciona (fica destacada); clicar de novo tira a seleção. Dar dois cliques na linha já abre a edição do produto.
- **Botões da barra de ferramentas:**
  - **Novo** — abre o formulário em branco na aba Cadastro, para criar um produto novo.
  - **Editar** — só fica habilitado com uma linha selecionada; abre o formulário preenchido com os dados do produto.
  - **Excluir** — só fica habilitado com uma linha selecionada; pede confirmação ("Excluir o produto '[nome]'?") antes de apagar. Se a exclusão não for permitida (por exemplo, produto já usado em algum pedido), aparece um aviso na tela.
- **Ícones de ação em cada linha** (lado direito): olho (ver detalhes num quadro resumido), lápis (editar) e lixeira (excluir, com a mesma confirmação acima).

#### Aba Cadastro (formulário)

No topo aparece "Editando: [nome do produto]" quando é uma edição, ou "Novo produto" quando é um cadastro novo.

**Botões da barra de ferramentas:**
- **Gravar** — salva o produto. Fica desabilitado enquanto o produto está sendo salvo.
- **Limpar** — desfaz tudo o que foi digitado na tela e volta os campos para o que estava salvo (ou para vazio, se for produto novo). Não fecha o formulário.
- **Cancelar** — fecha o formulário sem salvar e volta para a Grade.

**Campos — bloco "Dados do produto":**
- **Nome** — obrigatório. Texto livre.
- **SKU** — opcional. Código interno do produto, usado só para controle próprio da loja.
- **EAN** (obrigatório) — código de barras do produto (GTIN/EAN-13), com 13 dígitos. É usado no leitor de código de barras da Venda Balcão e na importação de XML de nota fiscal de compra. O campo só aceita números e corta automaticamente no 13º dígito. Enquanto o número está incompleto, mostra quantos dígitos ainda faltam; quando chega a 13 dígitos, o sistema confere o dígito verificador (checagem matemática que confirma se o código é válido) e avisa se o código está errado ou correto.
- **NCM (fiscal)** (obrigatório) — código fiscal do produto, até 8 dígitos, formatado como "0000.00.00". É enviado na nota fiscal quando ela é emitida pelo Bling — por isso é obrigatório preencher.
- **Descrição** — opcional. Texto livre, área maior, para detalhar o produto.
- **Preço (R$)** — obrigatório. Preço normal de venda.
- **Promo (R$)** — opcional. Preço promocional; quando preenchido, ele substitui o preço normal exibido no site.
- **Clube** — opcional. Preço especial que só aparece para clientes com assinatura do Clube ativa. Tem um seletor de tipo (R$ = valor fixo, ou % = percentual de desconto) e o campo de valor correspondente. Se vazio, o produto não participa do Clube. Quando o tipo é percentual, o valor precisa ficar entre 0 e 100.
- **Estoque** — quantidade atual em estoque. Só aceita números.
- **Estoque mínimo** — quantidade mínima antes de o produto ser considerado "em baixa" nas telas de Estoque e na Grade de Produtos. Só aceita números.
- **Custo médio atual e Margem** — aparece só quando o produto já tem custo registrado (calculado automaticamente a partir das compras recebidas em Compras). É informativo, não editável nesta tela: mostra o custo médio e a margem de lucro calculada com base no preço digitado.
- **Peso e dimensões (para cálculo de frete)** — Peso (kg), Altura (cm), Largura (cm) e Comprimento (cm). Todos opcionais, aceitam número com casas decimais (vírgula). Usados para calcular o frete do produto.
- **Categorias** — lista de botões com o nome de cada categoria cadastrada (subcategorias aparecem como "Categoria pai › Subcategoria"). Clique para marcar/desmarcar quantas categorias quiser. Se não houver nenhuma categoria cadastrada, aparece o aviso "Nenhuma categoria cadastrada ainda."

**Campos — bloco lateral "Status":**
- **Produto ativo no site** — interruptor (liga/desliga). Quando desligado, o produto some da loja mas continua cadastrado no painel.

**Campos — bloco lateral "Imagens":**
- Mostra as fotos já adicionadas, cada uma com um X para remover ao passar o mouse.
- Botão **Adicionar** (ícone de foto) — abre o seletor de arquivos do computador ou, no celular, pode abrir direto a câmera. Permite selecionar várias fotos de uma vez. Durante o envio mostra "Enviando...".

**Avisos importantes:**
- O código de barras (EAN) e o NCM são obrigatórios para salvar o produto — sem eles a gravação é bloqueada com mensagem de erro.
- O código de barras é validado por dígito verificador: mesmo com 13 dígitos, se o cálculo não confere o sistema recusa salvar ("Código de barras inválido").
- Excluir um produto pede confirmação e é uma ação que não pode ser desfeita.

Acesso: todo usuário do admin.

### Categorias

Tela para organizar os produtos em categorias e subcategorias, que aparecem no menu do site. Tem duas abas: **Grade** e **Cadastro**.

#### Aba Grade

- Lista as categorias com Imagem, Nome (subcategorias aparecem recuadas, com uma setinha, abaixo da categoria principal), Slug (o endereço da categoria usado na URL do site) e Status.
- Clicar numa linha seleciona; duplo clique abre a edição.
- **Botões:**
  - **Novo** — abre o formulário em branco.
  - **Editar** — habilitado só com linha selecionada.
  - **Excluir** — habilitado só com linha selecionada; pede confirmação ("Excluir a categoria '[nome]'?").
- **Ícones por linha:** olho (detalhes), lápis (editar), lixeira (excluir).

#### Aba Cadastro

- **Nome** — obrigatório (o botão Gravar só habilita com o nome preenchido).
- **Categoria pai** — lista de seleção com as categorias principais já cadastradas (a própria categoria em edição não aparece na lista, para evitar que ela seja "pai de si mesma"). Escolher uma categoria pai transforma o cadastro em subcategoria. Deixando em branco, vira uma categoria principal, que aparece no menu do site.
- **Imagem** — opcional. Botão para adicionar uma foto (com X para remover).
- **Ativa** — interruptor, só aparece quando está editando uma categoria já existente (categoria nova sempre começa ativa). Quando desligado, a categoria deixa de aparecer no site.

**Botões:** Gravar (salva; desabilitado se o nome estiver vazio ou durante o salvamento), Limpar (restaura os campos), Cancelar (fecha sem salvar).

Acesso: todo usuário do admin.

### Estoque

Tela para consultar e ajustar rapidamente a quantidade em estoque dos produtos, sem precisar abrir o cadastro completo de cada um.

- No topo, se houver produtos com estoque baixo, aparece um aviso "[quantidade] produto(s) com estoque baixo".
- **Busca** — campo de texto que filtra por nome ou SKU do produto, conforme você digita.
- **Filtros** (abas): Todos, Estoque baixo (só os produtos com estoque igual ou abaixo do mínimo cadastrado).
- **Botão Limpar filtros** — aparece só quando há busca ou filtro ativo; zera os dois de uma vez.
- **Tabela**: Produto (mostra a etiqueta "inativo" ao lado do nome se o produto estiver desativado), SKU, Mínimo, Estoque atual (destacado em amarelo com um ícone de alerta se estiver em baixa), e uma coluna "Ajustar" com um campo numérico e um botão **Salvar** por linha.
- Cada linha é ajustada individualmente: você digita o novo número no campo e clica em Salvar. O botão só fica habilitado depois que o valor for alterado, e mostra "..." enquanto salva.

**Aviso importante:** o ajuste é gravado linha por linha — não existe um botão para salvar tudo de uma vez nesta tela.

Acesso: todo usuário do admin.

### Reajuste de Preços

Tela para alterar o preço de vários produtos ao mesmo tempo, por percentual ou valor fixo, com pré-visualização do preço novo antes de aplicar. Também permite editar o preço de um produto isolado direto na grade.

#### Bloco de reajuste em massa

- **Tipo** — seleção: Percentual (%) ou Valor fixo (R$).
- **Direção** — seleção: Aumento ou Redução.
- **Valor** — número do percentual ou do valor fixo a aplicar.
- **Aplicar também no preço promocional** — caixa de marcação; se marcada, o mesmo reajuste é aplicado também ao preço promocional dos produtos selecionados que tiverem promoção.
- **Botão "Aplicar em [quantidade] produto(s)"** — só funciona com pelo menos um produto selecionado. Aplica o reajuste calculado (ou o preço digitado manualmente na grade, se houver) aos produtos marcados. Mostra "Aplicando..." durante o processo e, ao concluir, a mensagem "[quantidade] produto(s) atualizado(s)".

#### Bloco de filtros e seleção

- **Busca** — filtra por nome ou SKU.
- **Categoria** — seleção para filtrar por categoria (ou "Todas as categorias").
- **Botão "Selecionar filtrados ([quantidade])"** — marca todos os produtos que estão aparecendo com o filtro atual.
- **Botão "Limpar seleção"** — desmarca todos os produtos e limpa os preços digitados manualmente.

#### Grade de produtos

- Colunas: caixa de marcação, Produto (mostra "(inativo)" se desativado), Custo, Preço atual, Preço novo (campo editável — mostra o valor calculado pelo reajuste em massa, mas pode ser digitado manualmente por produto; quando o preço muda, o campo fica destacado em verde) e um botão **Salvar** por linha.
- **Botão Salvar (por linha)** — grava o preço novo daquele produto individualmente, sem depender da seleção em massa nem do botão "Aplicar". Mostra "Salvando..." durante o processo e, ao concluir, "Preço de '[nome]' atualizado".

**Como o preço novo é calculado:**
- **Aumento por percentual**: Preço novo = Preço atual + (Preço atual × percentual ÷ 100).
- **Redução por percentual**: Preço novo = Preço atual − (Preço atual × percentual ÷ 100).
- **Aumento por valor fixo**: Preço novo = Preço atual + valor digitado.
- **Redução por valor fixo**: Preço novo = Preço atual − valor digitado.

**Avisos importantes:**
- Para aplicar o reajuste em massa é preciso selecionar ao menos um produto, e informar um valor de reajuste ou digitar algum preço manualmente na grade — senão aparece erro.
- Os preços são sempre arredondados para o centavo mais próximo.
- O preço digitado manualmente na grade tem prioridade sobre o cálculo do reajuste em massa para aquele produto específico.

**Acesso restrito a "admin".**

---

## Grupo Marketing

### Cupons

Tela para criar e gerenciar cupons de desconto usados no fechamento do pedido pelo cliente. Duas abas: **Grade** e **Cadastro**.

#### Aba Grade

- Colunas: Código, Desconto (mostra o percentual ou o valor em reais; se o cupom for só para primeira compra, aparece a etiqueta "1ª compra" ao lado), Usos (quantidade usada e o limite máximo, se houver), Status.
- Clique seleciona a linha; duplo clique abre a edição.
- **Botões:** Novo, Editar (habilitado só com seleção), Excluir (habilitado só com seleção; pede confirmação "Excluir o cupom '[código]'?").
- **Ícones por linha:** olho, lápis, lixeira.

#### Aba Cadastro

- **Código** — obrigatório. É convertido automaticamente para letras maiúsculas ao digitar. **Não pode ser editado depois que o cupom já existe** (campo fica bloqueado na edição).
- **Tipo** — seleção: Percentual (%) ou Valor fixo (R$).
- **Valor** — obrigatório (número, aceita casas decimais). É o percentual de desconto ou o valor fixo em reais, dependendo do tipo escolhido.
- **Valor mínimo (R$)** — valor mínimo que a compra precisa ter para o cupom poder ser usado. Padrão: 0.
- **Limite de usos** — opcional. Deixando em branco, o cupom pode ser usado sem limite de vezes.
- **Apenas na primeira compra** — interruptor; quando ligado, o cupom só vale para clientes que ainda não fizeram nenhuma compra.
- **Ativo** — interruptor, aparece só ao editar um cupom existente (cupom novo já nasce ativo).

**Botões:** Gravar (desabilitado até preencher código e valor, ou durante o salvamento), Limpar, Cancelar.

Acesso: todo usuário do admin.

### Banners

Tela para gerenciar os banners (imagens/slides) exibidos na página inicial do site. Duas abas: **Grade** (aqui em formato de cartões) e **Cadastro**.

#### Aba Grade

- Os banners aparecem em cartões, cada um mostrando uma prévia com a cor de fundo e/ou imagem, o título e o status (Ativo/Inativo).
- Clicar no cartão seleciona; duplo clique abre a edição.
- **Botões:** Novo, Editar (habilitado só com seleção), Excluir (habilitado só com seleção; confirmação "Excluir o banner '[título]'?").
- **Ícones no cartão:** olho, lápis, lixeira.
- Se não houver nenhum banner cadastrado, aparece o aviso "Nenhum banner cadastrado - a home está usando os slides padrão."

#### Aba Cadastro

- **Título** — obrigatório (o botão Gravar exige título preenchido).
- **Subtítulo** — opcional.
- **Link (opcional)** — endereço para onde o cliente vai ao clicar no banner (ex: uma categoria de produtos).
- **Cor de fundo** — escolha entre 5 cores predefinidas (Verde, Âmbar, Verde-azulado, Rosa, Cinza), clicando na bolinha da cor desejada.
- **Imagem de fundo (opcional)** — botão para enviar uma imagem que fica por trás do texto do banner; pode ser removida com o botão de lixeira.
- **Ordem** — número que define a posição do banner na sequência exibida no site (quanto menor, mais cedo aparece).
- **Ativo** — interruptor; quando desligado, o banner não aparece no site.

**Botões:** Gravar (desabilitado sem título ou durante o salvamento), Limpar, Cancelar.

Acesso: todo usuário do admin.

### Sobre Nós

Tela para gerenciar a galeria de fotos e vídeos exibida na página "Sobre" do site. O texto dessa página é editado em outro lugar (Configurações > Páginas) — aqui só entram fotos e vídeos. Duas abas: **Galeria** e **Cadastro**.

#### Aba Galeria

- Mostra os itens em cartões (foto ou, para vídeo, um ícone de "play").
- Clique seleciona o cartão; duplo clique abre a edição.
- **Botões:** Novo, Editar (habilitado só com seleção), Excluir (habilitado só com seleção; confirmação "Excluir esse item da galeria 'Sobre Nós'?").
- Cada cartão tem um ícone de olho para ver os detalhes.
- Se não houver nada cadastrado, mostra "Nenhuma foto ou vídeo cadastrado ainda."

#### Aba Cadastro

- **Tipo** (só aparece ao criar um item novo — não pode ser trocado depois de criado) — três opções, escolhidas em botões: Foto, Vídeo (link do YouTube/Vimeo), Vídeo (arquivo).
- Se o tipo for **Vídeo (link do YouTube/Vimeo)**: campo **Link do vídeo**, aceitando links do YouTube, Vimeo ou Instagram. Esse campo também fica bloqueado depois que o item já existe.
- Se o tipo for **Foto** ou **Vídeo (arquivo)** (e o item for novo): botão para selecionar o arquivo do computador. Vídeo em arquivo aceita até 50 MB, nos formatos mp4, webm ou mov.
- Ao editar um item já existente, aparece o aviso: "Pra trocar a foto/vídeo em si, exclua este item e adicione um novo" — ou seja, **não é possível trocar o arquivo/link de um item já salvo, só a legenda e a ordem**.
- **Legenda (opcional)** — texto livre.
- **Ordem** — número que define a posição do item na galeria.

**Botões:** Gravar (desabilitado sem preencher o link/arquivo, ou durante o salvamento), Limpar, Cancelar.

Acesso: todo usuário do admin.

### Feedbacks

Tela para cadastrar depoimentos de clientes exibidos no site (diferente das Avaliações de produto — este é um depoimento geral sobre a loja, cadastrado manualmente pelo administrador). Duas abas: **Grade** (em cartões) e **Cadastro**.

#### Aba Grade

- Cartões mostrando a foto (se houver), nome do cliente, as estrelas da nota, um trecho do depoimento e o status (Ativo/Inativo).
- Clique seleciona; duplo clique edita.
- **Botões:** Novo, Editar (habilitado só com seleção), Excluir (habilitado só com seleção; confirmação "Excluir o depoimento de '[nome]'?").
- Ícones no cartão: olho, lápis, lixeira.
- Sem cadastros, mostra "Nenhum feedback cadastrado ainda."

#### Aba Cadastro

- **Nome do cliente** — obrigatório.
- **Depoimento** — obrigatório. Texto livre, área maior.
- **Nota** — seleção de 1 a 5 estrelas, clicando na estrela desejada. Padrão: 5.
- **Foto do cliente (opcional)** — botão para enviar uma foto redonda; pode ser removida.
- **Ordem** — número de posição na exibição.
- **Ativo** — interruptor; quando desligado, o depoimento não aparece no site.

**Botões:** Gravar (desabilitado sem nome e depoimento preenchidos, ou durante o salvamento), Limpar, Cancelar.

Acesso: todo usuário do admin.

### Avaliações

Tela para moderar as avaliações que os próprios clientes deixam nos produtos do site (nota + comentário). Diferente da tela Feedbacks — aqui as avaliações são criadas pelos clientes, e o papel do administrador é só aprovar ou excluir.

- **Filtros** (botões no topo): Pendentes (padrão ao abrir a tela), Aprovadas, Todas.
- Lista em formato de itens (não é uma tabela): cada avaliação mostra o nome do produto, as estrelas da nota, o nome do cliente, a data, o comentário (se houver) e a etiqueta "Pendente" quando ainda não foi aprovada.
- **Botão de aprovar** (ícone de check verde) — aparece só em avaliações ainda não aprovadas; ao clicar, a avaliação passa a ficar visível no site.
- **Botão de excluir** (ícone de lixeira vermelha) — pede confirmação ("Excluir a avaliação de '[cliente]' pra '[produto]'?") antes de apagar definitivamente.
- Se não houver avaliações no filtro escolhido, mostra "Nenhuma avaliação aqui."

**Aviso importante:** uma avaliação só aparece no site depois de aprovada pelo administrador nesta tela.

Acesso: todo usuário do admin.

### Clube

Tela de acompanhamento das assinaturas do Clube de assinatura da loja. **É uma tela somente de consulta — não tem cadastro, edição nem exclusão.** A assinatura é criada e cancelada pelo próprio cliente, na área "Minha Conta" do site, com cobrança automática pelo Mercado Pago; aqui o administrador só visualiza a situação.

- No topo, mostra quantos assinantes estão ativos no momento.
- **Tabela**: Cliente (nome e e-mail), Mensalidade (valor cobrado), Próxima cobrança (data, ou "-" se não houver), Status.
- **Status possíveis:** Pendente (aguardando confirmação de pagamento), Ativa (assinatura autorizada e em dia), Pausada, Cancelada.
- Se não houver nenhuma assinatura, mostra "Nenhuma assinatura do Clube ainda."

**Aviso importante:** como a tela é só de leitura, qualquer alteração na assinatura (cancelar, pausar) precisa ser feita pelo próprio cliente — o administrador não tem botão de ação aqui.

**Acesso restrito a "admin".**

---

## Grupo Financeiro

### Financeiro (Contas a pagar / receber)

Tela para controlar as contas que a loja tem a pagar (fornecedores, aluguel, energia etc.) ou a receber. Fica organizada em duas abas: "Grade" (lista das contas) e "Cadastro" (formulário de nova conta ou edição).

#### Aba Grade

Mostra uma tabela com todas as contas cadastradas. Colunas: Tipo, Descrição, Vencimento, Valor (vermelho se for "a pagar", verde se for "a receber"), Status e Ações.

- Clicar em uma linha da tabela seleciona essa conta (fica destacada em amarelo); clicar de novo desmarca.
- Dar duplo clique em uma linha abre direto a edição dessa conta.
- Clicar na etiqueta de status ("Pago" / "Em aberto") alterna o status da conta sem precisar abrir a edição.

**Botões da barra de ferramentas** (os de Editar e Excluir só ficam ativos com uma conta selecionada):
- **Novo**: abre o formulário em branco para cadastrar uma conta nova.
- **Editar**: abre a conta selecionada para edição.
- **Excluir**: pede confirmação ("Excluir a conta '[descrição]'?") e, se confirmado, apaga a conta.

**Botões na própria linha da tabela** (funcionam igual aos de cima, sem precisar selecionar antes): olho (detalhe completo da conta: tipo, valor, vencimento, categoria, status, observação), lápis (editar), lixeira (excluir, com a mesma confirmação).

#### Aba Cadastro (nova conta ou edição)

**Campos do formulário:**
- **Tipo** (obrigatório): seleção entre "A pagar" ou "A receber". Padrão é "A pagar".
- **Descrição** (obrigatório): texto livre, ex: nome do fornecedor ou motivo da conta.
- **Valor (R$)** (obrigatório): valor numérico da conta.
- **Vencimento** (obrigatório): data de vencimento da conta.
- **Categoria** (opcional): texto livre, com sugestão de exemplo "Fornecedor, Aluguel, Energia".
- **Observação** (opcional): texto livre maior (caixa de texto), sem limite específico.
- **Pago**: chave liga/desliga que só aparece quando a conta já existe (está sendo editada) - indica se a conta já foi paga.

**Botões:**
- **Gravar**: salva a conta. Só fica habilitado se Descrição, Valor e Vencimento estiverem preenchidos e não estiver salvando no momento. Depois de gravar, volta para a aba Grade.
- **Limpar**: descarta as alterações não salvas e volta os campos ao estado original (em branco se for cadastro novo, ou aos dados originais se estiver editando).
- **Cancelar**: fecha o formulário sem salvar e volta para a aba Grade.

**Aviso de negócio importante:** não existe restrição que impeça editar ou excluir uma conta já marcada como paga - todas as contas podem ser editadas e excluídas livremente (com confirmação apenas na exclusão).

**Acesso restrito a "admin".**

---

## Grupo Compras

### Cotação

Tela para pedir cotação de preço a fornecedores antes de fechar uma compra: você monta uma lista de itens sem preço, envia para o fornecedor (por e-mail ou WhatsApp) e, quando ele responde com os valores, você aceita a cotação e o sistema gera automaticamente um Pedido de Compra.

A tela é organizada por abas de status: **Todos**, **Em aberto**, **Enviadas**, **Respondidas**, **Aceitas**. Cada aba mostra, ao lado do nome, a quantidade de cotações naquele status.

#### Grade de cotações

Tabela com colunas: Número (formato CT.0001), Fornecedor, Status, Data e Ações.

- Clicar em uma linha seleciona a cotação (destaque amarelo).
- Dar duplo clique em uma cotação com status "Aberto" abre a edição dela (cotações em outro status não abrem por duplo clique).

**Botões da barra de ferramentas** (a maioria só habilita conforme o status da cotação selecionada):
- **Novo**: abre o formulário para criar uma cotação nova.
- **Atualizar**: busca a lista mais recente de cotações no sistema (mostra "Atualizando..." enquanto carrega).
- **Editar**: só habilitado se a cotação selecionada estiver com status "Aberto". Abre o formulário de edição.
- **Enviar e-mail**: habilitado se a cotação estiver "Aberto" ou "Enviado". Envia a cotação por e-mail ao fornecedor. Se o fornecedor não tiver e-mail cadastrado, mostra aviso "Esse fornecedor não tem e-mail cadastrado" e não envia. Ao concluir, mostra mensagem de sucesso com o e-mail usado.
- **Enviar WhatsApp**: habilitado se a cotação estiver "Aberto" ou "Enviado". Abre o WhatsApp Web/App com uma mensagem pronta contendo o link para o fornecedor responder a cotação online. Se o fornecedor não tiver telefone cadastrado, mostra aviso e não abre nada. Se a cotação ainda estava "Aberto", o status muda automaticamente para "Enviado" ao clicar.
- **Aceitar**: só habilitado se a cotação estiver "Respondida". Pede confirmação ("Aceitar a cotação CT.XXXX e gerar um Pedido de Compra com os valores informados pelo fornecedor?"). Ao confirmar, gera automaticamente um Pedido de Compra com os preços e quantidades que o fornecedor informou.
- **Recusar**: só habilitado se a cotação estiver "Respondida". Pede confirmação destrutiva e muda o status para "Recusada".
- **Cancelar**: habilitado se a cotação estiver "Aberto" ou "Enviado". Pede confirmação destrutiva e muda o status para "Cancelada".
- **Excluir**: desabilitado apenas se a cotação já estiver "Aceita" (nesse caso não pode mais ser excluída, pois já virou um pedido de compra). Pede confirmação destrutiva.

**Botões na própria linha:** olho (detalhe da cotação: fornecedor, status, observação, e se já tiver resposta do fornecedor, a lista dos itens com quantidade pedida x quantidade e preço cotados), check verde (aparece só se "Respondida" — mesma ação de "Aceitar"), lixeira (aparece em qualquer status diferente de "Aceita" — mesma ação de "Excluir").

#### Formulário de nova cotação / edição

Só é possível editar uma cotação com status "Aberto".

**Campos:**
- **Fornecedor** (obrigatório): lista suspensa com os fornecedores cadastrados. Se o fornecedor escolhido não tiver e-mail cadastrado, aparece o aviso "Esse fornecedor não tem e-mail cadastrado - complete o cadastro pra poder enviar."
- **Itens**: cada item tem:
  - **Produto (opcional) ou descrição**: pode escolher um produto já cadastrado no catálogo (preenche a descrição automaticamente) ou digitar uma descrição livre.
  - **Quantidade** (obrigatório por item, deve ser maior que zero): quantidade desejada.
  - Botão de lixeira para remover aquele item da lista.
- **Adicionar item**: acrescenta uma nova linha de item em branco.
- **Observação** (opcional): texto livre, com sugestão "Ex: prazo de entrega desejado, condições de pagamento...".

**Validações ao salvar:**
- É obrigatório escolher um fornecedor ("Selecione um fornecedor").
- É obrigatório ter ao menos um item com descrição preenchida e quantidade maior que zero ("Adicione pelo menos um item válido") - itens vazios ou com quantidade zero são descartados automaticamente.

**Botões:** Gravar, Limpar, Cancelar.

**Observação de negócio:** a cotação não tem preço nos itens - o preço é preenchido pelo fornecedor quando ele responde pelo link enviado.

**Acesso restrito a "admin".**

### Pedido de Compra

Tela para registrar um pedido de compra formal para um fornecedor, já com quantidades e custos definidos (diferente da Cotação, que não tem preço). Pode ser criado do zero ou gerado automaticamente ao aceitar uma Cotação.

Organizada por abas de status: **Todos**, **Em aberto**, **Enviados**, **Atendidos**, **Cancelados**, cada uma mostrando a quantidade de pedidos.

#### Grade de pedidos de compra

Tabela com colunas: Número (formato PC.0001), Fornecedor, Status, Total, Data e Ações.

- Clicar na linha seleciona o pedido.
- Duplo clique em pedido "Aberto" abre a edição.

**Botões da barra de ferramentas:**
- **Novo**: abre formulário em branco.
- **Atualizar**: recarrega a lista com os dados mais atuais.
- **Editar**: só habilitado se o pedido selecionado estiver "Aberto".
- **Enviar e-mail**: desabilitado se o pedido estiver "Atendido" ou "Cancelado". Envia o pedido por e-mail ao fornecedor (mesmo aviso de "sem e-mail cadastrado" se for o caso).
- **Enviar WhatsApp**: desabilitado se "Atendido" ou "Cancelado". Monta uma mensagem com a lista de itens, total estimado e observação, e abre o WhatsApp para envio. Se o pedido estava "Aberto", muda automaticamente para "Enviado".
- **Lançar entrada**: só habilitado se o pedido estiver "Enviado". Leva direto para a tela "Entrada de NF" já com o fornecedor e os itens desse pedido pré-preenchidos.
- **Cancelar**: desabilitado se "Atendido" ou "Cancelado". Pede confirmação destrutiva e muda o status para "Cancelado".
- **Excluir**: desabilitado apenas se o pedido já estiver "Atendido" (não pode mais excluir depois que a entrada foi lançada). Pede confirmação destrutiva.

**Botões na própria linha:** olho (ver detalhe), lápis (editar, só em "Aberto"), envelope azul (enviar e-mail, se não atendido/cancelado), WhatsApp verde (idem), seta de "Lançar entrada" (só em "Enviado"), lixeira (qualquer status exceto "Atendido").

#### Formulário de novo pedido / edição

**Campos:**
- **Fornecedor** (obrigatório): lista suspensa. Mesmo aviso de "sem e-mail cadastrado" se aplicável.
- **Itens**: cada item tem:
  - **Produto (opcional) ou descrição**: escolher produto do catálogo (preenche descrição e sugere o custo unitário cadastrado do produto) ou digitar descrição livre.
  - **Quantidade** (obrigatório, maior que zero).
  - **Custo unit. (R$)**: valor unitário do item, com máscara de moeda.
  - **Subtotal**: calculado automaticamente (quantidade x custo unitário), somente exibição.
  - Botão de lixeira para remover o item.
- **Adicionar item**: acrescenta nova linha em branco.
- **Observação** (opcional): texto livre, sugestão "Ex: prazo de entrega desejado, forma de pagamento combinada...".
- **Total estimado**: soma automática de todos os subtotais, exibida em destaque (só leitura).

**Como o total é calculado:** cada item tem Subtotal = Quantidade × Custo unitário. O Total estimado é a soma do subtotal de todos os itens (o frete não entra aqui, porque nesse momento ainda é só uma estimativa de compra — o frete real só é lançado depois, na Entrada de NF, quando a mercadoria de fato chega).

**Validações ao salvar:** mesmas do formulário de Cotação - fornecedor obrigatório e ao menos um item válido (descrição preenchida e quantidade maior que zero).

**Botões:** Gravar, Limpar, Cancelar - mesmo comportamento da Cotação.

**Acesso restrito a "admin".**

### Entrada de NF

Essa é a tela usada para registrar a entrada de uma compra de mercadoria - ou seja, o momento em que os produtos comprados de um fornecedor chegam fisicamente na loja. É a tela mais completa do grupo Compras, com três abas: **Grade**, **Cadastro** e **Notas do Bling**.

#### Aba Grade

Mostra um bloco de filtros e, abaixo, a tabela de compras.

**Filtros disponíveis** (todos combináveis entre si):
- **Fornecedor**: lista suspensa com todos os fornecedores.
- **Número da nota**: busca por texto (contém).
- **Status**: Todos / Pendente / Recebida / Cancelada.
- **Observação/descrição**: busca por texto na observação da compra.
- **Data da compra - de / até**: intervalo de datas da compra.
- **Data de entrada - de / até**: intervalo de datas em que a compra foi efetivamente recebida (só considera compras já com status "Recebida" - se preenchido, oculta as demais).
- **Pedido de compra**: busca pelo número do pedido de compra vinculado (ex: PC.0001).
- **Limpar filtros**: apaga todos os filtros de uma vez.

**Tabela**, colunas: Fornecedor, NF (número da nota + chave de acesso, se houver), Pedido de compra vinculado, Data, Total, Status, Ações.

**Botão "Nova compra"** (canto superior direito, visível só na aba Grade): abre o formulário de cadastro em branco.

**Ações por linha:**
- Olho: mostra o detalhe completo da compra (fornecedor, CNPJ/CPF, número da nota, chave de acesso, status, pedido de compra vinculado, data da compra, vencimento, valor dos itens, frete, total e observação).
- As demais ações **só aparecem se a compra estiver "Pendente"**:
  - Lápis (Editar): abre a compra para edição.
  - Ícone de caixa com check verde (Receber): confirma o recebimento da compra (ver detalhes abaixo).
  - Proibido (Ban) vermelho (Cancelar): cancela a compra.
  - Lixeira (Excluir): exclui a compra.

**Aviso de negócio - muito importante:** uma compra com status "Recebida" ou "Cancelada" **não pode mais ser editada, recebida de novo, cancelada ou excluída** - as únicas ações disponíveis para ela são visualizar o detalhe. Isso é assim porque, uma vez recebida, a compra já afetou o estoque, o custo dos produtos e o financeiro.

**O que acontece ao clicar em "Receber":**
1. Aparece a confirmação: *"Confirmar o recebimento da compra de '[fornecedor]'? Isso vai dar alta no estoque, atualizar o custo dos produtos e gerar uma conta a pagar."*
2. Se confirmado, o sistema dá entrada nas quantidades dos produtos no estoque, atualiza o custo desses produtos e cria automaticamente uma conta a pagar referente a essa compra.
3. O status da compra muda para "Recebida" e ela sai da lista de pendentes (perde os botões de ação, exceto o olho de detalhe).

**O que acontece ao clicar em "Cancelar":** pede confirmação ("Cancelar a compra de '[fornecedor]'?") e, se confirmado, muda o status para "Cancelada" - sem nenhum efeito em estoque, custo ou financeiro, já que só compras recebidas afetam esses pontos.

**O que acontece ao clicar em "Excluir":** pede confirmação destrutiva ("Excluir a compra de '[fornecedor]'? Essa ação não pode ser desfeita.") e remove definitivamente a compra - só é permitido enquanto ela ainda está "Pendente".

#### Aba Cadastro (nova compra ou edição)

No topo, uma barra fixa mostra "Nova compra" ou "Editando compra", com os botões:
- **Cancelar**: fecha o formulário sem salvar e volta para a Grade.
- **Salvar compra / Salvar alterações**: grava a compra (o texto do botão muda conforme é cadastro novo ou edição). Fica desabilitado enquanto está salvando ou carregando os dados de edição.

**Avisos que podem aparecer no topo do formulário, dependendo de como a tela foi aberta:**
- Se a compra está sendo lançada a partir de uma nota do Bling: aviso explicando que é preciso importar o XML dessa nota para preencher os itens, e que ao salvar a compra fica vinculada e some da lista de pendentes em "Notas do Bling".
- Se a compra está referenciada a um Pedido de Compra (ex: veio do botão "Lançar entrada" da tela Pedido de Compra): aviso informando que, ao salvar, aquele pedido de compra é marcado como "atendido".
- Se, ao importar um XML, o sistema identificar que o fornecedor da nota tem pedido(s) de compra enviados aguardando entrega, aparece um aviso sugerindo vincular a compra a um desses pedidos, com um botão "Referenciar PC.XXXX" para cada opção encontrada.

**Importação de XML da NF-e:**
- Botão "Importar XML da NF-e": abre o seletor de arquivo (só aceita `.xml`). Texto explicativo: "Lê o XML que o fornecedor enviou e preenche fornecedor, número e itens automaticamente. Não precisa de certificado digital - só leitura."
- Ao importar, o sistema:
  - Lê e valida a chave de acesso do XML. Se a chave não bater na validação, mostra o aviso "A chave de acesso deste XML não bateu na validação (dados podem estar incompletos ou o arquivo alterado) - confira os valores antes de salvar."
  - Procura um fornecedor já cadastrado com o mesmo CNPJ do emitente da nota; se não encontrar, **cadastra automaticamente** um novo fornecedor com os dados do emitente (razão social, nome fantasia, CNPJ, telefone e endereço). Nesse caso aparece um aviso lembrando de conferir o cadastro depois: a nota não traz inscrição estadual, e-mail nem condição de pagamento.
  - Preenche automaticamente número da nota, data de emissão, valor do frete (se houver) e a chave de acesso.
  - Lista os itens da nota para você vincular a produtos do catálogo (ver abaixo).
  - Se algo der errado na leitura do arquivo, mostra a mensagem de erro retornada.

**Itens da nota a vincular** (só aparece se houver itens ainda não vinculados): uma grade com Item da nota (descrição, código do produto no fornecedor e NCM), Quantidade, Custo unitário, o produto do catálogo e as ações.

Embaixo de cada item, o sistema diz **como ele foi reconhecido** — "Vinculado pelo código de barras", "Vinculado pelo código do fornecedor" — ou, quando não achou, explica o motivo: se a nota não trouxe código de barras, se o código de barras não está em nenhum produto, se nenhum produto tem aquele SKU. Assim dá pra saber o que corrigir sem conferir produto por produto.

- **Vincular** — usa o produto escolhido na lista e move o item para os itens da compra.
- **Cadastrar produto** (aparece só nos itens sem produto) — cria um produto novo já com descrição, NCM, código de barras e custo vindos da nota, e vincula o item na hora. O preço de venda nasce igual ao custo, de propósito: preço é decisão comercial e não vem no XML — defina depois em Produtos ou em Reajuste de Preços. É o caminho recomendado na primeira importação, quando o catálogo ainda está vazio.

Item não vinculado **não entra na compra** e não movimenta estoque.

**Campos principais do formulário:**
- **Fornecedor** (obrigatório): lista suspensa com os fornecedores cadastrados.
- **Número da nota** (opcional): número da nota fiscal emitida pelo fornecedor.
- **Chave de acesso** (opcional): campo numérico de até 44 dígitos (só aceita números, corta automaticamente após 44). Preenchido sozinho ao importar XML; em lançamento manual só se recomenda preencher se o usuário tiver a chave em mãos. Se os 44 dígitos forem digitados mas não formarem uma chave válida, aparece o aviso "Esses 44 dígitos não formam uma chave válida - confira antes de salvar." (a validação usa a regra oficial de dígito verificador da chave de acesso da NF-e).
- **Data da compra** (obrigatório, vem preenchida com a data de hoje por padrão): data em que a compra foi feita/negociada.
- **Vencimento** (opcional): prazo de pagamento combinado com o fornecedor (ex: 30/60 dias). Se ficar vazio, o sistema usa a data da compra.
- **Valor do frete (R$)** (opcional): valor do frete, com máscara de moeda.
- **Observação** (opcional): texto livre.

**Itens da compra:**
- Linha de adição: lista suspensa de produto (mostra nome, SKU e estoque atual de cada um), campo de quantidade, campo de custo unitário (R$) e botão "Adicionar" (só habilita com um produto selecionado). Ao escolher um produto, se o custo unitário não for digitado manualmente, o sistema usa o custo cadastrado do produto como sugestão.
- Tabela de itens já adicionados: Produto, Qtd, Custo unit., Subtotal (calculado) e botão de lixeira para remover o item.
- Rodapé com totais: soma dos itens, frete e total geral da compra (soma automática).

**Como o total é calculado:** cada item tem Subtotal = Quantidade × Custo unitário. Total da compra = soma do subtotal de todos os itens + Valor do frete. É esse total que, quando a compra é "Recebida", vira a conta a pagar gerada automaticamente — por isso o frete entra na conta aqui (diferente do Pedido de Compra, que ainda não inclui frete por ser só uma estimativa).

**Sobre o custo médio do produto:** ao "Receber" a compra, o custo cadastrado de cada produto é recalculado assim: Novo custo = ((Estoque que já existia × Custo que já tinha) + (Quantidade comprada agora × Custo desta compra)) ÷ (Estoque que já existia + Quantidade comprada agora). Se o produto nunca teve estoque antes, o custo novo vira simplesmente o custo desta compra. Essa conta (chamada de "custo médio ponderado") existe pra que o custo do produto reflita o que a loja realmente pagou ao longo do tempo — e não fique errado quando o mesmo produto é comprado de fornecedores diferentes, por preços diferentes, em momentos diferentes.

**Validações ao salvar:**
- Fornecedor é obrigatório ("Selecione um fornecedor").
- É necessário ao menos um item ("Adicione pelo menos um item").
- Se a chave de acesso tiver exatamente 44 dígitos e não for válida, o sistema bloqueia o salvamento com a mensagem "A chave de acesso digitada não é válida - confira os 44 dígitos."

**Regra importante ao editar:** só é possível abrir para edição uma compra que ainda esteja "Pendente" - as ações de editar não ficam disponíveis para compras já recebidas ou canceladas.

#### Aba Notas do Bling

Mostra as notas de entrada que já foram emitidas e autorizadas pelo Bling (sistema de gestão integrado usado pela loja), permitindo saber quais delas ainda precisam ser lançadas aqui no sistema. Texto explicativo na tela: "Acompanha as notas de entrada já registradas no Bling (fornecedor emitiu, Sefaz autorizou). O lançamento no nosso sistema (dar entrada no estoque/custo) continua sendo feito importando o XML dessa nota em 'Cadastro'."

**Filtros por status** (botões em formato de pílula): Pendente, Lançada, Cancelada, Todas. "Pendente" é o filtro inicial ao abrir a aba.

**Botão "Atualizar"**: consulta novamente o Bling para buscar as notas mais recentes (mostra "Consultando..." enquanto carrega, com ícone girando).

**Tabela**, colunas: NF (número/série), Fornecedor, Emissão, Valor, Situação (Bling) - o status oficial da nota no Bling -, Status - se já foi lançada aqui no nosso sistema ou ainda está pendente - e Ações.

**Botão "Lançar entrada"** (só aparece nas notas com status local "Pendente"): leva direto para a aba Cadastro, já preenchendo o número da nota e marcando que essa compra ficará vinculada àquela nota do Bling. A partir daí, o usuário ainda precisa importar o XML da nota para completar os itens.

Se houver erro ao consultar o Bling, a mensagem de erro retornada é exibida na tela.

**Acesso restrito a "admin".**

### Fornecedores

Tela de cadastro dos fornecedores da loja, usada como base para Cotação, Pedido de Compra e Entrada de NF. Também dividida em abas: **Grade** e **Cadastro**.

#### Aba Grade

Tabela com colunas: Razão social (e, abaixo em cinza, o nome fantasia se houver), CNPJ/CPF, Telefone, Status (Ativo/Inativo) e Ações.

- Clicar na linha seleciona o fornecedor (destaque amarelo).
- Duplo clique abre a edição.

**Botões da barra de ferramentas** (Editar e Excluir só habilitam com fornecedor selecionado):
- **Novo**: abre o formulário em branco.
- **Editar**: abre o fornecedor selecionado para edição.
- **Excluir**: pede confirmação ("Excluir o fornecedor '[razão social]'?") e exclui. Se o sistema recusar a exclusão (por exemplo, fornecedor já usado em compras), mostra a mensagem de erro retornada em vez de excluir.

**Botões na linha:** olho (detalhe), lápis (editar), lixeira (excluir) - mesmas ações de cima.

#### Aba Cadastro (novo fornecedor ou edição)

**Campos do formulário:**
- **Razão social** (obrigatório): nome oficial do fornecedor.
- **Nome fantasia** (opcional).
- **CNPJ/CPF** (opcional): campo numérico com máscara automática de CNPJ ou CPF.
- **Inscrição Estadual** (opcional): sugestão de exemplo "Isento, se não contribuinte".
- **Telefone** (opcional): campo com máscara automática de telefone.
- **E-mail** (opcional): campo de e-mail.
- **CEP** (opcional): campo numérico com máscara automática de CEP.
- **Logradouro** (opcional).
- **Número** (opcional).
- **Complemento** (opcional).
- **Bairro** (opcional).
- **Cidade** (opcional).
- **Estado (UF)** (opcional): até 2 letras, convertidas automaticamente para maiúsculas.
- **Observação** (opcional).
- **Ativo**: chave liga/desliga que só aparece ao editar um fornecedor já existente (indica se o fornecedor está ativo ou inativo para uso nas outras telas).

**Botões:**
- **Gravar**: salva o fornecedor. Só habilita se "Razão social" estiver preenchida e não estiver salvando no momento.
- **Limpar**: descarta as alterações e volta aos valores originais (em branco, se for cadastro novo).
- **Cancelar**: fecha o formulário sem salvar.

**Observação de negócio:** o CNPJ/CPF, telefone e CEP são guardados só com os números (sem pontuação) ao salvar, mesmo que na tela apareçam formatados.

**Acesso restrito a "admin".**

---

## Grupo Relatórios

### Vendas

Tela principal de relatórios: mostra as vendas de um período escolhido (gráfico, totais, produtos mais vendidos, posição de estoque) e uma lista detalhada dos pedidos daquele período, com filtros. Serve pra acompanhar o desempenho da loja dia a dia.

#### Filtro de período

- **De** — data inicial do período. Campo de data.
- **Até** — data final do período. Campo de data.
- **Botão "Filtrar"** — recarrega a tela trazendo os dados só do período escolhido.

#### Botão "Imprimir" (canto superior)

Abre uma janela onde é possível escolher quais seções aparecem na impressão/PDF: "Vendas de hoje", "Resumo (pedidos, faturamento, ticket)", "Gráfico de vendas", "Vendas por origem", "Produtos mais vendidos", "Posição de estoque" e "Lista de pedidos". As seções desmarcadas somem só da impressão — na tela continuam aparecendo normalmente.

#### Cartões "Vendas de hoje" e "Faturamento de hoje"

- **Vendas de hoje** — quantidade de pedidos pagos criados no dia de hoje.
- **Faturamento de hoje** — soma em dinheiro desses pedidos pagos de hoje.
- Aviso: esses dois números só fazem sentido se o período escolhido acima cobrir o dia de hoje. Se o período for de um mês passado, por exemplo, esses cartões aparecem zerados de propósito — não é erro do sistema.

#### Cartões de resumo do período

- **Pedidos pagos** — quantidade total de pedidos pagos dentro do período escolhido.
- **Faturamento no período** — soma em dinheiro de todos esses pedidos pagos.
- **Ticket médio** — Faturamento no período ÷ Pedidos pagos. É o valor médio que cada cliente gastou por pedido — serve pra saber se, além de vender mais vezes, a loja está vendendo mais por venda (ex: subiu de R$80 pra R$110 de ticket médio, mesmo com a mesma quantidade de pedidos).

#### Gráfico "Vendas no período"

Gráfico de linha mostrando o total vendido por dia dentro do período escolhido. Se não houve nenhuma venda no período, mostra a mensagem "Nenhuma venda no período." em vez do gráfico.

#### Tabela "Vendas por origem"

Mostra quanto foi vendido pelo Site e quanto foi vendido no Balcão (venda presencial), com número de pedidos e faturamento de cada um.

#### Tabela "Produtos mais vendidos no período"

- Lista os produtos vendidos no período, com quantidade e faturamento de cada um.
- **Botão "Mais vendidos" / "Menos vendidos"** (com ícone de seta) — inverte a ordem da lista: do mais vendido pro menos vendido, ou o contrário. Esse botão não aparece na impressão.

#### Seção "Estoque (posição atual)"

Atenção: diferente do resto da tela, esses números de estoque são a foto de agora, não do período escolhido nos filtros de data.

- **Produtos ativos** — quantidade de produtos ativos cadastrados na loja.
- **Unidades em estoque** — soma de todas as unidades de todos os produtos.
- **Valor em estoque** — mesma conta da tela de Relatórios > Estoque: soma de (Estoque atual × Valor unitário) de cada produto.
- **Em baixa** (com ícone de alerta) — quantidade de produtos com estoque igual ou abaixo do mínimo cadastrado.

#### Tabela "Produtos com estoque baixo"

Lista os produtos em situação de baixa, com nome (link que leva à tela de Estoque), SKU, quantidade mínima cadastrada e quantidade atual em estoque.

#### Seção "Pedidos do período"

Lista detalhada de todos os pedidos do período, com filtros próprios:

- **Canal** — filtra por canal de venda: Todos os canais, Site, WhatsApp, Instagram ou Balcão.
- **Status** — filtra por situação do pedido: Todos os status, Aguardando pagamento, Pago, Em separação, Enviado, Entregue ou Cancelado.
- **Entrega** — filtra por tipo de entrega: Todas as vendas, Somente sem entrega, ou um dos tipos de entrega cadastrados (retirada, motoboy etc).
- **Categoria** — filtra pedidos que contenham produtos de uma categoria específica, ou Todas as categorias.
- **Botão "Limpar filtros"** — só aparece quando algum filtro está ativo; remove todos os filtros de uma vez.

Abaixo dos filtros aparece a contagem de pedidos encontrados, e a tabela com data, cliente (link que leva ao pedido), canal, tipo de entrega, status e valor total de cada pedido.

Acesso: todo usuário do admin.

### Lucro / DRE

Mostra o resultado financeiro estimado da loja num período: quanto entrou, quanto foi gasto com produto/taxas/impostos/despesas fixas, e quanto sobrou de lucro. Serve pra o dono acompanhar se a loja está de fato dando lucro, não só faturando.

#### Filtro de período

- **De** / **Até** — datas inicial e final do período.
- **Botão "Filtrar"** — recarrega a tela com o novo período.

#### Aviso "Taxas de pagamento e alíquota de imposto ainda não configuradas"

Aparece automaticamente quando houve faturamento no período mas as taxas de pagamento e o imposto ainda não foram preenchidos em Configurações. Nesse caso os valores mostrados na tela não descontam essas despesas — ou seja, o lucro líquido mostrado fica mais otimista do que o real. Tem um link direto pra "Configurações > Custos" pra corrigir.

#### Cartões principais

- **Faturamento** — total vendido (pedidos pagos) no período, com selo mostrando a variação percentual em relação ao período anterior de mesma duração.
- **CMV (custo dos produtos vendidos)** — quanto custou pra loja comprar/produzir o que foi vendido.
- **Margem bruta** — faturamento menos o CMV.
- **Lucro líquido** — resultado final depois de descontar CMV, taxas de pagamento, imposto estimado e despesas fixas. Aparece em verde se positivo, em vermelho se negativo, com selo de variação em relação ao período anterior.

Logo abaixo dos cartões há um aviso indicando com qual período anterior a comparação está sendo feita (mesma duração de dias, mas anterior ao período escolhido).

#### Tabela "Composição do resultado"

Mostra a conta completa, linha por linha, do faturamento até o lucro líquido, na ordem abaixo — cada linha é calculada assim:

1. **Faturamento** — soma de todos os pedidos pagos no período.
2. **(-) CMV** (Custo da Mercadoria Vendida) — soma do custo médio de cada produto vendido, multiplicado pela quantidade vendida dele. Usa sempre o custo médio *atual* do produto (o que está cadastrado agora, não o custo que ele tinha na época da venda).
3. **= Margem bruta** — Faturamento − CMV.
4. **(-) Taxas de pagamento (estimado)** — pra cada pedido pago no período: (Total do pedido × Taxa percentual do Mercado Pago ÷ 100) + Taxa fixa do Mercado Pago. Depois soma tudo. Os dois valores (percentual e fixo) vêm de Configurações > Custos.
5. **(-) Imposto estimado** — Faturamento × Alíquota de imposto configurada ÷ 100 (também vem de Configurações > Custos).
6. **(-) Despesas fixas do período** — soma das contas a pagar com vencimento dentro do período escolhido, **exceto** as que forem categorizadas como compra de mercadoria (essas já entram na conta via CMV, então contar de novo aqui duplicaria o gasto).
7. **= Lucro líquido estimado** — Margem bruta − Taxas de pagamento − Imposto estimado − Despesas fixas.

#### Tabela "Margem por produto"

Lista cada produto vendido no período com a margem em dinheiro e em percentual. Margem em dinheiro = Faturamento do produto − Custo total do produto (custo médio × quantidade vendida). Margem em percentual = Margem em dinheiro ÷ Faturamento do produto × 100. Produtos com margem negativa (vendidos por menos do que custaram) aparecem em vermelho.

#### Tabela "Margem por categoria"

Mesma conta da tabela anterior, mas agrupando todos os produtos vendidos de cada categoria antes de calcular.

**Acesso restrito a "admin".**

### Estoque

Mostra a posição atual (agora, sem filtro de data) de todo o estoque da loja, valorizado pelo preço de venda. Serve pra saber quanto vale o estoque parado e quais produtos precisam de reposição.

#### Filtros

- **Buscar produto** — campo de texto; filtra pelo nome do produto (não diferencia maiúscula/minúscula).
- **Categoria** — filtra por uma categoria específica, ou Todas as categorias.
- **Somente abaixo do mínimo** (caixa de marcar) — mostra só produtos cujo estoque está igual ou abaixo do estoque mínimo cadastrado.
- **Somente estoque zerado** (caixa de marcar) — mostra só produtos com estoque zero ou negativo.
- **Botão "Limpar filtros"** — só aparece com algum filtro ativo; limpa todos de uma vez.

#### Botão "Imprimir"

Permite escolher se a impressão inclui "Resumo de totais" e/ou "Lista de produtos".

#### Cartões de resumo

- **Produtos listados** — quantos produtos aparecem depois dos filtros aplicados.
- **Valor em estoque (venda)** — soma do valor de venda de tudo que está em estoque (considerando o preço promocional quando existir).
- **Abaixo do mínimo** — quantidade de produtos com estoque igual ou abaixo do mínimo.
- **Zerados** — quantidade de produtos com estoque zero ou negativo.

#### Tabela de produtos

Colunas: Produto, Categoria, Estoque (quantidade atual), Mínimo (quantidade mínima cadastrada), Valor unitário (preço promocional se houver, senão o preço normal), Valor em estoque (unitário x quantidade) e Situação ("Baixo" em laranja quando está no mínimo ou abaixo, "OK" em verde quando está acima). No rodapé da tabela aparece o total geral do valor em estoque.

**Como o valor em estoque é calculado:** Valor em estoque de um produto = Estoque atual × Valor unitário (usando o preço promocional quando ele existir, já que é por esse valor que a loja realmente venderia aquela unidade). O total geral no rodapé é a soma desse cálculo pra todos os produtos filtrados — é uma estimativa de quanto dinheiro está "parado" em mercadoria, pelo preço de venda (não pelo custo de compra).

Acesso: todo usuário do admin.

---

## Notas Fiscais

Central de documentos fiscais: reúne numa lista só as notas de **entrada** (as que os fornecedores emitiram e você importou em Compras > Entrada de NF) e as de **saída** (as que a loja emitiu pelos pedidos). Serve pra imprimir o DANFE e baixar o XML de qualquer nota sem precisar abrir o Bling.

### Abas

- **Todas** — entradas e saídas juntas, da mais recente para a mais antiga.
- **Entradas** — só notas de fornecedor.
- **Saídas** — só notas emitidas pela loja.

### Filtros

- **Buscar** — procura por número da nota, nome do fornecedor/cliente ou chave de acesso.
- **Emissão de / até** — período de emissão da nota (é por emissão que o contador fecha o mês).
- **Este mês / Mês passado** — atalhos que preenchem o período.
- **Só sem XML guardado** — mostra as notas que ainda não têm o arquivo salvo. Serve pra saber o que falta antes de mandar o lote pro contador.
- **Limpar filtros** — volta a lista ao estado inicial. Ao lado, o sistema mostra quantas notas foram encontradas.

### Tabela

Colunas: Tipo (Entrada em azul, Saída em verde), Número/Série, Emissão, Fornecedor/Cliente, Valor e Ações.

- **Ver detalhes** — abre uma janela com tipo, emissão, participante, valor, chave de acesso (formatada em grupos de 4) e se o XML já está guardado.
- **Imprimir DANFE** — gera o documento e abre no visualizador de PDF, pronto pra imprimir.
- **Baixar XML** — salva o arquivo XML autorizado, com a chave de acesso no nome (é o formato que o contador espera).

**Primeiro acesso a uma nota de saída:** o XML dela é buscado no Bling na primeira vez que você clica em DANFE ou XML, e fica guardado a partir daí. Por isso, notas de saída recém-emitidas podem aparecer sem número e sem data até o primeiro clique.

**Acesso restrito a "admin".**

---

## Grupo Configurações

### Usuários

Cadastro dos usuários que têm acesso ao painel administrativo (quem loga no sistema), com o papel de cada um (administrador ou operador).

#### Aba "Grade"

Lista todos os usuários cadastrados.

- **Barra de ferramentas**:
  - **Novo** — abre a aba de cadastro em branco.
  - **Editar** — abre a aba de cadastro preenchida com o usuário selecionado na grade (só habilitado com uma linha selecionada).
  - **Excluir** — pede confirmação e exclui o usuário selecionado (só habilitado com uma linha selecionada).
- **Clicar numa linha** — seleciona/desseleciona o usuário (fica destacada).
- **Duplo clique numa linha** — abre direto pra edição.
- Ícones de ação em cada linha (aparecem independente da seleção):
  - **Olho** — abre janela com o detalhe do usuário (usuário de login, e-mail, papel, status, último acesso, data de criação).
  - **Lápis** — abre a edição desse usuário.
  - **Lixeira** (vermelha) — pede confirmação e exclui esse usuário.
- Colunas da tabela: Nome, Usuário (login), Email, Papel, Status (Ativo/Inativo), Último acesso ("Nunca acessou" se ainda não logou) e Ações.

#### Aba "Cadastro"

- **Barra de ferramentas**:
  - **Gravar** — salva o usuário (novo ou edição). Fica desabilitado enquanto o Nome estiver vazio, ou — só em cadastro novo — enquanto Email ou Senha estiverem vazios.
  - **Limpar** — descarta o que foi digitado e volta os campos ao valor original (em branco se for cadastro novo, ou aos dados atuais se for edição).
  - **Cancelar** — fecha o formulário sem salvar e volta pra Grade.

Campos:
- **Nome** — obrigatório. Texto livre.
- **Email** — obrigatório só em cadastro novo. Não pode ser alterado depois que o usuário já existe (campo fica bloqueado na edição).
- **Usuário de login (opcional)** — nome de usuário alternativo pra entrar no sistema (ex: joao.silva). Se ficar em branco, o acesso é feito só com o e-mail.
- **Senha** — obrigatória em cadastro novo. Na edição, o rótulo muda pra "Nova senha (deixe em branco para manter)" — se não for preenchida, a senha atual continua valendo.
- **Papel** — escolha entre "Operador" e "Administrador".
- **Ativo** (chave liga/desliga) — só aparece na edição de um usuário já existente; desativa o acesso dele sem precisar excluir o cadastro.

Aviso: qualquer erro retornado ao salvar (ex: e-mail já cadastrado) aparece em vermelho abaixo do formulário.

**Acesso restrito a "admin".**

### Configurações da Loja

Tela central de configuração do site e da loja, dividida em abas: Contato, Páginas, Frete, Aparência, Anúncio, Custos e Integrações. Um único botão "Salvar configurações" no rodapé grava as abas normais de uma vez (Integrações tem botões próprios de salvar, por lidar com senhas e chaves de acesso).

#### Aba "Contato"

- **WhatsApp** — número de telefone, com máscara automática de telefone.
- **Mensagem padrão do WhatsApp** — texto que já vem preenchido quando o cliente clica no botão de WhatsApp do site.
- **Instagram** — usuário do Instagram da loja (texto livre, ex: @coisasbrasileiras).
- **Email de contato** — campo de e-mail.
- **Endereço** — endereço mostrado na página de Contato do site.

#### Aba "Páginas"

- **Texto da página "Sobre Nós"** — área de texto grande (história da loja, missão, valores etc.), mostrada na página /sobre do site. Linhas em branco separam parágrafos.

#### Aba "Frete"

- **CEP de origem (endereço da loja)** — usado só se a loja for usar cotação real de frete pela Frenet; combinado com o token da Frenet configurado (na aba Integrações), o frete passa a ser calculado automaticamente pela transportadora real em vez da tabela de faixas.
- **Valor base / fallback (R$)** — valor usado só quando não existe faixa de frete cadastrada pro peso/região do cliente.
- **Frete grátis acima de (R$)** — valor de pedido a partir do qual o frete fica grátis.
- **Bloco "Faixas de frete por região e peso"** — texto informativo de que é essa tabela que realmente calcula o frete mostrado no checkout do site. **Botão "Gerenciar faixas"** leva pra tela separada de cadastro de faixas.
- **Bloco "Tipos de entrega (venda balcão)"** — tipos como retirada na loja, motoboy etc., usados ao finalizar uma venda balcão. **Botão "Gerenciar tipos"** leva pra tela separada de cadastro.

#### Aba "Aparência"

- **Logo da loja** — mostra a logo atual (ou a logo padrão do sistema, se nenhuma foi enviada). **Botão "Trocar logo"** abre o seletor de arquivo de imagem e envia a nova logo assim que escolhida (mostra "Enviando..." durante o envio). **Botão "Usar padrão"** (só aparece se já tem logo enviada) remove a logo personalizada e volta a usar a padrão. A logo é usada no cabeçalho e rodapé do site e no painel administrativo.
- **Nome da loja** — nome que aparece no site.
- **Cor principal (botões, links, destaques)** — seletor de cor visual mais campo de texto com o código da cor. Usada nos botões do site, links e destaques de preço. Aviso: escolher um tom escuro o suficiente pra o texto branco continuar legível em cima.
- **Texto do rodapé** — frase curta mostrada no rodapé do site.

#### Aba "Anúncio"

- **Texto no topo do site** — mensagem da faixa de anúncio que aparece no topo do site (ex: cupom de desconto).

#### Aba "Custos"

Usada só pro cálculo do relatório de Lucro/DRE — não afeta o valor cobrado do cliente no checkout.

**Mercado Pago:**
- **Taxa percentual (%)** — percentual cobrado pelo Mercado Pago por transação (campo numérico).
- **Taxa fixa (R$)** — valor fixo cobrado pelo Mercado Pago por transação.
- Aviso: confira a taxa real no painel do próprio Mercado Pago, pois varia por forma de pagamento e volume negociado. Recomendado deixar em branco até a implantação real dessas taxas.

**Imposto:**
- **Regime tributário** — lista: Simples Nacional, Lucro Presumido, Lucro Real ou MEI. Campo só informativo aqui — o cálculo de imposto de verdade continua sendo feito pelo Bling/contador.
- **Alíquota sobre faturamento (%)** — percentual estimado usado só no relatório de lucro líquido. Aviso: confirmar a alíquota real com o contador da loja antes de configurar.

**Clube (assinatura mensal):**
- **Valor da mensalidade (R$)** — valor cobrado automaticamente todo mês via Mercado Pago enquanto a assinatura do cliente estiver ativa. Produtos com "Preço do Clube" preenchido no cadastro do produto mostram esse preço só pra quem tem assinatura ativa.

#### Aba "Integrações"

Tem sub-abas próprias: Bling, Mercado Pago, Frenet e Email. Nessa aba, cada bloco tem botão de salvar próprio ("Salvar credenciais" ou "Salvar") em vez de usar o botão geral "Salvar configurações" do rodapé — as chaves/senhas são guardadas separadas do resto por serem informação sensível.

##### Sub-aba "Bling"

Bloco "Bling (emissão de NF-e)": aviso de que essa integração só emite nota fiscal a partir do pedido pago — não sincroniza estoque nem financeiro com o Bling.

- Mensagens de status que podem aparecer no topo (dependendo do resultado da última tentativa de conexão): "Bling conectado com sucesso!" (verde), erro de confirmação da conexão, erro de recusa das credenciais, ou aviso de que a integração ainda não foi configurada com Client ID/Secret.
- **Client ID** — chave gerada ao registrar o aplicativo em developer.bling.com.br. Campo de senha (mascarado); mostra "configurado" ao lado do rótulo se já existe um salvo. Se deixado em branco, mantém o valor já salvo.
- **Client Secret** — mesma lógica do Client ID.
- **Botão "Salvar credenciais"** — grava Client ID e Client Secret preenchidos.
- **Bloco "Pendência fiscal"** (aparece só quando há um erro recente) — mostra o último erro de emissão/cancelamento de nota (ex: certificado digital não configurado no Bling) direto na tela, com data/hora. Some sozinho assim que uma próxima emissão/cancelamento der certo.
- Abaixo, dependendo do status da conexão:
  - Se ninguém puder ver o status (só administradores enxergam essa parte): mensagem "Apenas administradores podem conectar o Bling."
  - Se já está conectado: selo "Conectado" (verde) e **botão "Reconectar"**.
  - Se não está conectado: **botão "Conectar com o Bling"** — leva pro fluxo de autorização do Bling.

Bloco "Pedidos de Mercado Livre e Shopee": explica que a conexão de Mercado Livre e Shopee é feita direto no painel do próprio Bling (em Configurações > Lojas), e aqui só se informa o código de cada "loja" pra esse sistema importar automaticamente os pedidos desses canais como pedidos de verdade, com baixa de estoque. Canal sem código preenchido não é importado.

- **Código da loja Bling - Mercado Livre** — texto livre (o código vem do painel do Bling).
- **Código da loja Bling - Shopee** — texto livre.
- Esses dois campos são salvos junto com o botão geral "Salvar configurações" do rodapé (não têm botão próprio).

##### Sub-aba "Mercado Pago"

Aviso: o token fica guardado de forma isolada, nunca aparece em nenhuma tela — só é mostrado se já está "configurado". Deixar em branco significa não mexer no que já está salvo.

- **Token de acesso (produção)** — campo de senha (mascarado); mostra "configurado" se já existe.
- **Assinatura secreta do webhook** — campo de senha; obtida no painel do Mercado Pago, na aplicação, em Webhooks (só existe depois de configurar a URL do webhook lá). Aviso: sem essa chave o webhook continua funcionando, mas sem validar se a notificação realmente veio do Mercado Pago.
- **Botão "Salvar"** — grava o token e/ou a assinatura preenchidos.

##### Sub-aba "Frenet"

Usada pra cotação real de frete no checkout e validação de rastreio. Sem essa configuração, o frete cai na tabela de faixas por região.

- **Token** — campo de senha (mascarado); mostra "configurado" se já existe.
- **Botão "Salvar"** — grava o token preenchido.

##### Sub-aba "Email"

Usada pro envio de e-mails/notificações da loja via Gmail.

- **E-mail remetente** — endereço de e-mail usado pra enviar as mensagens.
- **Senha de app** — senha de aplicativo gerada no Gmail (não é a senha normal da conta). Campo de senha (mascarado); mostra "configurado" se já existe.
- **E-mail pra receber notificações internas (opcional)** — se deixado vazio, usa o próprio e-mail remetente pra receber os avisos internos do sistema.
- **Botão "Salvar"** — grava os dados preenchidos.

#### Botão "Salvar configurações" (rodapé da tela)

Salva de uma vez todos os campos das abas Contato, Páginas, Frete, Aparência, Anúncio, Custos e os campos de código de loja do Bling (Mercado Livre/Shopee). Mostra "Salvando..." durante o envio e "Salvo!" por alguns segundos ao concluir. Não inclui as senhas/tokens da aba Integrações — essas têm seus próprios botões, conforme descrito acima.

**Acesso restrito a "admin".**

---

### Auditoria

Mostra o histórico de tudo que foi cadastrado, editado ou excluído no painel administrativo, com quem fez e quando. Serve pra rastrear alterações — por exemplo, descobrir quem mudou o preço de um produto ou quem excluiu um cadastro. Guarda até 500 registros no período escolhido.

#### Filtro de período

- **De** / **Até** — datas do período.
- **Botão "Aplicar período"** — recarrega a tela com o novo período.

#### Filtros adicionais

- **Tela** — filtra pelo nome da tela onde a ação aconteceu (lista é montada automaticamente com as telas que aparecem nos registros), ou Todas as telas.
- **Ação** — filtra pelo tipo de ação: Todas as ações, Cadastro, Edição, Exclusão, Inativação ou Ativação.
- **Usuário** — filtra por quem fez a ação, ou Todos os usuários.
- **Buscar** — campo de texto livre que procura em usuário, tela, tabela, ação e código do registro. A busca só é aplicada ao clicar em "Pesquisar" ou apertar Enter — não filtra a cada letra digitada.
- **Botão "Pesquisar"** — aplica o texto digitado no campo Buscar.
- **Botão "Limpar"** — remove todos os filtros (tela, ação, usuário, busca), inclusive o que ainda não tinha sido pesquisado.

#### Botão "Imprimir"

Gera impressão/PDF da lista filtrada.

#### Tabela de registros

Colunas: Data, Usuário (ou "-" se a ação foi automática do sistema), Tela, Ação (com selo colorido: verde para cadastro/ativação, azul para edição, vermelho para exclusão, cinza para inativação) e Registro (o tipo de cadastro alterado — Produto, Fornecedor, Entrada de NF etc.).

- **Clicar numa linha** — abre uma janela com o detalhe do registro: tela, ação, quem fez, quando, e uma tabela mostrando campo a campo o que mudou, com o valor antigo riscado ao lado do novo. Em edição, aparecem só os campos que realmente mudaram de valor.

Aviso: a senha do usuário nunca aparece no log de auditoria, mesmo quando é alterada.

**Acesso restrito a "admin".**

---

# Parte 3 — Perguntas frequentes e avisos gerais

**Qual a diferença entre "cancelar" e "excluir"?**
Cancelar mantém o registro no histórico (pedido, cliente, compra etc.), só muda o status dele — é a opção recomendada sempre que já existe algum vínculo (venda, pagamento, nota fiscal). Excluir apaga o registro por completo e só é permitido quando não há nada vinculado a ele (por exemplo, um cliente sem nenhum pedido, ou uma compra ainda pendente). Por isso, em várias telas, a exclusão só fica disponível quando não existe histórico — caso contrário, a única opção é inativar ou cancelar.

**Por que alguns status só mudam sozinhos, mesmo eu sendo admin?**
O status "Pago" de um pedido, por exemplo, nunca é definido manualmente por ninguém no painel — ele só é atualizado automaticamente quando o Mercado Pago confirma o pagamento. Isso existe para evitar erro humano (marcar como pago um pedido que na verdade não foi pago) e fraude. O mesmo vale para o status da assinatura do Clube, que também é controlado pelo Mercado Pago.

**O estoque que aparece no Bling é confiável?**
**Não.** O catálogo de produtos da loja não é sincronizado com o Bling em nenhum sentido — nem o cadastro, nem o estoque. Na hora de emitir a nota fiscal, os dados do produto são apenas informados naquele momento, sem exigir que o produto já exista cadastrado no Bling. Por isso, o número de estoque mostrado dentro do Bling **fica desatualizado e não deve ser usado para decidir nada**. A única fonte de verdade sobre estoque é o nosso próprio painel administrativo (telas de Produtos e Estoque).

**Qual a diferença entre "admin" e "operador"?**
- **admin**: acesso irrestrito a todas as telas do painel.
- **operador**: acesso ao uso do dia a dia (vendas, pedidos, orçamentos, clientes, produtos, marketing), mas **sem acesso** às áreas mais sensíveis: Financeiro, Reajuste de Preços, Clube (gestão), Cotação, Pedido de Compra, Entrada de NF, Fornecedores, Relatório de Lucro/DRE, Auditoria, Usuários e Configurações da Loja. Essas opções sequer aparecem no menu para quem é operador.

**Uma compra recebida (Entrada de NF) pode ser corrigida depois?**
Não. Depois que uma entrada de nota fiscal é marcada como recebida, ela não pode mais ser editada, porque nesse momento o estoque e o custo médio dos produtos já foram atualizados a partir dela. Caso haja erro, é preciso lançar um ajuste separado, não editar a entrada original.
