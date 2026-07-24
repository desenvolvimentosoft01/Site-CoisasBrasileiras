-- ============================================================
-- CARDS DE FEEDBACK/DEPOIMENTO — COISAS BRASILEIRAS
-- Depoimentos de clientes exibidos na home, geridos pelo admin
-- (imagem, nome, texto, nota de 1 a 5 estrelas).
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_FEEDBACK (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  texto       TEXT NOT NULL,
  imagem_url  TEXT,
  nota        SMALLINT NOT NULL DEFAULT 5 CHECK (nota BETWEEN 1 AND 5),
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_ativo_ordem ON TAB_FEEDBACK (ativo, ordem);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('017')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
