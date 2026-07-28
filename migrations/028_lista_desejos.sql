-- ============================================================
-- LISTA DE DESEJOS — COISAS BRASILEIRAS
-- Cliente favorita um produto sem comprar ainda, pra ver depois em Minha Conta.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_LISTA_DESEJOS (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES TAB_CLIENTE(id) ON DELETE CASCADE,
  produto_id  UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (cliente_id, produto_id)
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('028')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
