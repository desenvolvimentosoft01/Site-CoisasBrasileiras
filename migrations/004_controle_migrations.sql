-- ============================================================
-- CONTROLE DE MIGRATIONS APLICADAS
-- Rode manualmente, como as demais migrations.
-- ============================================================

-- As migrations deste projeto são aplicadas manualmente, uma a uma, e não
-- existe histórico automático de "o que já rodou aqui". Esta tabela resolve
-- isso: toda migration a partir de agora termina com um INSERT se
-- auto-registrando. Descobrir o que falta rodar vira só "quais números
-- existem em migrations/ que não aparecem aqui" — ver consultar_migrations_aplicadas.sql.

CREATE TABLE IF NOT EXISTS _migracoes_aplicadas (
  versao       TEXT PRIMARY KEY,
  aplicada_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===== BACKFILL — registra as migrations que já existiam antes desta tabela =====
-- Idempotente: se já existir o registro, o ON CONFLICT ignora.

INSERT INTO _migracoes_aplicadas (versao)
SELECT '000' WHERE to_regclass('public.tab_produto') IS NOT NULL
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao)
SELECT '001' WHERE EXISTS (
  SELECT 1 FROM TAB_USUARIO_ADMIN WHERE email = 'admin@coisasbrasileiras.com'
)
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao)
SELECT '002' WHERE to_regclass('public.tab_banner') IS NOT NULL
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao)
SELECT '003' WHERE EXISTS (
  SELECT 1 FROM TAB_CONFIGURACAO WHERE chave = 'cor_primaria'
)
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('004')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
