-- ============================================================
-- CONTROLE DE NOTIFICACAO DE NOTAS PENDENTES DO BLING — COISAS BRASILEIRAS
-- Marca quais notas de entrada (fornecedor) ja geraram um e-mail de aviso
-- pro admin, pra nao notificar a mesma nota pendente todo dia - o job
-- verifica periodicamente e so avisa sobre nota nova.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_BLING_NOTA_NOTIFICADA (
  bling_nota_id  TEXT PRIMARY KEY,
  notificado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('032')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
