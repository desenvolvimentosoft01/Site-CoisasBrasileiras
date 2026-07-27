-- ============================================================
-- CODIGO DE BARRAS (GTIN/EAN) DO PRODUTO — COISAS BRASILEIRAS
-- Usado em tres lugares: leitor no PDV da Venda Balcao, campo "gtin" na
-- emissao de NF-e (Bling), e match de item na importacao de XML de compra.
-- ============================================================

ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS codigo_barras TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('024')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
