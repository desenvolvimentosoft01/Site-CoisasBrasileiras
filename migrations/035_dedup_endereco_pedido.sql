-- ============================================================
-- LIMPEZA E PREVENCAO DE DUPLICATAS EM ENDERECO E PEDIDO
-- Corrige duplicatas ja existentes em "Minha Conta" (enderecos repetidos e
-- pedidos "aguardando pagamento" repetidos gerados por reenvio do checkout)
-- e fecha a janela de corrida que ainda permitia duplicar endereco.
-- ============================================================

-- Reaponta pedidos que ficaram em enderecos duplicados para uma unica copia
-- canonica do mesmo grupo (TAB_ENDERECO nao tem coluna de data de criacao,
-- entao o desempate e so por id, de forma deterministica), antes de apagar
-- as copias. Da preferencia ao endereco marcado como "principal", se houver.
-- Isso roda ANTES da deduplicacao de pedidos, senao pedidos identicos que
-- apontam pra copias diferentes de endereco nao seriam agrupados como
-- duplicados no passo seguinte.
WITH grupos AS (
  SELECT
    id,
    cliente_id,
    FIRST_VALUE(id) OVER (
      PARTITION BY cliente_id, cep, numero, COALESCE(complemento, '')
      ORDER BY principal DESC, id ASC
    ) AS id_canonico
  FROM TAB_ENDERECO
)
UPDATE TAB_PEDIDO p
SET endereco_id = g.id_canonico
FROM grupos g
WHERE p.endereco_id = g.id AND p.endereco_id <> g.id_canonico;

-- Remove as copias de endereco que sobraram sem referencia.
WITH grupos AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY cliente_id, cep, numero, COALESCE(complemento, '')
      ORDER BY principal DESC, id ASC
    ) AS id_canonico
  FROM TAB_ENDERECO
)
DELETE FROM TAB_ENDERECO e
USING grupos g
WHERE e.id = g.id AND e.id <> g.id_canonico;

-- Cancela pedidos "aguardando_pagamento" duplicados (mesmo cliente, mesmo
-- endereco ja canonico, mesmo total), mantendo so o mais recente de cada
-- grupo. Pedidos ja pagos/enviados nao sao tocados.
WITH duplicados AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY cliente_id, endereco_id, total
      ORDER BY criado_em DESC
    ) AS posicao
  FROM TAB_PEDIDO
  WHERE status = 'aguardando_pagamento'
)
UPDATE TAB_PEDIDO
SET status = 'cancelado'
WHERE id IN (SELECT id FROM duplicados WHERE posicao > 1);

-- Fecha a janela de corrida: mesmo que dois checkouts simultaneos passem
-- pelo SELECT de reaproveitamento ao mesmo tempo, o banco agora impede
-- duas linhas identicas para o mesmo cliente.
CREATE UNIQUE INDEX IF NOT EXISTS idx_endereco_dedup
  ON TAB_ENDERECO (cliente_id, cep, numero, COALESCE(complemento, ''));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('035')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
