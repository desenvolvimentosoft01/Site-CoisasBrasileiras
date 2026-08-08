-- ============================================================
-- MARCA — unificação Coisas Brasileiras (colorido) + Porcelanas Brancas
-- (branco) num sistema só. Mesmo padrao de TAB_PEDIDO.canal (018): coluna
-- simples com CHECK, sem tabela de cadastro. Todo produto/categoria/banner/
-- pedido passa a pertencer a uma marca; o admin filtra por ela, e o site
-- publico so mostra a marca do dominio que esta sendo acessado.
-- ============================================================

ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_PRODUTO DROP CONSTRAINT IF EXISTS tab_produto_marca_check;
ALTER TABLE TAB_PRODUTO ADD CONSTRAINT tab_produto_marca_check
  CHECK (marca IN ('colorido', 'branco'));

ALTER TABLE TAB_CATEGORIA ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_CATEGORIA DROP CONSTRAINT IF EXISTS tab_categoria_marca_check;
ALTER TABLE TAB_CATEGORIA ADD CONSTRAINT tab_categoria_marca_check
  CHECK (marca IN ('colorido', 'branco'));

ALTER TABLE TAB_BANNER ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_BANNER DROP CONSTRAINT IF EXISTS tab_banner_marca_check;
ALTER TABLE TAB_BANNER ADD CONSTRAINT tab_banner_marca_check
  CHECK (marca IN ('colorido', 'branco'));

-- Pedidos: marca herdada do site onde a compra foi feita (nao editavel pelo
-- cliente) - so pra filtro/relatorio no admin, nao afeta o checkout.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_PEDIDO DROP CONSTRAINT IF EXISTS tab_pedido_marca_check;
ALTER TABLE TAB_PEDIDO ADD CONSTRAINT tab_pedido_marca_check
  CHECK (marca IN ('colorido', 'branco'));

-- Identidade visual por marca (nome da loja, logo, cores, contato) - tabela
-- nova em vez de mudar a PK de TAB_CONFIGURACAO, porque a maioria das chaves
-- de la (frete, Bling, e-mail) e operacional e continua compartilhada entre
-- os dois sites. So o que e "cara da loja" precisa duplicar por marca.
CREATE TABLE IF NOT EXISTS TAB_CONFIGURACAO_MARCA (
  chave        TEXT NOT NULL,
  marca        TEXT NOT NULL CHECK (marca IN ('colorido', 'branco')),
  valor        TEXT,
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chave, marca)
);
ALTER TABLE TAB_CONFIGURACAO_MARCA ENABLE ROW LEVEL SECURITY;

-- Backfill: a loja "colorido" (Coisas Brasileiras) ja tem esses valores em
-- TAB_CONFIGURACAO - copia pra TAB_CONFIGURACAO_MARCA como marca='colorido',
-- pra nao mudar nada no site atual quando as paginas passarem a ler daqui.
INSERT INTO TAB_CONFIGURACAO_MARCA (chave, marca, valor)
SELECT chave, 'colorido', valor
FROM TAB_CONFIGURACAO
WHERE chave IN (
  'nome_loja', 'logo_url', 'whatsapp', 'whatsapp_mensagem', 'instagram',
  'email_contato', 'endereco_contato', 'texto_rodape', 'texto_sobre_nos',
  'banner_texto_topo',
  'cor_primaria', 'cor_primaria_texto', 'cor_secundaria', 'cor_secundaria_texto',
  'cor_destaque', 'cor_destaque_texto', 'cor_neutra', 'cor_neutra_texto',
  'cor_perigo', 'cor_fundo', 'cor_texto', 'cor_borda'
)
ON CONFLICT (chave, marca) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('046')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
