-- ============================================================
-- PLANO E RECURSOS LIBERADOS — COISAS BRASILEIRAS
-- Este sistema nasceu da base do InMenteGestao e vai voltar pra la quando o
-- modulo de ERP for portado. La ja existe plano (basico/intermediario/
-- avancado) com limites no codigo (lib/planos.ts) e o plano contratado no
-- banco. Falta o outro lado da moeda: dizer QUAIS MODULOS E INTEGRACOES a
-- conta enxerga.
--
-- E o caso concreto do Coisas Brasileiras: ele tem tudo liberado, menos as
-- integracoes de Mercado Livre e Shopee, que ele nao usa - e por isso nao
-- deveria ver campo, filtro nem aba dessas duas.
--
-- Modelo escolhido:
--   - o CATALOGO de recursos (chave, nome, o que libera) fica no CODIGO
--     (lib/recursos.ts), porque e regra de produto e muda junto com a tela
--     que ele libera;
--   - o banco guarda so o que esta LIGADO nesta instalacao, e o plano
--     contratado. Assim uma instalacao nova nasce com o padrao do plano, e
--     qualquer ajuste fino continua possivel sem migration nova.
--
-- Recurso que nao existe na tabela vale como LIGADO: a tabela e uma lista de
-- excecoes, nao uma lista de permissoes. Isso e proposital - um recurso novo
-- entra em producao funcionando pra quem ja usa o sistema, em vez de sumir da
-- tela de todo mundo ate alguem lembrar de liga-lo.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_RECURSO (
  chave          TEXT PRIMARY KEY,
  habilitado     BOOLEAN NOT NULL DEFAULT true,
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Plano contratado, guardado junto das demais configuracoes da loja. Serve
-- pra mostrar ao cliente qual e o dele e pra, no futuro, aplicar de uma vez
-- o conjunto de recursos daquele plano.
INSERT INTO TAB_CONFIGURACAO (chave, valor)
VALUES ('plano', 'avancado')
ON CONFLICT (chave) DO NOTHING;

-- O caso do cliente: tudo liberado, menos os dois marketplaces.
INSERT INTO TAB_RECURSO (chave, habilitado) VALUES
  ('integracao_mercado_livre', false),
  ('integracao_shopee', false),
  -- iFood existe no InMenteGestao e ainda nao foi finalizada; este cliente
  -- tambem nao tem a integracao, entao nasce desligada dos dois lados.
  ('integracao_ifood', false)
ON CONFLICT (chave) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('060')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
