-- ============================================================
-- IMAGEM POR CATEGORIA — COISAS BRASILEIRAS
-- Permite que cada categoria tenha uma foto ilustrativa, exibida na
-- grade de categorias da home (antes era so icone generico).
-- ============================================================

ALTER TABLE TAB_CATEGORIA ADD COLUMN IF NOT EXISTS imagem_url TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('016')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
