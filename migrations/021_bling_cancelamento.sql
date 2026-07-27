-- ============================================================
-- CANCELAMENTO DE NF-E (BLING) — COISAS BRASILEIRAS
-- Fecha a lacuna do fluxo Bling: hoje so tinha emissao, sem jeito de cancelar
-- uma nota emitida por engano nem de emitir uma nova depois do cancelamento.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_nota_cancelada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('021')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
