-- ============================================================
-- SITUACAO DETALHADA DA NF-E (BLING)
-- Ate aqui so sabiamos "emitida" ou "cancelada" (ver bling_nota_cancelada_em).
-- Guarda o codigo de situacao que o Bling devolve (mesma tabela de codigos
-- ja usada em Compras > Notas do Bling: autorizada, rejeitada, denegada,
-- aguardando protocolo etc) pra mostrar na tela do pedido sem precisar
-- abrir o Bling pra saber por que uma nota travou.
-- ============================================================

ALTER TABLE TAB_PEDIDO
  ADD COLUMN IF NOT EXISTS bling_nota_situacao INTEGER,
  ADD COLUMN IF NOT EXISTS bling_nota_situacao_atualizada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('040')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
