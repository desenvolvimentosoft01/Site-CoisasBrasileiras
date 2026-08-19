-- ============================================================
-- CODIGO DE BARRAS DE USO INTERNO — COISAS BRASILEIRAS
--
-- Ate aqui o codigo de barras (GTIN/EAN) era OBRIGATORIO no cadastro de
-- produto, o que travava produto artesanal e importado sem GTIN do
-- fabricante - boa parte do catalogo da loja. Passa a ser opcional, e quem
-- nao tem pode receber um EAN-13 gerado pelo sistema na faixa de uso interno
-- (prefixo 2, reservada pela GS1 exatamente pra isso) - ver
-- lib/codigo-barras.ts.
--
-- POR QUE UMA COLUNA SO PRA MARCAR ISSO: codigo de uso interno serve pra
-- bipar no balcao, mas NAO e um GTIN de verdade e nao pode ir como GTIN na
-- NF-e - a Sefaz valida e rejeita. Sem essa marcacao, a emissao nao teria
-- como saber se o codigo veio do fabricante ou foi gerado aqui, e mandaria
-- os dois igual. Marcado, a emissao envia "SEM GTIN" pros internos, que e o
-- que o padrao da NF-e manda quando o produto nao tem GTIN.
-- ============================================================

ALTER TABLE TAB_PRODUTO
  ADD COLUMN IF NOT EXISTS codigo_barras_interno BOOLEAN NOT NULL DEFAULT false;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('056')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
