-- ============================================================
-- APROVACAO PUBLICA DE ORCAMENTO POR LINK (WHATSAPP/E-MAIL)
-- Evolui o orcamento (v1 era so aprovacao manual pelo admin, ver
-- migrations/013_orcamentos.sql) pra ter um link publico que o cliente
-- recebe por WhatsApp (link wa.me manual, sem API paga) ou e-mail e usa
-- pra aprovar/recusar sozinho - a decisao atualiza o status na hora, sem
-- o admin precisar fazer nada.
-- ============================================================

ALTER TABLE TAB_ORCAMENTO
  ADD COLUMN IF NOT EXISTS token_aprovacao UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS cliente_email TEXT,
  ADD COLUMN IF NOT EXISTS canal_resposta TEXT CHECK (canal_resposta IN ('email', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS observacao_cliente TEXT,
  ADD COLUMN IF NOT EXISTS enviado_email_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS respondido_em TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orcamento_token_aprovacao ON TAB_ORCAMENTO (token_aprovacao);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('039')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
