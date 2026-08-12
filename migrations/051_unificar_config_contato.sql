-- ============================================================
-- UNIFICAR CONFIGURACOES DE CONTATO ENTRE AS DUAS LOJAS
-- WhatsApp, mensagem do WhatsApp, Instagram, email de contato, endereco de
-- contato e texto do rodape deixam de ser por marca (TAB_CONFIGURACAO_MARCA)
-- e passam a valer pras duas lojas (TAB_CONFIGURACAO). Usa os valores ja
-- salvos na marca "colorido" como base. Nome da loja, logo, banner do topo,
-- texto "sobre nos" e cores continuam separados por marca.
-- ============================================================

INSERT INTO TAB_CONFIGURACAO (chave, valor, atualizado_em)
SELECT chave, valor, NOW()
FROM TAB_CONFIGURACAO_MARCA
WHERE marca = 'colorido'
  AND chave IN ('whatsapp', 'whatsapp_mensagem', 'instagram', 'email_contato', 'endereco_contato', 'texto_rodape')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = NOW();

DELETE FROM TAB_CONFIGURACAO_MARCA
WHERE chave IN ('whatsapp', 'whatsapp_mensagem', 'instagram', 'email_contato', 'endereco_contato', 'texto_rodape');

INSERT INTO _migracoes_aplicadas (versao) VALUES ('051')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
