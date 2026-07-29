-- ============================================================
-- ULTIMO ERRO DO BLING — COISAS BRASILEIRAS
-- Guarda a mensagem do ultimo erro de emissao/cancelamento de NF-e (ex:
-- certificado digital nao configurado), pra aparecer num painel de
-- "pendencias fiscais" em Configuracoes > Bling - sem o contador precisar
-- entrar no site do Bling so pra descobrir que algo falhou.
-- ============================================================

ALTER TABLE TAB_INTEGRACAO_BLING ADD COLUMN IF NOT EXISTS ultimo_erro TEXT;
ALTER TABLE TAB_INTEGRACAO_BLING ADD COLUMN IF NOT EXISTS ultimo_erro_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('031')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
