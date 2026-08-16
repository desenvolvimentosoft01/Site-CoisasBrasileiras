-- Guarda o id do pagamento no Mercado Pago pra permitir estorno automatico
-- quando um pedido pago for cancelado (app/api/admin/pedidos/[id]/route.ts).
-- Antes nada ligava TAB_PEDIDO ao pagamento real, entao um cancelamento so
-- mudava o status no nosso banco sem devolver o dinheiro no Mercado Pago.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;
