-- ============================================================
-- CANAL DE VENDA — COISAS BRASILEIRAS
-- Mesmo padrao do in-mente-gestao: coluna simples com CHECK, sem tabela
-- de cadastro separada (canais fixos, nao configuraveis pelo admin).
-- Complementa TAB_PEDIDO.origem (site/balcao, macro) com um detalhe mais
-- fino de onde a venda de fato aconteceu.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS canal TEXT;

ALTER TABLE TAB_PEDIDO DROP CONSTRAINT IF EXISTS tab_pedido_canal_check;
ALTER TABLE TAB_PEDIDO ADD CONSTRAINT tab_pedido_canal_check
  CHECK (canal IS NULL OR canal IN ('site', 'whatsapp', 'instagram', 'balcao'));

-- Backfill: pedidos existentes ganham um canal coerente com a origem que ja tinham.
UPDATE TAB_PEDIDO SET canal = 'site' WHERE origem = 'site' AND canal IS NULL;
UPDATE TAB_PEDIDO SET canal = 'balcao' WHERE origem = 'balcao' AND canal IS NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('018')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
