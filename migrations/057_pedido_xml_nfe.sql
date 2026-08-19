-- ============================================================
-- GUARDA DO XML DA NF-E DE SAIDA — COISAS BRASILEIRAS
-- A migration 054 passou a guardar o XML das notas de ENTRADA. Na saida a
-- gente so guardava o id da nota no Bling (bling_nota_id) e os links
-- linkDanfe/linkPDF, que apontam pro servidor do Bling: pra ver ou baixar a
-- nota o cliente precisa estar logado la. Fora que link de terceiro nao e
-- guarda de documento - se a conta do Bling for encerrada ou o link mudar,
-- fica sem nada.
--
-- Mesma decisao da 054: XML como TEXT no proprio banco, pra entrar no backup.
-- NF-e tem guarda obrigatoria de 5 anos e o PDF do DANFE nao substitui o XML.
--
-- Os campos de identificacao (numero, serie, chave, data de emissao) vem do
-- proprio XML e ficam desnormalizados aqui pelo mesmo motivo da entrada: a
-- tela de Notas Fiscais lista e filtra por eles, e nao da pra fazer isso
-- fazendo parse do XML de cada linha a cada abertura de tela.
-- ============================================================

ALTER TABLE TAB_PEDIDO
  ADD COLUMN IF NOT EXISTS xml_nfe          TEXT,
  ADD COLUMN IF NOT EXISTS nfe_numero       TEXT,
  ADD COLUMN IF NOT EXISTS nfe_serie        TEXT,
  ADD COLUMN IF NOT EXISTS nfe_chave_acesso TEXT,
  ADD COLUMN IF NOT EXISTS nfe_data_emissao DATE;

-- Busca da nota pela chave (o contador e o proprio cliente procuram por ela)
-- e filtro por competencia na tela de Notas Fiscais.
CREATE INDEX IF NOT EXISTS idx_pedido_nfe_chave_acesso ON TAB_PEDIDO (nfe_chave_acesso);
CREATE INDEX IF NOT EXISTS idx_pedido_nfe_data_emissao ON TAB_PEDIDO (nfe_data_emissao);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('057')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
