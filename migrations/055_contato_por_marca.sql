-- ============================================================
-- CONTATO, RODAPE E COR PRIMARIA PASSAM A SER POR MARCA
--
-- BUG QUE ISSO CORRIGE: alterar contato ou cor em Configuracoes da Loja nao
-- diferenciava entre Coisas Brasileiras e Porcelanas Brancas. Duas causas:
--
--   1. As chaves de contato (whatsapp, instagram, e-mail, endereco) e o
--      texto do rodape sempre foram GLOBAIS - um valor so, compartilhado
--      pelos dois sites. Nao era bug de codigo, era escopo: nunca foram
--      feitas pra diferenciar. Mas sao identidade de cada loja, entao
--      passam pra TAB_CONFIGURACAO_MARCA.
--
--   2. "cor_primaria" existia NAS DUAS TABELAS ao mesmo tempo: a tela de
--      Configuracoes > Aparencia gravava na global, enquanto a loja e a tela
--      de Cores do Sistema liam/gravavam a por marca. Ou seja, o cliente
--      mudava a cor e o site nao mudava - estava lendo de outro lugar. Duas
--      fontes da verdade pra mesma informacao sempre acaba assim.
--
-- Os valores atuais sao COPIADOS pras duas marcas antes de a aplicacao
-- trocar de fonte, pra que nada apareca em branco depois da atualizacao.
-- A linha global e mantida (nao apaga nada): fica orfa, mas apagar dado de
-- cliente numa migration nao se desfaz se algo der errado.
-- ============================================================

INSERT INTO TAB_CONFIGURACAO_MARCA (chave, marca, valor, atualizado_em)
SELECT c.chave, m.marca, c.valor, NOW()
  FROM TAB_CONFIGURACAO c
 CROSS JOIN (VALUES ('colorido'), ('branco')) AS m(marca)
 WHERE c.chave IN (
   'whatsapp',
   'whatsapp_mensagem',
   'instagram',
   'email_contato',
   'endereco_contato',
   'texto_rodape',
   'cor_primaria'
 )
ON CONFLICT (chave, marca) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('055')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
