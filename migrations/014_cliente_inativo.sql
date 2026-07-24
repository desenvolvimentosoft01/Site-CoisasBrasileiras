-- ============================================================
-- CLIENTE ATIVO/INATIVO — COISAS BRASILEIRAS
-- Inativar um cliente nunca apaga o cadastro nem o historico de pedidos - so
-- impede login/checkout no site (cliente inativo nao consegue mais comprar
-- online) e marca visualmente no admin. Mesmo padrao ja usado em produtos.
-- ============================================================

ALTER TABLE TAB_CLIENTE ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('014')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
