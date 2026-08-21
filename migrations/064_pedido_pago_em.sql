-- ============================================================
-- DATA DO PAGAMENTO DO PEDIDO — COISAS BRASILEIRAS
--
-- O fluxo de caixa precisa saber QUANDO o dinheiro entrou, e ate agora o
-- pedido so guardava criado_em. Pra venda balcao da na mesma (paga na hora),
-- mas no site o cliente pode fechar hoje e pagar o boleto tres dias depois -
-- e o caixa daquele dia ficava errado nos dois dias.
--
-- Backfill com criado_em nos pedidos ja pagos: e a melhor aproximacao que
-- existe pro historico, e deixar NULL faria essas vendas sumirem do caixa.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS pago_em TIMESTAMP;

UPDATE TAB_PEDIDO SET pago_em = criado_em WHERE status = 'pago' AND pago_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_pedido_pago_em ON TAB_PEDIDO (pago_em);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('064')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
