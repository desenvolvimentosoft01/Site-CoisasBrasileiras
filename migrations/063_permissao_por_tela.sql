-- ============================================================
-- PERMISSAO POR TELA — COISAS BRASILEIRAS
-- Ate aqui so existiam dois niveis: admin (ve tudo) e operador (ve uma lista
-- fixa, escrita no codigo). Nao havia meio termo: pra liberar UMA tela pro
-- operador era preciso promove-lo a admin, e ai ele passava a ver custo de
-- compra, margem, financeiro e a senha de todo mundo.
--
-- Agora cada usuario pode ter excecoes sobre o padrao do papel dele. Mesmo
-- modelo do plano de recursos (migration 060): a regra vive no codigo
-- (lib/telas-admin.ts, campo padraoOperador) e o banco guarda so quem foge
-- dela. Isso mantem a tabela pequena e faz uma tela nova entrar em producao
-- com o padrao dela, sem precisar cadastrar permissao pra cada usuario.
--
-- Admin nao entra aqui de proposito: admin com tela bloqueada e um sistema que
-- ninguem consegue destravar depois.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_USUARIO_PERMISSAO (
  usuario_id    UUID NOT NULL REFERENCES TAB_USUARIO_ADMIN(id) ON DELETE CASCADE,
  -- Chave da tela em lib/telas-admin.ts (ex: "financeiro"), e nao a rota: URL
  -- muda quando a tela e renomeada, e a permissao nao pode se perder por isso.
  tela          TEXT NOT NULL,
  permitido     BOOLEAN NOT NULL,
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, tela)
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('063')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
