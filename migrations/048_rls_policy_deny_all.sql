-- ============================================================
-- RLS SEM POLICY — fecha o aviso "Info" do Security Advisor do Supabase.
-- RLS habilitado sem nenhuma policy ja bloqueia por padrao qualquer acesso
-- via anon/authenticated (PostgREST) - a app nunca usou esse caminho, sempre
-- conectou direto via DATABASE_URL (role com bypassrls), entao isso nunca
-- afetou o funcionamento. Essa migration so torna o bloqueio explicito com
-- uma policy "deny all", pra documentar a intencao e o advisor parar de
-- listar como pendente.
-- ============================================================

-- So existe no projeto Supabase (producao) - o Postgres local de dev nao tem
-- essas roles, entao a migration inteira e pulada ali sem erro.
DO $$
DECLARE
  tabela TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'Roles anon/authenticated nao existem (fora do Supabase) - pulando migration 048.';
    RETURN;
  END IF;

  FOREACH tabela IN ARRAY ARRAY[
    '_migracoes_aplicadas', 'TAB_ASSINATURA_CLUBE', 'TAB_AUDITORIA',
    'TAB_AVALIACAO_PRODUTO', 'TAB_BANNER', 'TAB_BLING_NOTA_NOTIFICADA',
    'TAB_BLING_PEDIDO_PENDENTE', 'TAB_CATEGORIA', 'TAB_CLIENTE', 'TAB_COMPRA',
    'TAB_COMPRA_ITEM', 'TAB_CONFIGURACAO', 'TAB_CONTA', 'TAB_COTACAO',
    'TAB_COTACAO_ITEM', 'TAB_CUPOM', 'TAB_ENDERECO', 'TAB_FEEDBACK',
    'TAB_FORNECEDOR', 'TAB_FRETE_FAIXA', 'TAB_INTEGRACAO_BLING',
    'TAB_INTEGRACAO_SEGREDO', 'TAB_LISTA_DESEJOS', 'TAB_NOTIFICACAO_ESTOQUE',
    'TAB_ORCAMENTO', 'TAB_ORCAMENTO_ITEM', 'TAB_PEDIDO', 'TAB_PEDIDO_COMPRA',
    'TAB_PEDIDO_COMPRA_ITEM', 'TAB_PEDIDO_ITEM', 'TAB_PRODUTO',
    'TAB_PRODUTO_CATEGORIA', 'TAB_PRODUTO_IMAGEM', 'TAB_SOBRE_NOS_MIDIA',
    'TAB_TIPO_ENTREGA', 'TAB_USUARIO_ADMIN', 'TAB_CONFIGURACAO_MARCA'
  ]
  LOOP
    -- lower() pq identificador sem aspas nas migrations anteriores foi
    -- salvo em minusculo pelo Postgres - %I com o nome em maiusculo geraria
    -- um identificador entre aspas que nao bate com a tabela de verdade.
    EXECUTE format('DROP POLICY IF EXISTS bloqueia_acesso_api ON %I', lower(tabela));
    EXECUTE format(
      'CREATE POLICY bloqueia_acesso_api ON %I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      lower(tabela)
    );
  END LOOP;
END $$;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('048')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
