-- ============================================================
-- CODIGO SEQUENCIAL NOS CADASTROS — COISAS BRASILEIRAS
-- Todo cadastro passa a ter um numero curto e proprio (1, 2, 3...), do jeito
-- que se faz em ERP: e por ele que o cliente procura no dia a dia ("me ve o
-- fornecedor 12"), e nao pelo id interno, que e um UUID de 36 caracteres e
-- ninguem decora nem dita por telefone.
--
-- Por que SEQUENCE e nao uma tabela de "proximo codigo":
--   - o proprio projeto ja usa sequence pra numerar Orcamento (013), Pedido de
--     Compra (041) e Cotacao (042) - manter dois mecanismos pro mesmo problema
--     so cria duvida sobre qual e o certo;
--   - nextval e atomico: dois cadastros ao mesmo tempo nunca pegam o mesmo
--     numero, sem lock explicito e sem serializar os cadastros;
--   - o buraco que a sequence pode deixar (cadastro que falha consome o
--     numero) nao tem consequencia nenhuma num cadastro. Numeracao sem buraco
--     so importa em documento fiscal, e nesse caso quem manda e a Sefaz.
--
-- O codigo e gerado pelo banco (DEFAULT nextval) de proposito: nao existe
-- caminho pela aplicacao que permita escolher o numero, entao nao ha o que
-- proteger na tela. E interno, nao se edita.
--
-- Os registros que ja existem sao numerados por ordem de cadastro
-- (criado_em), pra que o codigo 1 seja de fato o mais antigo.
-- ============================================================

-- Cria a coluna, numera o que ja existe, aponta a sequence pro proximo numero
-- livre e so entao amarra o DEFAULT. A ordem importa: se o DEFAULT viesse
-- antes da renumeracao, os registros antigos ficariam com numero fora de ordem.
DO $$
DECLARE
  nome_tabela TEXT;
  ultimo      INTEGER;
BEGIN
  FOREACH nome_tabela IN ARRAY ARRAY[
    'tab_produto',
    'tab_fornecedor',
    'tab_cliente',
    'tab_categoria',
    'tab_usuario_admin',
    -- TAB_CUPOM fica de fora: ele ja tem "codigo", e de texto ("BEMVINDO10").
    -- O codigo do cupom e escolhido por quem cria a promocao e vai impresso na
    -- comunicacao com o cliente - dar um segundo numero interno so criaria
    -- duvida sobre qual dos dois e "o codigo do cupom".
    'tab_banner',
    'tab_feedback',
    'tab_conta',
    'tab_tipo_entrega',
    'tab_avaliacao_produto',
    'tab_sobre_nos_midia'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS codigo INTEGER', nome_tabela);

    EXECUTE format(
      'UPDATE %I alvo SET codigo = numerado.novo_codigo
         FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY criado_em, id) AS novo_codigo FROM %I) numerado
        WHERE alvo.id = numerado.id AND alvo.codigo IS NULL',
      nome_tabela, nome_tabela
    );

    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', nome_tabela || '_codigo_seq');

    EXECUTE format('SELECT COALESCE(MAX(codigo), 0) FROM %I', nome_tabela) INTO ultimo;
    EXECUTE format('SELECT setval(%L, %s)', nome_tabela || '_codigo_seq', GREATEST(ultimo, 1));

    -- setval com o ultimo usado faz o proximo nextval devolver ultimo + 1.
    -- Quando a tabela esta vazia, o setval acima fixou 1 e o primeiro cadastro
    -- ficaria com 2 - o is_called = false corrige isso.
    IF ultimo = 0 THEN
      EXECUTE format('SELECT setval(%L, 1, false)', nome_tabela || '_codigo_seq');
    END IF;

    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN codigo SET DEFAULT nextval(%L)',
      nome_tabela, nome_tabela || '_codigo_seq'
    );

    -- UNIQUE e nao NOT NULL: a coluna e preenchida pelo DEFAULT em todo insert
    -- novo, mas exigir NOT NULL faria a migration falhar em qualquer linha que
    -- por algum motivo tenha escapado da renumeracao acima.
    EXECUTE format(
      'CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I (codigo)',
      'idx_' || nome_tabela || '_codigo', nome_tabela
    );
  END LOOP;
END $$;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('058')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
