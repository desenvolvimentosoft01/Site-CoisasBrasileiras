-- O checkout transparente (Payment Brick) marca o pedido como
-- "processando_pagamento" entre o clique em "Pagar" e a confirmacao do
-- Mercado Pago (app/api/checkout/pagamento/route.ts), mas esse status nunca
-- foi adicionado a constraint original de TAB_PEDIDO - todo pagamento
-- online falhava com violacao de check constraint.
ALTER TABLE TAB_PEDIDO DROP CONSTRAINT tab_pedido_status_check;

ALTER TABLE TAB_PEDIDO ADD CONSTRAINT tab_pedido_status_check
  CHECK (status IN (
    'aguardando_pagamento',
    'processando_pagamento',
    'pago',
    'em_separacao',
    'enviado',
    'entregue',
    'cancelado'
  ));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('052')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
