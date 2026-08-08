-- ============================================================
-- MARCA EM FEEDBACK E ORCAMENTO — completa a separacao iniciada em 046.
-- Depoimentos e orcamentos nao tinham coluna marca; feedbacks aparecem na
-- home publica sem filtro (vazamento entre os dois sites) e orcamentos
-- ficavam sem atribuicao de marca no admin, diferente de TAB_PEDIDO.
-- ============================================================

ALTER TABLE TAB_FEEDBACK ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_FEEDBACK DROP CONSTRAINT IF EXISTS tab_feedback_marca_check;
ALTER TABLE TAB_FEEDBACK ADD CONSTRAINT tab_feedback_marca_check
  CHECK (marca IN ('colorido', 'branco'));

ALTER TABLE TAB_ORCAMENTO ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_ORCAMENTO DROP CONSTRAINT IF EXISTS tab_orcamento_marca_check;
ALTER TABLE TAB_ORCAMENTO ADD CONSTRAINT tab_orcamento_marca_check
  CHECK (marca IN ('colorido', 'branco'));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('047')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
