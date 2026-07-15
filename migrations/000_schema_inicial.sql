-- ============================================================
-- SCHEMA INICIAL — COISAS BRASILEIRAS
-- Rodar manualmente no banco (psql, pgAdmin, etc.)
-- ============================================================

-- ===== CATALOGO =====

CREATE TABLE IF NOT EXISTS TAB_CATEGORIA (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  ativa      BOOLEAN NOT NULL DEFAULT true,
  criado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PRODUTO (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  descricao          TEXT,
  preco              NUMERIC(10,2) NOT NULL,
  preco_promocional  NUMERIC(10,2),
  estoque            INTEGER NOT NULL DEFAULT 0,
  ativo              BOOLEAN NOT NULL DEFAULT true,
  criado_em          TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PRODUTO_CATEGORIA (
  produto_id    UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  categoria_id  UUID NOT NULL REFERENCES TAB_CATEGORIA(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, categoria_id)
);

CREATE TABLE IF NOT EXISTS TAB_PRODUTO_IMAGEM (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  ordem       INTEGER NOT NULL DEFAULT 0
);

-- ===== CLIENTE =====

CREATE TABLE IF NOT EXISTS TAB_CLIENTE (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  telefone    TEXT,
  cpf_cnpj    TEXT UNIQUE,
  senha_hash  TEXT NOT NULL,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_ENDERECO (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID NOT NULL REFERENCES TAB_CLIENTE(id) ON DELETE CASCADE,
  cep          TEXT NOT NULL,
  logradouro   TEXT NOT NULL,
  numero       TEXT NOT NULL,
  complemento  TEXT,
  bairro       TEXT NOT NULL,
  cidade       TEXT NOT NULL,
  estado       TEXT NOT NULL,
  principal    BOOLEAN NOT NULL DEFAULT false
);

-- ===== PEDIDO =====

CREATE TABLE IF NOT EXISTS TAB_PEDIDO (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID NOT NULL REFERENCES TAB_CLIENTE(id),
  endereco_id       UUID NOT NULL REFERENCES TAB_ENDERECO(id),
  status            TEXT NOT NULL DEFAULT 'aguardando_pagamento'
                      CHECK (status IN ('aguardando_pagamento','pago','em_separacao','enviado','entregue','cancelado')),
  total             NUMERIC(10,2) NOT NULL,
  forma_pagamento   TEXT,
  nota_fiscal_url   TEXT,
  criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PEDIDO_ITEM (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES TAB_PEDIDO(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES TAB_PRODUTO(id),
  quantidade      INTEGER NOT NULL,
  preco_unitario  NUMERIC(10,2) NOT NULL
);

-- ===== ADMINISTRACAO =====

CREATE TABLE IF NOT EXISTS TAB_USUARIO_ADMIN (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  papel       TEXT NOT NULL DEFAULT 'operador' CHECK (papel IN ('admin','operador')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
