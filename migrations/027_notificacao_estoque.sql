-- ============================================================
-- NOTIFICACAO "VOLTOU AO ESTOQUE" — COISAS BRASILEIRAS
-- Visitante deixa o e-mail num produto esgotado; quando o estoque volta a
-- ficar positivo (compra recebida, ajuste manual etc.), avisa automaticamente.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_NOTIFICACAO_ESTOQUE (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id     UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  notificado_em  TIMESTAMP,
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (produto_id, email)
);

CREATE INDEX IF NOT EXISTS idx_notificacao_estoque_pendente
  ON TAB_NOTIFICACAO_ESTOQUE (produto_id) WHERE notificado_em IS NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('027')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
