-- ============================================================
-- VENDA BALCAO — COISAS BRASILEIRAS
-- Permite que TAB_PEDIDO tambem represente vendas feitas no balcao pelo
-- admin, alem dos pedidos do site.
-- ============================================================

-- Distingue de onde veio o pedido. Pedidos existentes (todos do site ate
-- aqui) ficam marcados como 'site' pelo DEFAULT.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'site'
  CHECK (origem IN ('site','balcao'));

-- Venda balcao nao exige cliente com conta no site (login) nem endereco de
-- entrega - por isso os dois ficam opcionais. Pedidos do site continuam
-- sempre preenchendo os dois normalmente.
ALTER TABLE TAB_PEDIDO ALTER COLUMN cliente_id DROP NOT NULL;
ALTER TABLE TAB_PEDIDO ALTER COLUMN endereco_id DROP NOT NULL;

-- Cadastro rapido do balcao (nome/telefone) sem criar conta em TAB_CLIENTE -
-- usado quando o cliente nao tem cadastro e nao quer criar um.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS cliente_nome_avulso TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS cliente_telefone_avulso TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('006')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
