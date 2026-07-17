-- ============================================================
-- TEMA E TEXTOS EDITAVEIS — COISAS BRASILEIRAS
-- Cor do site/botao e textos que hoje estao fixos no codigo,
-- editaveis pelo admin em Configuracoes > Aparencia.
-- ============================================================

INSERT INTO TAB_CONFIGURACAO (chave, valor) VALUES
  ('cor_primaria', '#047857'),
  ('nome_loja', 'Coisas Brasileiras'),
  ('texto_rodape', 'Porcelanas decorativas, presentes, artigos religiosos e perfumaria, direto pra sua casa.')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
