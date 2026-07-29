-- ============================================================
-- GALERIA DE FOTOS/VIDEOS DA PAGINA "SOBRE NOS" — COISAS BRASILEIRAS
-- Gerenciada em Admin > Marketing > Sobre Nos, renderizada em /sobre no site.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_SOBRE_NOS_MIDIA (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        TEXT NOT NULL CHECK (tipo IN ('imagem', 'video_link', 'video_arquivo')),
  url         TEXT NOT NULL,
  legenda     TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('034')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
