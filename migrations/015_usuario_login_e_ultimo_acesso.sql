-- ============================================================
-- LOGIN POR USUARIO + ULTIMO ACESSO — COISAS BRASILEIRAS
-- Mesma regra do InMenteGestao: cada usuario do admin pode ter um "usuario"
-- de login curto (opcional - se nao definir, continua entrando com o
-- e-mail completo), e o sistema registra quando foi o ultimo acesso.
-- ============================================================

ALTER TABLE TAB_USUARIO_ADMIN ADD COLUMN IF NOT EXISTS usuario TEXT;
ALTER TABLE TAB_USUARIO_ADMIN ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP;

-- Unico so entre quem tem "usuario" preenchido - varios usuarios podem ficar
-- sem "usuario" definido (entram so pelo e-mail) sem conflitar entre si.
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_admin_usuario
  ON TAB_USUARIO_ADMIN (usuario) WHERE usuario IS NOT NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('015')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
