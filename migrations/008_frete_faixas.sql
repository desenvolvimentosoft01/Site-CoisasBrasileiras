-- ============================================================
-- FRETE POR FAIXA DE PESO E REGIAO — COISAS BRASILEIRAS
-- Substitui o frete de valor fixo por uma tabela configuravel pelo admin,
-- ate a loja ter contrato com os Correios (cartao de postagem) e o calculo
-- poder ser trocado pela cotacao real da API deles.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_FRETE_FAIXA (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regiao        TEXT NOT NULL CHECK (regiao IN ('norte','nordeste','centro_oeste','sudeste','sul')),
  peso_min_kg   NUMERIC(6,3) NOT NULL,
  peso_max_kg   NUMERIC(6,3) NOT NULL,
  valor         NUMERIC(10,2) NOT NULL,
  prazo_dias    INTEGER NOT NULL DEFAULT 7,
  criado_em     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (regiao, peso_min_kg, peso_max_kg)
);

CREATE INDEX IF NOT EXISTS idx_frete_faixa_regiao_peso ON TAB_FRETE_FAIXA (regiao, peso_min_kg, peso_max_kg);

-- Valores de partida (o admin ajusta depois em Configuracoes > Frete). A loja
-- e presumida como Sudeste - por isso o Sudeste comeca mais barato e o custo
-- sobe conforme a distancia tipica dos Correios para as demais regioes.
INSERT INTO TAB_FRETE_FAIXA (regiao, peso_min_kg, peso_max_kg, valor, prazo_dias) VALUES
  ('sudeste',      0, 1,  18.00,  4),
  ('sudeste',      1, 3,  25.00,  5),
  ('sudeste',      3, 5,  32.00,  6),
  ('sudeste',      5, 10, 45.00,  7),
  ('sudeste',      10, 30, 70.00, 8),

  ('sul',          0, 1,  22.00,  5),
  ('sul',          1, 3,  30.00,  6),
  ('sul',          3, 5,  38.00,  7),
  ('sul',          5, 10, 52.00,  8),
  ('sul',          10, 30, 80.00, 9),

  ('centro_oeste', 0, 1,  25.00,  6),
  ('centro_oeste', 1, 3,  34.00,  7),
  ('centro_oeste', 3, 5,  42.00,  8),
  ('centro_oeste', 5, 10, 58.00,  9),
  ('centro_oeste', 10, 30, 88.00, 10),

  ('nordeste',     0, 1,  30.00,  8),
  ('nordeste',     1, 3,  40.00,  9),
  ('nordeste',     3, 5,  50.00,  10),
  ('nordeste',     5, 10, 68.00,  11),
  ('nordeste',     10, 30, 100.00, 12),

  ('norte',        0, 1,  35.00,  10),
  ('norte',        1, 3,  48.00,  11),
  ('norte',        3, 5,  60.00,  12),
  ('norte',        5, 10, 82.00,  13),
  ('norte',        10, 30, 120.00, 14)
ON CONFLICT DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('008')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
