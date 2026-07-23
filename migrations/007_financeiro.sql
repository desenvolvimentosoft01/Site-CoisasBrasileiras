-- ============================================================
-- FINANCEIRO — COISAS BRASILEIRAS
-- Contas a pagar/receber do dono da loja (fornecedores, boletos, despesas
-- fixas etc.) - nao confundir com TAB_PEDIDO, que ja e o financeiro de venda.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_CONTA (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         TEXT NOT NULL CHECK (tipo IN ('pagar','receber')),
  descricao    TEXT NOT NULL,
  valor        NUMERIC(10,2) NOT NULL,
  vencimento   DATE NOT NULL,
  pago         BOOLEAN NOT NULL DEFAULT false,
  pago_em      TIMESTAMP,
  categoria    TEXT,
  observacao   TEXT,
  criado_em    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conta_vencimento ON TAB_CONTA (vencimento);
CREATE INDEX IF NOT EXISTS idx_conta_pago ON TAB_CONTA (pago);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('007')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
