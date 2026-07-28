-- ============================================================
-- SEGREDOS DE INTEGRACAO CONFIGURAVEIS PELO ADMIN — COISAS BRASILEIRAS
-- Frenet, Mercado Pago e Email (Gmail) deixam de depender so de variavel de
-- ambiente - o admin pode configurar/trocar direto pelo sistema, sem precisar
-- de acesso ao painel de hospedagem. Tabela ISOLADA da TAB_CONFIGURACAO de
-- proposito (mesmo motivo do TAB_INTEGRACAO_BLING): o endpoint que devolve
-- as configuracoes gerais nao pode vazar segredo nenhum.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_INTEGRACAO_SEGREDO (
  chave          TEXT PRIMARY KEY,
  valor          TEXT,
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('030')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
