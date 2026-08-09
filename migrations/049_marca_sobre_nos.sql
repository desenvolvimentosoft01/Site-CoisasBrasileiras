-- ============================================================
-- MARCA EM SOBRE NOS MIDIA — completa a separacao iniciada em 046/047.
-- A galeria de fotos/videos da pagina "Sobre nos" nao tinha coluna marca,
-- entao as mesmas midias apareciam nos dois sites ao mesmo tempo
-- (mesmo tipo de vazamento que a migration 047 corrigiu para depoimentos).
-- ============================================================

ALTER TABLE TAB_SOBRE_NOS_MIDIA ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_SOBRE_NOS_MIDIA DROP CONSTRAINT IF EXISTS tab_sobre_nos_midia_marca_check;
ALTER TABLE TAB_SOBRE_NOS_MIDIA ADD CONSTRAINT tab_sobre_nos_midia_marca_check
  CHECK (marca IN ('colorido', 'branco'));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('049')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
