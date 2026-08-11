-- ============================================================
-- LGPD: CONSENTIMENTO NO CADASTRO — guarda quando o cliente aceitou a
-- Politica de Privacidade/Termos de Uso, servindo de prova do consentimento
-- (art. 8o da LGPD). Clientes cadastrados antes desta migration ficam com
-- o campo nulo (aceite anterior a essa exigencia nao existia no sistema).
-- ============================================================

ALTER TABLE TAB_CLIENTE ADD COLUMN IF NOT EXISTS consentimento_lgpd_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('050')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
