-- ============================================================
-- RLS NAS TABELAS CRIADAS DEPOIS DA 045 — COISAS BRASILEIRAS
--
-- A 045 habilitou RLS numa lista fixa de tabelas e a 048 criou a policy
-- "deny all" na mesma lista. Toda tabela criada depois disso precisava ser
-- adicionada nas duas listas na mao - a 046 (TAB_CONFIGURACAO_MARCA) lembrou,
-- as quatro abaixo nao. Elas ficaram sem RLS e aparecem no Security Advisor
-- do Supabase:
--   TAB_RECURSO           (060)
--   TAB_ESTOQUE_MOVIMENTO (062)
--   TAB_USUARIO_PERMISSAO (063)
--   TAB_TRANSPORTADORA    (065)
--
-- Nao muda o funcionamento da app: ela sempre conectou via DATABASE_URL, com
-- uma role que tem bypassrls. O que isso fecha e o caminho anon/authenticated
-- do PostgREST, que nunca foi usado e nao deve ser.
--
-- Tambem faz o backfill do registro das migrations 001, 052 e 053, que eram
-- as unicas sem o INSERT em _migracoes_aplicadas no fim do arquivo. Num
-- banco criado do zero elas ja se registram sozinhas (o INSERT foi adicionado
-- nos dois arquivos); este bloco existe pros bancos que rodaram a versao
-- antiga e ficariam com as duas eternamente listadas como pendentes.
-- ============================================================

-- ===== RLS =====

ALTER TABLE TAB_RECURSO           ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_ESTOQUE_MOVIMENTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_USUARIO_PERMISSAO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_TRANSPORTADORA    ENABLE ROW LEVEL SECURITY;

-- ===== POLICY "DENY ALL" (mesmo padrao da 048) =====
-- So existe no projeto Supabase (producao) - o Postgres local de dev nao tem
-- as roles anon/authenticated, entao este bloco e pulado ali sem erro.
DO $$
DECLARE
  tabela TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'Roles anon/authenticated nao existem (fora do Supabase) - pulando a policy da migration 066.';
    RETURN;
  END IF;

  FOREACH tabela IN ARRAY ARRAY[
    'tab_recurso', 'tab_estoque_movimento',
    'tab_usuario_permissao', 'tab_transportadora'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS bloqueia_acesso_api ON %I', tabela);
    EXECUTE format(
      'CREATE POLICY bloqueia_acesso_api ON %I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      tabela
    );
  END LOOP;
END $$;

-- ===== BACKFILL DO REGISTRO DAS MIGRATIONS 001, 052 E 053 =====

-- 001 nao tem DDL nenhum (a criacao do admin virou scripts/criar-admin.js) e
-- roda antes de _migracoes_aplicadas existir, entao nao consegue se registrar
-- sozinha num banco novo. Sem isso ela seria reexecutada em toda rodada do
-- rodar-todas-migrations.js - inofensivo, mas confuso no log.
INSERT INTO _migracoes_aplicadas (versao) VALUES ('001')
ON CONFLICT (versao) DO NOTHING;

-- Registra so o que de fato ja esta no banco, do mesmo jeito que a 004 fez
-- com as migrations anteriores a tabela de controle.

-- 052: o status 'processando_pagamento' entrou na constraint de TAB_PEDIDO.
INSERT INTO _migracoes_aplicadas (versao)
SELECT '052' WHERE EXISTS (
  SELECT 1 FROM pg_constraint
   WHERE conname = 'tab_pedido_status_check'
     AND pg_get_constraintdef(oid) LIKE '%processando_pagamento%'
)
ON CONFLICT (versao) DO NOTHING;

-- 053: a coluna que guarda o id do pagamento no Mercado Pago.
INSERT INTO _migracoes_aplicadas (versao)
SELECT '053' WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
   WHERE table_name = 'tab_pedido' AND column_name = 'mercadopago_payment_id'
)
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('066')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
