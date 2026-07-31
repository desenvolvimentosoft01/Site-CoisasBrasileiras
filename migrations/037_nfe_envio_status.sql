-- ============================================================
-- STATUS DE ENVIO DA NF-E — COISAS BRASILEIRAS
-- Ja existia rastreio de "emitida" (bling_nota_id). Adiciona rastreio de
-- envio por e-mail (automatico, gravado so quando o envio realmente da
-- certo) e por WhatsApp (marcacao manual do admin - o sistema nao tem como
-- confirmar entrega de verdade sem integrar com WhatsApp Business API).
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_nota_email_enviada_em TIMESTAMP;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS nota_fiscal_whatsapp_enviada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('037')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
