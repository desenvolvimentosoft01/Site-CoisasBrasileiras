-- ============================================================
-- PRECO DO CLUBE POR PERCENTUAL — COISAS BRASILEIRAS
-- Alem de valor fixo em R$, o preco do clube por produto agora pode ser
-- cadastrado como percentual de desconto sobre o preco normal do produto.
-- ============================================================

-- "fixo": preco_clube guarda o preco final em R$ (comportamento atual).
-- "percentual": preco_clube guarda o percentual de desconto (0-100) sobre
-- TAB_PRODUTO.preco - o valor final e calculado na hora de exibir/vender.
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS preco_clube_tipo TEXT NOT NULL DEFAULT 'fixo'
  CHECK (preco_clube_tipo IN ('fixo', 'percentual'));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('038')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
