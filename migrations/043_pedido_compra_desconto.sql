-- ============================================================
-- DESCONTO NO PEDIDO DE COMPRA
-- Quando um Pedido de Compra e gerado a partir de uma Cotacao aceita (ver
-- migrations/042_cotacao.sql), o desconto que o fornecedor deu na cotacao
-- precisa aparecer aqui tambem - valor_total ja sai com o desconto
-- descontado, esse campo e so pra manter o registro de quanto foi.
-- ============================================================

ALTER TABLE TAB_PEDIDO_COMPRA
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) NOT NULL DEFAULT 0;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('043')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
