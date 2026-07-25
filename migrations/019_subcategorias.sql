-- ============================================================
-- SUBCATEGORIAS — COISAS BRASILEIRAS
-- Subcategoria = uma categoria comum com uma categoria pai (auto-relacionamento
-- em TAB_CATEGORIA), sem criar tabela nova. Categoria sem pai = categoria
-- principal, aparece no menu do site; com pai = subcategoria.
-- ============================================================

ALTER TABLE TAB_CATEGORIA ADD COLUMN IF NOT EXISTS categoria_pai_id UUID REFERENCES TAB_CATEGORIA(id) ON DELETE SET NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('019')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
