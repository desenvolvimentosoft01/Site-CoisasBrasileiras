-- ============================================================
-- CUSTO REAL DO ITEM DE COMPRA — COISAS BRASILEIRAS
-- Ate aqui o item da entrada guardava so quantidade e custo_unitario, e esse
-- custo era o vUnCom do XML - o preco negociado do produto, sem os valores
-- que o fornecedor cobra junto na mesma nota.
--
-- Numa nota com substituicao tributaria (comum em ceramica/porcelana), IPI ou
-- frete, o que a loja paga de verdade e MAIOR que esse numero. Como o custo
-- medio do produto e alimentado por aqui, o Lucro/DRE saia com margem melhor
-- que a real - o cliente enxergava lucro que nao existe.
--
-- Agora o item guarda a composicao inteira:
--   custo_unitario  = o custo REAL por unidade (e o que move o custo medio)
--   valor_produto   = o vUnCom da nota, sem os acrescimos (pra conferencia
--                     com o documento, que e o que o fornecedor cobra "de
--                     produto")
--   os demais campos = cada acrescimo/desconto por item, pra que o numero
--                     final nunca seja uma caixa-preta: da pra abrir a conta
--                     na tela e bater com a nota, linha por linha.
--
-- Lancamento manual (sem XML) continua funcionando igual: os acrescimos ficam
-- zerados e o custo real e o proprio valor digitado.
--
-- NUMERIC(12,4) nos unitarios de proposito: rateio de frete divide por
-- quantidade e gera dizima. Com 2 casas, uma nota de 500 unidades acumularia
-- centavos de diferenca contra o total da nota.
-- ============================================================

ALTER TABLE TAB_COMPRA_ITEM
  ADD COLUMN IF NOT EXISTS valor_produto   NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS valor_icms_st   NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_ipi       NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_frete     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_seguro    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_outros    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_desconto  NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Itens antigos: o custo que existe la e o valor do produto, e nao havia
-- acrescimo nenhum registrado. Copiar mantem a conta coerente ("produto +
-- acrescimos = custo") tambem no historico, sem inventar imposto que nao foi
-- lancado.
UPDATE TAB_COMPRA_ITEM SET valor_produto = custo_unitario WHERE valor_produto IS NULL;

-- O custo unitario precisa das mesmas 4 casas: com 2, o custo composto seria
-- arredondado na gravacao e nao fecharia com o total da nota.
ALTER TABLE TAB_COMPRA_ITEM ALTER COLUMN custo_unitario TYPE NUMERIC(12,4);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('061')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
