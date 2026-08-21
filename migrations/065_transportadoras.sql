-- ============================================================
-- TRANSPORTADORAS COMO CADASTRO — COISAS BRASILEIRAS
--
-- Ate agora "transportadora" era texto livre digitado em cada pedido. Isso
-- significa "Correios", "correios", "CORREIOS " e "Correio" convivendo no
-- mesmo banco: nao da pra filtrar por transportadora, nao da pra saber quanto
-- se despachou por cada uma, e o codigo de servico da Frenet (necessario pra
-- validar rastreio de verdade) nao tinha onde morar.
--
-- A coluna de texto CONTINUA existindo e nao e apagada: ela guarda o que foi
-- digitado nos pedidos antigos, e jogar isso fora reescreveria o historico de
-- entrega de pedidos ja despachados. Pedido novo usa transportadora_id; a
-- leitura cai no texto quando o id e nulo.
--
-- Codigo sequencial pelo mesmo mecanismo da migration 058 (sequence + DEFAULT),
-- pra que o cadastro se comporte como os outros: "me ve a transportadora 3".
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_TRANSPORTADORA (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social   TEXT NOT NULL,
  nome_fantasia  TEXT,
  cnpj_cpf       TEXT,
  inscricao_estadual TEXT,
  telefone       TEXT,
  email          TEXT,
  site_rastreio  TEXT,
  -- Codigo do servico na conta Frenet (ex: "04014"). E ele que falta pra
  -- validacao automatica de rastreio funcionar - a Frenet exige o codigo do
  -- servico, que e especifico de cada conta e nao da pra chutar.
  codigo_servico_frenet TEXT,
  cep            TEXT,
  logradouro     TEXT,
  numero         TEXT,
  complemento    TEXT,
  bairro         TEXT,
  cidade         TEXT,
  estado         TEXT,
  observacao     TEXT,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Codigo sequencial (mesmo padrao da 058).
ALTER TABLE TAB_TRANSPORTADORA ADD COLUMN IF NOT EXISTS codigo INTEGER;

DO $$
DECLARE ultimo INTEGER;
BEGIN
  UPDATE TAB_TRANSPORTADORA alvo SET codigo = numerado.novo_codigo
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY criado_em, id) AS novo_codigo
            FROM TAB_TRANSPORTADORA) numerado
   WHERE alvo.id = numerado.id AND alvo.codigo IS NULL;

  CREATE SEQUENCE IF NOT EXISTS tab_transportadora_codigo_seq;

  SELECT COALESCE(MAX(codigo), 0) FROM TAB_TRANSPORTADORA INTO ultimo;
  PERFORM setval('tab_transportadora_codigo_seq', GREATEST(ultimo, 1));
  IF ultimo = 0 THEN
    PERFORM setval('tab_transportadora_codigo_seq', 1, false);
  END IF;
END $$;

ALTER TABLE TAB_TRANSPORTADORA
  ALTER COLUMN codigo SET DEFAULT nextval('tab_transportadora_codigo_seq');

CREATE UNIQUE INDEX IF NOT EXISTS idx_tab_transportadora_codigo
  ON TAB_TRANSPORTADORA (codigo);

-- Vinculo no pedido. Sem ON DELETE CASCADE de proposito: apagar uma
-- transportadora nunca pode levar pedido junto.
ALTER TABLE TAB_PEDIDO
  ADD COLUMN IF NOT EXISTS transportadora_id UUID REFERENCES TAB_TRANSPORTADORA(id);

CREATE INDEX IF NOT EXISTS idx_pedido_transportadora ON TAB_PEDIDO (transportadora_id);

-- Aproveita o que ja foi digitado: cada nome distinto de pedido despachado
-- vira um cadastro, e os pedidos correspondentes passam a apontar pra ele.
-- Sem isso o cliente abriria a tela nova vazia e teria que redigitar tudo.
INSERT INTO TAB_TRANSPORTADORA (razao_social)
SELECT DISTINCT TRIM(transportadora)
  FROM TAB_PEDIDO
 WHERE transportadora IS NOT NULL AND TRIM(transportadora) <> ''
   AND NOT EXISTS (
     SELECT 1 FROM TAB_TRANSPORTADORA t
      WHERE LOWER(t.razao_social) = LOWER(TRIM(TAB_PEDIDO.transportadora))
   );

UPDATE TAB_PEDIDO p
   SET transportadora_id = t.id
  FROM TAB_TRANSPORTADORA t
 WHERE p.transportadora_id IS NULL
   AND p.transportadora IS NOT NULL
   AND LOWER(TRIM(p.transportadora)) = LOWER(t.razao_social);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('065')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
