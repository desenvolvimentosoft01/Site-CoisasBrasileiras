# Descrição do app no Bling — texto pronto para publicar

Texto para o cadastro do aplicativo em developer.bling.com.br. É lido pelo
lojista **e** por quem analisa o app no Bling, então cada afirmação aqui
precisa corresponder ao que o código realmente faz — descrição que promete
mais do que o app entrega gera questionamento na análise e expectativa errada
no cliente.

Os escopos solicitados e os endpoints usados estão em `bling-configuracao-app.md`.
**Ao mudar a integração, revisar este texto junto.**

---

## Resumo

Integração da loja virtual Coisas Brasileiras — e-commerce de porcelanas
decorativas, presentes, artigos religiosos e perfumaria — com o Bling, para
centralizar a emissão fiscal e a consolidação de vendas de todos os canais.

## O que o aplicativo faz

**Notas fiscais (leitura e escrita)**

- Emite a NF-e do pedido a partir do painel da loja: o operador confere o
  pedido e aciona a emissão, e o aplicativo cria a nota no Bling e envia à
  Sefaz. A emissão é sempre uma ação deliberada do operador — nunca
  automática — para que pedido cancelado, endereço incorreto ou produto em
  falta não gerem nota que precise ser cancelada depois.
- Acompanha a situação da nota (autorizada, rejeitada, denegada, aguardando
  protocolo) dentro do painel da loja, sem precisar abrir o Bling para
  descobrir por que uma nota travou.
- Cancela a NF-e com justificativa, a partir do mesmo pedido.
- Disponibiliza o DANFE ao cliente final: o link gerado pelo Bling aparece na
  área do cliente no site e é enviado junto do e-mail de confirmação.
- Lê as notas de entrada (de fornecedor) já registradas no Bling e cruza com
  os lançamentos internos de compra, avisando por e-mail quais ainda não
  foram lançadas. Somente leitura: o aplicativo não cria nem altera notas de
  entrada no Bling.

**Pedidos de venda (leitura)**

- Importa uma vez por dia os pedidos de Mercado Livre e Shopee que chegaram
  ao Bling, consolidando as vendas de marketplace com as do site num único
  painel de pedidos e num único faturamento.

## O que o aplicativo não faz

Declarado para deixar claro o alcance da integração:

- Não sincroniza catálogo de produtos nem estoque. Os itens da nota são
  enviados na própria requisição de emissão; o produto não precisa existir
  cadastrado no Bling.
- Não grava nada em contatos, financeiro ou compras do Bling.
- Não calcula tributos. CFOP e tributação (ICMS, PIS, COFINS) ficam
  integralmente a cargo do Bling, conforme o regime tributário e a natureza
  de operação configurados na conta do lojista.

## Requisitos na conta do Bling

- NF-e habilitada, com certificado digital válido configurado.
- Natureza de operação padrão definida para venda.
- Conexão autorizada pelo próprio lojista, via OAuth, no painel da loja
  (Configurações > Integrações > Bling).

## Suporte

Dúvidas ou problemas com a integração: <PREENCHER: e-mail de suporte>.
Atendimento em dias úteis.
