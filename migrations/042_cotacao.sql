-- ============================================================
-- COTACAO — COISAS BRASILEIRAS
-- Etapa ANTES do Pedido de Compra (migrations/041_pedido_compra.sql): a loja
-- pede uma cotacao ao fornecedor (so os itens/quantidades desejadas, sem
-- preco), o fornecedor responde por um link publico informando quanto
-- consegue entregar de cada item e por qual preco, e so entao o admin aceita
-- a cotacao - o que gera um Pedido de Compra automaticamente com os valores
-- que o fornecedor informou. Mesmo espirito do link publico de orcamento
-- (migrations/039_orcamento_aprovacao_publica.sql), com os papeis invertidos:
-- aqui quem "aprova" preenchendo valores e o fornecedor, nao o cliente.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS cotacao_numero_seq;

CREATE TABLE IF NOT EXISTS TAB_COTACAO (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero            INTEGER NOT NULL DEFAULT nextval('cotacao_numero_seq'),
  fornecedor_id     UUID NOT NULL REFERENCES TAB_FORNECEDOR(id),
  status            TEXT NOT NULL DEFAULT 'aberto'
                      CHECK (status IN ('aberto', 'enviado', 'respondida', 'aceita', 'recusada', 'cancelada')),
  observacao        TEXT,
  -- Preenchido pelo fornecedor junto com os precos, no link publico -
  -- desconto total sobre a soma dos itens cotados (ex: fechou o pedido
  -- inteiro e deu uma condicao especial).
  desconto          NUMERIC(10,2) NOT NULL DEFAULT 0,
  token_resposta    UUID NOT NULL DEFAULT gen_random_uuid(),
  enviado_email_em  TIMESTAMP,
  respondido_em     TIMESTAMP,
  -- Preenchido so quando a cotacao vira pedido de compra de verdade.
  pedido_compra_id  UUID REFERENCES TAB_PEDIDO_COMPRA(id) ON DELETE SET NULL,
  criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cotacao_token_resposta ON TAB_COTACAO (token_resposta);
CREATE INDEX IF NOT EXISTS idx_cotacao_fornecedor ON TAB_COTACAO (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_cotacao_status ON TAB_COTACAO (status);

CREATE TABLE IF NOT EXISTS TAB_COTACAO_ITEM (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id              UUID NOT NULL REFERENCES TAB_COTACAO(id) ON DELETE CASCADE,
  -- Opcional (igual TAB_ORCAMENTO_ITEM/TAB_PEDIDO_COMPRA_ITEM).
  produto_id              UUID REFERENCES TAB_PRODUTO(id) ON DELETE SET NULL,
  descricao               TEXT NOT NULL,
  quantidade_solicitada   NUMERIC(10,2) NOT NULL,
  -- Preenchidos so quando o fornecedor responde - nulo enquanto aberto/enviado.
  quantidade_cotada       NUMERIC(10,2),
  valor_unitario_cotado   NUMERIC(10,2)
);

CREATE INDEX IF NOT EXISTS idx_cotacao_item_cotacao ON TAB_COTACAO_ITEM (cotacao_id);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('042')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
