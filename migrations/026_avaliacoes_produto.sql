-- ============================================================
-- AVALIACOES DE PRODUTO — COISAS BRASILEIRAS
-- Diferente de TAB_FEEDBACK (depoimentos curados pelo admin pra home) - aqui
-- e o cliente que avalia um produto especifico que comprou (compra
-- verificada), passa por aprovacao do admin antes de aparecer no site.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_AVALIACAO_PRODUTO (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  cliente_id  UUID NOT NULL REFERENCES TAB_CLIENTE(id),
  nota        SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario  TEXT,
  aprovado    BOOLEAN NOT NULL DEFAULT false,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (produto_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_produto ON TAB_AVALIACAO_PRODUTO (produto_id, aprovado);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('026')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
