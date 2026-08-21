-- ============================================================
-- MOVIMENTACAO DE ESTOQUE (KARDEX) — COISAS BRASILEIRAS
-- Ate aqui o estoque era um numero em TAB_PRODUTO.estoque que subia e descia,
-- sem historico nenhum. Quando o cliente perguntava "por que esse produto
-- saiu de 40 para 12?", nao havia como responder: o sistema sabia o saldo,
-- mas nao sabia como chegou nele.
--
-- Sem isso, divergencia de inventario nao tem como ser investigada - e
-- inventario diverge sempre, por quebra, perda, erro de contagem ou venda
-- lancada errado.
--
-- Decisao de desenho (combinada com o cliente): o SALDO continua em
-- TAB_PRODUTO.estoque e esta tabela e o historico ao lado, e nao a fonte do
-- saldo. Motivo: todas as telas ja leem o saldo de la, e recalcular por soma
-- de movimento a cada leitura mudaria o sistema inteiro de uma vez. Se um dia
-- houver duvida, da pra conferir saldo x soma dos movimentos e achar o furo.
--
-- Guardamos "saldo_apos" em cada linha justamente pra essa conferencia: com
-- ele, achar onde a conta quebrou e ler uma coluna, e nao refazer a soma
-- desde o inicio.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_ESTOQUE_MOVIMENTO (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id    UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,

  -- Sempre positiva: quem diz a direcao e o tipo. Guardar quantidade negativa
  -- daria dois jeitos de representar a mesma saida, e relatorio com sinal
  -- trocado e erro que ninguem percebe.
  quantidade    INTEGER NOT NULL CHECK (quantidade > 0),
  tipo          TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),

  -- Por que o estoque mudou. Fixo (nao ha cadastro de motivos) pra que
  -- relatorio consiga agrupar - motivo digitado livremente vira "quebra",
  -- "Quebra", "quebrado" e nao soma em lugar nenhum.
  motivo        TEXT NOT NULL CHECK (motivo IN (
    'compra',              -- entrada de NF recebida
    'venda',               -- pedido pago / venda balcao
    'cancelamento_venda',  -- estorno por cancelamento de NF-e ou pedido
    'ajuste',              -- correcao manual sem motivo especifico
    'inventario',          -- contagem fisica
    'quebra',              -- produto quebrado
    'perda',               -- extravio, furto, vencimento
    'devolucao'            -- cliente devolveu
  )),

  -- Saldo do produto DEPOIS deste movimento (ver comentario do cabecalho).
  saldo_apos    INTEGER NOT NULL,

  -- De onde veio o movimento, quando veio de um documento. Nao e chave
  -- estrangeira de proposito: aponta pra tabelas diferentes (pedido, compra)
  -- e um documento excluido nao pode apagar o historico de estoque.
  origem_tipo   TEXT,
  origem_id     UUID,

  -- Quem fez. Nulo quando o movimento foi automatico (webhook de pagamento,
  -- importacao de marketplace) - e a diferenca entre "o sistema baixou" e
  -- "alguem baixou".
  usuario_id    UUID REFERENCES TAB_USUARIO_ADMIN(id) ON DELETE SET NULL,

  observacao    TEXT,
  criado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- A consulta natural e "o historico deste produto, do mais recente pro mais
-- antigo" - e o que a tela de movimentacao abre.
CREATE INDEX IF NOT EXISTS idx_estoque_movimento_produto
  ON TAB_ESTOQUE_MOVIMENTO (produto_id, criado_em DESC);

-- Relatorio por periodo/motivo ("quanto se perdeu por quebra em agosto").
CREATE INDEX IF NOT EXISTS idx_estoque_movimento_criado_em
  ON TAB_ESTOQUE_MOVIMENTO (criado_em);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('062')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
