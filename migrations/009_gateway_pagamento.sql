-- ============================================================
-- GATEWAY DE PAGAMENTO — COISAS BRASILEIRAS
-- Cliente passa a poder escolher Mercado Pago ou PagBank no checkout do site.
-- Precisa saber qual gateway cada pedido usou pra: (1) o webhook certo saber
-- se aquele pedido e "dele", (2) conciliacao financeira.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS gateway_pagamento TEXT
  CHECK (gateway_pagamento IN ('mercadopago','pagbank'));

-- Pedidos existentes ate aqui foram todos via Mercado Pago (unico gateway ate
-- essa migration existir).
UPDATE TAB_PEDIDO SET gateway_pagamento = 'mercadopago'
WHERE gateway_pagamento IS NULL AND origem = 'site';

INSERT INTO _migracoes_aplicadas (versao) VALUES ('009')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
