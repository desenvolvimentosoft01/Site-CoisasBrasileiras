-- ============================================================
-- FORNECEDORES E COMPRAS — COISAS BRASILEIRAS
-- Base do custo real do produto (pre-requisito do relatorio de lucro
-- liquido): cadastro de fornecedor + entrada de compra manual, que atualiza
-- o custo medio ponderado e da alta no estoque do produto ao ser recebida.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_FORNECEDOR (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social   TEXT NOT NULL,
  nome_fantasia  TEXT,
  cnpj_cpf       TEXT,
  telefone       TEXT,
  email          TEXT,
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

-- Custo medio ponderado atual do produto - usado no relatorio de lucro
-- (preco - custo). Comeca zerado; so passa a refletir a realidade a partir
-- da primeira compra recebida.
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS custo NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS TAB_COMPRA (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id  UUID NOT NULL REFERENCES TAB_FORNECEDOR(id),
  numero_nota    TEXT,
  status         TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','recebida','cancelada')),
  valor_frete    NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_compra    DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao     TEXT,
  -- Conta a pagar gerada automaticamente quando a compra e recebida (ver
  -- lib/compras.ts) - referencia null enquanto pendente/cancelada.
  conta_id       UUID REFERENCES TAB_CONTA(id),
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_COMPRA_ITEM (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id       UUID NOT NULL REFERENCES TAB_COMPRA(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES TAB_PRODUTO(id),
  quantidade      INTEGER NOT NULL CHECK (quantidade > 0),
  custo_unitario  NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compra_fornecedor ON TAB_COMPRA (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_compra_status ON TAB_COMPRA (status);
CREATE INDEX IF NOT EXISTS idx_compra_item_compra ON TAB_COMPRA_ITEM (compra_id);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('020')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
