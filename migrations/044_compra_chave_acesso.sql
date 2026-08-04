-- ============================================================
-- CHAVE DE ACESSO NA ENTRADA DE NF — COISAS BRASILEIRAS
-- O XML importado (lib/nfe-xml.ts) ja extrai e valida a chave de acesso da
-- NF-e, mas ela nunca era gravada - ficava so na validacao da hora do
-- upload. Guarda pra ficar visivel na listagem/detalhe da compra depois.
-- Nota manual (sem XML) nao tem chave obrigatoria, por isso fica nullable.
-- ============================================================

ALTER TABLE TAB_COMPRA ADD COLUMN IF NOT EXISTS chave_acesso TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('044')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
