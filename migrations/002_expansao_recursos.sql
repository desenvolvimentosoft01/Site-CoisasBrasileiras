-- ============================================================
-- EXPANSAO DE RECURSOS — COISAS BRASILEIRAS
-- Produto mais completo, rastreio, banners, cupons e configuracoes da loja
-- ============================================================

-- ===== PRODUTO: campos adicionais =====

ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS peso_kg NUMERIC(8,3);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS altura_cm NUMERIC(8,2);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS largura_cm NUMERIC(8,2);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS comprimento_cm NUMERIC(8,2);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER NOT NULL DEFAULT 0;

-- ===== PEDIDO: rastreio e desconto =====

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS transportadora TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS valor_frete NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS cupom_id UUID;

-- ===== BANNER (carrossel da home, administravel) =====

CREATE TABLE IF NOT EXISTS TAB_BANNER (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT NOT NULL,
  subtitulo   TEXT,
  link        TEXT,
  imagem_url  TEXT,
  cor_fundo   TEXT NOT NULL DEFAULT 'from-emerald-700 to-emerald-900',
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===== CUPOM DE DESCONTO =====

CREATE TABLE IF NOT EXISTS TAB_CUPOM (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT NOT NULL UNIQUE,
  tipo                  TEXT NOT NULL DEFAULT 'percentual' CHECK (tipo IN ('percentual','fixo')),
  valor                 NUMERIC(10,2) NOT NULL,
  valor_minimo          NUMERIC(10,2) NOT NULL DEFAULT 0,
  primeira_compra_apenas BOOLEAN NOT NULL DEFAULT false,
  validade              TIMESTAMP,
  uso_maximo            INTEGER,
  usos_atuais           INTEGER NOT NULL DEFAULT 0,
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  criado_em             TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE TAB_PEDIDO
  ADD CONSTRAINT tab_pedido_cupom_id_fkey FOREIGN KEY (cupom_id) REFERENCES TAB_CUPOM(id);

-- Cupom padrao de primeira compra (10% off), validado por conta - so pode
-- ser usado por clientes que nunca tiveram um pedido pago antes.
INSERT INTO TAB_CUPOM (codigo, tipo, valor, primeira_compra_apenas)
VALUES ('BEMVINDO10', 'percentual', 10, true)
ON CONFLICT (codigo) DO NOTHING;

-- ===== CONFIGURACAO DA LOJA (chave/valor, editavel pelo admin) =====

CREATE TABLE IF NOT EXISTS TAB_CONFIGURACAO (
  chave      TEXT PRIMARY KEY,
  valor      TEXT,
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO TAB_CONFIGURACAO (chave, valor) VALUES
  ('whatsapp', ''),
  ('instagram', ''),
  ('email_contato', ''),
  ('frete_valor_base', '20'),
  ('frete_gratis_acima_de', '300'),
  ('banner_texto_topo', '')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
