-- ============================================================
-- CONTADOR DE NOTAS PENDENTES DO BLING — COISAS BRASILEIRAS
-- Atualizado pelo cron (app/api/cron/notas-bling-pendentes), lido pelo
-- badge no menu do admin - evita bater na API do Bling toda vez que alguem
-- abre o painel, so uma leitura de banco.
-- ============================================================

ALTER TABLE TAB_INTEGRACAO_BLING ADD COLUMN IF NOT EXISTS notas_pendentes INTEGER NOT NULL DEFAULT 0;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('033')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
