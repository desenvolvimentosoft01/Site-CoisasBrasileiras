-- ============================================================
-- CAMPOS FALTANTES: VENCIMENTO DA COMPRA E IE DO FORNECEDOR
-- Achados numa revisao pedida pelo usuario: a conta a pagar gerada ao
-- receber uma compra usava a DATA DA COMPRA como vencimento (sem prazo de
-- pagamento real) - agora tem um campo proprio. Fornecedor tambem nao tinha
-- Inscricao Estadual, comum em cadastro B2B.
-- ============================================================

ALTER TABLE TAB_COMPRA ADD COLUMN IF NOT EXISTS data_vencimento DATE;
ALTER TABLE TAB_FORNECEDOR ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('029')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
