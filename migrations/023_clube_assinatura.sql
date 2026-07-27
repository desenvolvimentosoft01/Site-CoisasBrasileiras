-- ============================================================
-- CLUBE DE ASSINATURA — COISAS BRASILEIRAS
-- Cliente com assinatura mensal ativa (cobranca recorrente via Mercado Pago
-- PreApproval) ve preco especial em produtos marcados como participantes.
-- ============================================================

-- Preco exclusivo do clube - NULL significa que o produto nao participa.
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS preco_clube NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS TAB_ASSINATURA_CLUBE (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id          UUID NOT NULL REFERENCES TAB_CLIENTE(id),
  mp_preapproval_id   TEXT UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','autorizada','pausada','cancelada')),
  valor_mensalidade   NUMERIC(10,2) NOT NULL,
  proximo_vencimento  DATE,
  criado_em           TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sem UNIQUE em cliente_id de proposito - cliente pode cancelar e assinar de
-- novo depois, o historico fica preservado (pega sempre a mais recente por
-- criado_em nas consultas).
CREATE INDEX IF NOT EXISTS idx_assinatura_cliente ON TAB_ASSINATURA_CLUBE (cliente_id);
CREATE INDEX IF NOT EXISTS idx_assinatura_status ON TAB_ASSINATURA_CLUBE (status);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('023')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
