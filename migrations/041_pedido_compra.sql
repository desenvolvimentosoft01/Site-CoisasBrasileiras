-- ============================================================
-- PEDIDO DE COMPRA — COISAS BRASILEIRAS
-- Documento que a loja manda pro FORNECEDOR solicitando itens, antes da
-- mercadoria chegar - diferente de TAB_COMPRA (Entrada de NF), que registra
-- a compra DEPOIS que ela chegou (da alta no estoque). Mesmo espirito do
-- orcamento (migrations/013_orcamentos.sql e 039_orcamento_aprovacao_publica.sql),
-- so que aqui quem recebe e decide e o fornecedor, nao o cliente - por isso
-- fica so no envio por e-mail, sem link de aprovacao publica.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS pedido_compra_numero_seq;

CREATE TABLE IF NOT EXISTS TAB_PEDIDO_COMPRA (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero            INTEGER NOT NULL DEFAULT nextval('pedido_compra_numero_seq'),
  fornecedor_id     UUID NOT NULL REFERENCES TAB_FORNECEDOR(id),
  status            TEXT NOT NULL DEFAULT 'aberto'
                      CHECK (status IN ('aberto', 'enviado', 'atendido', 'cancelado')),
  observacao        TEXT,
  valor_total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  enviado_email_em  TIMESTAMP,
  criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PEDIDO_COMPRA_ITEM (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_compra_id  UUID NOT NULL REFERENCES TAB_PEDIDO_COMPRA(id) ON DELETE CASCADE,
  -- Opcional (igual TAB_ORCAMENTO_ITEM): pode pedir algo fora do catalogo.
  produto_id        UUID REFERENCES TAB_PRODUTO(id) ON DELETE SET NULL,
  descricao         TEXT NOT NULL,
  quantidade        NUMERIC(10,2) NOT NULL,
  custo_unitario    NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pedido_compra_item_pedido ON TAB_PEDIDO_COMPRA_ITEM (pedido_compra_id);
CREATE INDEX IF NOT EXISTS idx_pedido_compra_fornecedor ON TAB_PEDIDO_COMPRA (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pedido_compra_status ON TAB_PEDIDO_COMPRA (status);

-- Rastreia de qual pedido de compra uma entrada (TAB_COMPRA) veio, pra dar
-- pra pre-preencher a Entrada de NF com os mesmos itens/fornecedor e marcar
-- o pedido de compra como "atendido" automaticamente.
ALTER TABLE TAB_COMPRA
  ADD COLUMN IF NOT EXISTS pedido_compra_id UUID REFERENCES TAB_PEDIDO_COMPRA(id) ON DELETE SET NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('041')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
