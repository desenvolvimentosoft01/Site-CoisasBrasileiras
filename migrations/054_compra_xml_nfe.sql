-- ============================================================
-- GUARDA DO XML DA NF-E DE ENTRADA — COISAS BRASILEIRAS
-- Ate aqui o XML enviado em Compras > Entrada de NF era lido, validado
-- (lib/nfe-xml.ts) e DESCARTADO - so os dados extraidos viravam TAB_COMPRA.
-- Na pratica o arquivo continuava existindo so no e-mail/download do
-- operador, e o contador precisa do lote de XMLs todo mes. Alem disso, XML
-- de NF-e tem guarda obrigatoria de 5 anos: o DANFE em PDF nao substitui.
--
-- Guardado como TEXT no proprio banco (e nao em disco) de proposito: o
-- arquivo e pequeno (dezenas de KB) e assim entra automaticamente no backup
-- do banco. Documento com guarda legal que vive fora do backup e um acidente
-- esperando pra acontecer.
--
-- Junto vao dois campos que o XML ja trazia e a gente tambem jogava fora:
--   - data_emissao: a competencia da nota. Diferente de data_compra (quando
--     a mercadoria/lancamento entrou), e e por emissao que o contador fecha
--     o mes - sem isso o export por periodo sai deslocado.
--   - valor_total_nota: o vNF do XML. Hoje o valor da compra e derivado de
--     itens + frete, o que NAO bate com a nota quando ha ST, IPI ou
--     desconto - e ai o cliente acha que o sistema esta errado.
-- ============================================================

ALTER TABLE TAB_COMPRA
  ADD COLUMN IF NOT EXISTS xml_nfe         TEXT,
  ADD COLUMN IF NOT EXISTS data_emissao    DATE,
  ADD COLUMN IF NOT EXISTS valor_total_nota NUMERIC(12,2),
  -- Numero sozinho nao identifica a nota: a numeracao e por serie, e dois
  -- fornecedores (ou o mesmo, em series diferentes) repetem numero sem
  -- problema. O contador confere por serie.
  ADD COLUMN IF NOT EXISTS serie           TEXT;

-- Usado pra checar se a nota ja foi lancada antes (a chave e unica por nota)
-- e pra montar o nome do arquivo no export. Indice comum, nao UNIQUE: nao da
-- pra garantir que a base atual nao tenha duplicata de lancamentos antigos, e
-- uma migration que falha no cliente e pior que a checagem na aplicacao (que
-- ainda por cima devolve uma mensagem melhor que um erro de constraint).
CREATE INDEX IF NOT EXISTS idx_compra_chave_acesso ON TAB_COMPRA (chave_acesso);

-- Filtro do export por competencia.
CREATE INDEX IF NOT EXISTS idx_compra_data_emissao ON TAB_COMPRA (data_emissao);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('054')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
