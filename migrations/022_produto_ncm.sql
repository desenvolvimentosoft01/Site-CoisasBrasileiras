-- ============================================================
-- NCM DO PRODUTO — COISAS BRASILEIRAS
-- Em vez de sincronizar cadastro de produto com o Bling (criaria um segundo
-- "dono" do catalogo, mesmo risco de dessincronia que ja evitamos com
-- estoque), o NCM e cadastrado aqui e enviado direto no item da NF-e na hora
-- de emitir - a API do Bling aceita classificacaoFiscal por item, sem
-- precisar que o produto exista no cadastro deles.
-- ============================================================

ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS ncm TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('022')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
