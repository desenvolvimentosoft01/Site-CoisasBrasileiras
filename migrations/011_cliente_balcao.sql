-- ============================================================
-- CLIENTE DE BALCAO — COISAS BRASILEIRAS
-- Permite cadastrar clientes direto pelo admin (contatos de balcao) sem
-- exigir e-mail e senha - esses so eram obrigatorios porque a tabela foi
-- criada pensando no cliente que se cadastra e faz login no site.
--
-- Clientes cadastrados pelo admin ficam sem e-mail/senha e simplesmente nao
-- conseguem logar no site (o que e o correto - sao so contatos de balcao).
-- Clientes que se cadastram no site continuam preenchendo e-mail e senha
-- normalmente. O indice UNIQUE de e-mail continua valendo (no Postgres,
-- multiplos NULL sao permitidos num indice UNIQUE).
-- ============================================================

ALTER TABLE TAB_CLIENTE ALTER COLUMN email DROP NOT NULL;
ALTER TABLE TAB_CLIENTE ALTER COLUMN senha_hash DROP NOT NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('011')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
