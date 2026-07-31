-- ============================================================
-- PEDIDOS MARKETPLACE (Mercado Livre / Shopee via Bling) — COISAS BRASILEIRAS
-- Extende o canal de venda e adiciona o necessario pra importar pedidos que
-- chegam pelo Bling (conectado a Mercado Livre e Shopee) como TAB_PEDIDO de
-- verdade aqui, com dedup e fila de pendencias pra item sem produto local.
-- ============================================================

ALTER TABLE TAB_PEDIDO DROP CONSTRAINT IF EXISTS tab_pedido_canal_check;
ALTER TABLE TAB_PEDIDO ADD CONSTRAINT tab_pedido_canal_check
  CHECK (canal IS NULL OR canal IN ('site', 'whatsapp', 'instagram', 'balcao', 'mercadolivre', 'shopee'));

-- Id do pedido de venda no Bling - evita importar o mesmo pedido 2 vezes
-- quando o cron/importacao manual roda de novo.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_pedido_id TEXT UNIQUE;

-- Pedido do marketplace cujo item nao bateu com nenhum produto local (SKU ou
-- codigo de barras) fica aqui em vez de ser importado incompleto. Some quando
-- o admin resolve o cadastro e descarta a pendencia manualmente.
CREATE TABLE IF NOT EXISTS TAB_BLING_PEDIDO_PENDENTE (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bling_pedido_id TEXT NOT NULL UNIQUE,
  canal           TEXT NOT NULL,
  motivo          TEXT NOT NULL,
  detectado_em    TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('036')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
