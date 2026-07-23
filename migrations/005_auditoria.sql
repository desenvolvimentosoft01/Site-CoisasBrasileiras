-- ============================================================
-- AUDITORIA — COISAS BRASILEIRAS
-- Registro de quem alterou o que, quando, nas telas de cadastro do admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_AUDITORIA (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID,
  usuario_nome   TEXT,
  tela           TEXT NOT NULL,
  acao           TEXT NOT NULL CHECK (acao IN ('cadastro','edicao','exclusao','inativacao','ativacao')),
  tabela         TEXT NOT NULL,
  registro_id    TEXT,
  dados_antes    JSONB,
  dados_depois   JSONB,
  ip             TEXT,
  user_agent     TEXT,
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON TAB_AUDITORIA (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON TAB_AUDITORIA (tabela);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('005')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
