-- ============================================================
-- TROCA DE SENHA NO PRIMEIRO ACESSO — COISAS BRASILEIRAS
-- Ate aqui a senha de um usuario do painel era definida por quem criou o
-- cadastro (o admin) e ficava assim pra sempre: o proprio usuario nao tinha
-- como trocar, e o admin continuava sabendo a senha de todo mundo. Isso quebra
-- o basico de responsabilidade individual - a auditoria registra "quem fez",
-- mas nao adianta registrar se duas pessoas conhecem a mesma senha.
--
-- Agora a senha definida por outra pessoa nasce PROVISORIA: o dono do cadastro
-- e obrigado a trocar no primeiro acesso, e a partir dai so ele sabe.
--
-- Os usuarios que ja existem NAO sao marcados como provisorios: forcar todo
-- mundo a trocar de senha numa terca-feira, sem aviso, e o tipo de surpresa
-- que faz o cliente achar que o sistema quebrou. Quem quiser trocar, troca
-- pela tela; daqui pra frente todo cadastro novo ja nasce com a regra.
-- ============================================================

ALTER TABLE TAB_USUARIO_ADMIN
  ADD COLUMN IF NOT EXISTS senha_provisoria  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS senha_alterada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('059')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
