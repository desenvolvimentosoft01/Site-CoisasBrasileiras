-- ============================================================
-- TIPOS DE ENTREGA — COISAS BRASILEIRAS
-- Usado na venda balcao: quando a venda vem por outro canal (ex: WhatsApp) e
-- tem alguma forma de entrega (retirada na loja, motoboy, etc), a operadora
-- escolhe o tipo de entrega ao finalizar. Cadastro simples e ativavel.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_TIPO_ENTREGA (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL UNIQUE,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  criado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Vinculo opcional no pedido. ON DELETE SET NULL: apagar um tipo de entrega
-- nao apaga os pedidos que o usaram, so desvincula.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS tipo_entrega_id UUID
  REFERENCES TAB_TIPO_ENTREGA(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedido_tipo_entrega ON TAB_PEDIDO (tipo_entrega_id);

-- Alguns tipos comuns pra ja comecar (a operadora ajusta em Configuracoes).
INSERT INTO TAB_TIPO_ENTREGA (nome) VALUES
  ('Retirada na loja'),
  ('Entrega local (motoboy)'),
  ('Correios')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('012')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
