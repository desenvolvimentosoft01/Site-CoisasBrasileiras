-- ============================================================
-- VINCULO COMPRA <-> NOTA DE ENTRADA DO BLING — COISAS BRASILEIRAS
-- Permite o painel "Notas do Bling" (Compras) saber quais notas de entrada
-- ja foram lancadas no nosso sistema (viraram uma TAB_COMPRA) e quais ainda
-- estao pendentes - cruzamento local, nao mexe em nada do lado do Bling.
-- ============================================================

ALTER TABLE TAB_COMPRA ADD COLUMN IF NOT EXISTS bling_nota_id TEXT UNIQUE;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('025')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
