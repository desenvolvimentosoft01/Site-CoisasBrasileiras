-- ============================================================
-- USUARIO ADMIN INICIAL — COISAS BRASILEIRAS
--
-- Este arquivo NAO cria mais um usuario com senha fixa (versao antiga tinha
-- uma senha padrao documentada aqui e commitada no Git - senha exposta em
-- codigo publico/revendido e sempre um risco, entao removida).
--
-- Pra criar o primeiro administrador, rode (depois de configurar
-- DATABASE_URL no .env.local):
--
--   node scripts/criar-admin.js "Nome do Admin" email@dominio.com
--
-- O script pede a senha no terminal (nao fica salva em nenhum arquivo nem
-- historico de comando) e grava so o hash bcrypt no banco.
-- ============================================================

-- Sem DDL nenhum: o registro existe so pra migration nao ser reexecutada a
-- cada rodada do scripts/rodar-todas-migrations.js.
--
-- Dentro de um DO/EXECUTE de proposito: _migracoes_aplicadas so nasce na 004,
-- e num banco novo esta migration roda antes disso. Um INSERT solto falharia
-- no parse ("relacao nao existe") mesmo com WHERE - o planejador resolve a
-- tabela antes de avaliar a condicao. Em banco novo o registro fica por conta
-- do backfill da 066.
DO $$
BEGIN
  IF to_regclass('public._migracoes_aplicadas') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _migracoes_aplicadas (versao) VALUES ('001')
      ON CONFLICT (versao) DO NOTHING
    $sql$;
  END IF;
END $$;
