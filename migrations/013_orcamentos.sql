-- ============================================================
-- ORCAMENTOS — COISAS BRASILEIRAS
-- Documento de cotacao pro cliente decidir antes de fechar a compra - nao
-- baixa estoque nem gera pedido sozinho. Quando aprovado, o admin converte
-- o orcamento numa venda (mesmo caminho da venda balcao: baixa estoque,
-- gera TAB_PEDIDO com origem 'balcao').
--
-- Escopo v1 (mais simples que o InMenteGestao de proposito): sem assinatura
-- digital (exigiria upload de imagem) e sem link publico de aprovacao por
-- e-mail/WhatsApp (exigiria pagina publica + token + envio de e-mail) - o
-- admin marca aprovado/recusado manualmente por enquanto. Da pra evoluir
-- depois se for necessario.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS orcamento_numero_seq;

CREATE TABLE IF NOT EXISTS TAB_ORCAMENTO (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                  INTEGER NOT NULL DEFAULT nextval('orcamento_numero_seq'),
  titulo                  TEXT,
  cliente_id              UUID REFERENCES TAB_CLIENTE(id) ON DELETE SET NULL,
  -- Nome/telefone sempre preenchidos (mesmo com cliente_id), pra o orcamento
  -- continuar legivel mesmo se o cadastro do cliente for excluido depois -
  -- mesmo principio ja usado em TAB_PEDIDO.cliente_nome_avulso.
  cliente_nome            TEXT NOT NULL,
  cliente_telefone        TEXT,
  condicoes               TEXT,
  status                  TEXT NOT NULL DEFAULT 'aberto'
                            CHECK (status IN ('aberto','aprovado','recusado','convertido')),
  subtotal                NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto                NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                   NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Preenchido so quando o orcamento vira venda de verdade (status convertido).
  pedido_id               UUID REFERENCES TAB_PEDIDO(id) ON DELETE SET NULL,
  criado_em               TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_ORCAMENTO_ITEM (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id    UUID NOT NULL REFERENCES TAB_ORCAMENTO(id) ON DELETE CASCADE,
  -- Opcional: item pode ser um produto do catalogo (baixa estoque na
  -- conversao) ou so uma descricao livre (ex: "instalacao", servico avulso -
  -- nao baixa estoque, nao entra na conversao em pedido).
  produto_id      UUID REFERENCES TAB_PRODUTO(id) ON DELETE SET NULL,
  descricao       TEXT NOT NULL,
  quantidade      NUMERIC(10,2) NOT NULL,
  valor_unitario  NUMERIC(10,2) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orcamento_item_orcamento ON TAB_ORCAMENTO_ITEM (orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_cliente ON TAB_ORCAMENTO (cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_status ON TAB_ORCAMENTO (status);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('013')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
