-- ============================================================
-- INTEGRACAO BLING (emissao de NF-e) — COISAS BRASILEIRAS
-- Escopo combinado com o cliente: SO emissao de nota fiscal a partir do
-- pedido, sem sincronizar estoque/financeiro com o Bling (isso continua
-- controlado so por este sistema).
-- ============================================================

-- Tabela isolada pros tokens OAuth do Bling - de proposito FORA de
-- TAB_CONFIGURACAO, porque o GET /api/admin/configuracoes devolve todas as
-- chaves de configuracao de uma vez (usado pela tela de Configuracoes do
-- admin); colocar segredo la correria o risco de vazar o token na resposta
-- daquele endpoint. So uma linha existe nesta tabela (a conexao da loja).
CREATE TABLE IF NOT EXISTS TAB_INTEGRACAO_BLING (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token   TEXT,
  refresh_token  TEXT,
  expira_em      TIMESTAMP,
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Guarda o resultado da emissao no proprio pedido - numero/id da nota no
-- Bling e os links de DANFE/PDF pro admin (e futuramente o cliente) acessar.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_nota_id TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_link_danfe TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_link_pdf TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('010')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
