-- ============================================================
-- USUARIO ADMIN PADRAO — COISAS BRASILEIRAS
-- Login: admin@coisasbrasileiras.com  Senha: [SENHA-REMOVIDA]
-- IMPORTANTE: trocar a senha apos o primeiro acesso
-- ============================================================

INSERT INTO TAB_USUARIO_ADMIN (nome, email, senha_hash, papel)
VALUES (
  'Administrador',
  'admin@coisasbrasileiras.com',
  '[HASH-REMOVIDO]',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
