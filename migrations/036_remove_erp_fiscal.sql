-- ============================================================
-- REMOCAO DO ERP/FISCAL DO SITE — COISAS BRASILEIRAS
--
-- ATENCAO — SCRIPT DESTRUTIVO. NAO RODAR AUTOMATICAMENTE.
--
-- Bling (emissao de NF-e), Compras/Fornecedores e Financeiro/DRE foram
-- reconstruidos num projeto separado (InMenteGestao). Este script apaga
-- as tabelas e colunas correspondentes que ficaram orfas no site depois
-- que o codigo que as usava (app/api/admin/bling, app/api/admin/compras,
-- app/api/admin/fornecedores, app/api/admin/financeiro, lib/bling.ts,
-- lib/compras.ts, lib/relatorio-lucro.ts) foi removido.
--
-- SO RODE ISSO A MAO, E SO DEPOIS DE CONFIRMAR QUE:
--   1. O historico de compras/fornecedores/notas fiscais/contas a pagar que
--      tenha valor (auditoria, contabilidade, etc.) ja foi exportado ou
--      migrado pro InMenteGestao (ou outro lugar que o usuario queira manter).
--   2. Ninguem mais depende dessas tabelas/colunas em producao.
--
-- O DROP TABLE / DROP COLUMN abaixo apaga os dados de forma irreversivel
-- (sem backup automatico). Faca um backup do banco antes de rodar.
-- ============================================================

-- Bling
DROP TABLE IF EXISTS TAB_BLING_NOTA_NOTIFICADA;
DROP TABLE IF EXISTS TAB_INTEGRACAO_BLING;

ALTER TABLE TAB_PEDIDO DROP COLUMN IF EXISTS bling_nota_id;
ALTER TABLE TAB_PEDIDO DROP COLUMN IF EXISTS bling_link_danfe;
ALTER TABLE TAB_PEDIDO DROP COLUMN IF EXISTS bling_link_pdf;
ALTER TABLE TAB_PEDIDO DROP COLUMN IF EXISTS bling_nota_cancelada_em;

-- Compras / Fornecedores
DROP TABLE IF EXISTS TAB_COMPRA_ITEM;
DROP TABLE IF EXISTS TAB_COMPRA;
DROP TABLE IF EXISTS TAB_FORNECEDOR;

-- Financeiro / DRE
DROP TABLE IF EXISTS TAB_CONTA;

-- Campo fiscal orfao (so era usado pra mandar item pro Bling na emissao de NF-e)
ALTER TABLE TAB_PRODUTO DROP COLUMN IF EXISTS ncm;

-- NAO remove TAB_PRODUTO.custo nem TAB_PRODUTO.estoque: sao dados que podem
-- ter valor historico e continuam existindo no banco (so saiu do
-- formulario/tela do admin, ja que nada mais atualiza custo automaticamente
-- no site). Ver DOCS/plano_erp.md para o racional completo.

INSERT INTO _migracoes_aplicadas (versao) VALUES ('036')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
