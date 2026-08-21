-- ============================================================
-- SCHEMA COMPLETO — COISAS BRASILEIRAS
--
-- ARQUIVO GERADO. Nao edite aqui: edite a migration correspondente em
-- migrations/ e rode "node scripts/gerar-schema-completo.js" de novo.
--
-- Sao as 67 migrations numeradas, na ordem, num arquivo so.
-- Serve pra criar um banco do zero colando tudo no SQL Editor do Supabase,
-- sem precisar de psql nem de Node na maquina.
--
-- USE SO EM BANCO NOVO/VAZIO. Num banco que ja tem dados, rode
-- "node scripts/rodar-todas-migrations.js", que pula o que ja foi aplicado.
--
-- O SQL Editor do Supabase roda tudo numa transacao unica: se qualquer
-- comando falhar, nada e gravado e o banco continua vazio.
--
-- Depois de rodar, crie o primeiro administrador:
--   node scripts/criar-admin.js "Nome do Admin" email@dominio.com
-- ============================================================

-- ============================================================
-- >>> 000_schema_inicial.sql
-- ============================================================

-- ============================================================
-- SCHEMA INICIAL — COISAS BRASILEIRAS
-- Rodar manualmente no banco (psql, pgAdmin, etc.)
-- ============================================================

-- ===== CATALOGO =====

CREATE TABLE IF NOT EXISTS TAB_CATEGORIA (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  ativa      BOOLEAN NOT NULL DEFAULT true,
  criado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PRODUTO (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  descricao          TEXT,
  preco              NUMERIC(10,2) NOT NULL,
  preco_promocional  NUMERIC(10,2),
  estoque            INTEGER NOT NULL DEFAULT 0,
  ativo              BOOLEAN NOT NULL DEFAULT true,
  criado_em          TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PRODUTO_CATEGORIA (
  produto_id    UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  categoria_id  UUID NOT NULL REFERENCES TAB_CATEGORIA(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, categoria_id)
);

CREATE TABLE IF NOT EXISTS TAB_PRODUTO_IMAGEM (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  ordem       INTEGER NOT NULL DEFAULT 0
);

-- ===== CLIENTE =====

CREATE TABLE IF NOT EXISTS TAB_CLIENTE (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  telefone    TEXT,
  cpf_cnpj    TEXT UNIQUE,
  senha_hash  TEXT NOT NULL,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_ENDERECO (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id   UUID NOT NULL REFERENCES TAB_CLIENTE(id) ON DELETE CASCADE,
  cep          TEXT NOT NULL,
  logradouro   TEXT NOT NULL,
  numero       TEXT NOT NULL,
  complemento  TEXT,
  bairro       TEXT NOT NULL,
  cidade       TEXT NOT NULL,
  estado       TEXT NOT NULL,
  principal    BOOLEAN NOT NULL DEFAULT false
);

-- ===== PEDIDO =====

CREATE TABLE IF NOT EXISTS TAB_PEDIDO (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID NOT NULL REFERENCES TAB_CLIENTE(id),
  endereco_id       UUID NOT NULL REFERENCES TAB_ENDERECO(id),
  status            TEXT NOT NULL DEFAULT 'aguardando_pagamento'
                      CHECK (status IN ('aguardando_pagamento','pago','em_separacao','enviado','entregue','cancelado')),
  total             NUMERIC(10,2) NOT NULL,
  forma_pagamento   TEXT,
  nota_fiscal_url   TEXT,
  criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PEDIDO_ITEM (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES TAB_PEDIDO(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES TAB_PRODUTO(id),
  quantidade      INTEGER NOT NULL,
  preco_unitario  NUMERIC(10,2) NOT NULL
);

-- ===== ADMINISTRACAO =====

CREATE TABLE IF NOT EXISTS TAB_USUARIO_ADMIN (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  papel       TEXT NOT NULL DEFAULT 'operador' CHECK (papel IN ('admin','operador')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 001_admin_padrao.sql
-- ============================================================

-- ============================================================
-- USUARIO ADMIN INICIAL — COISAS BRASILEIRAS
--
-- Este arquivo NAO cria mais um usuario com senha fixa (versao antiga tinha
-- uma senha padrao documentada aqui e commitada no Git - senha exposta em
-- codigo publico/revendido e sempre um risco, entao removida).
--
-- Pra criar o primeiro administrador, rode (depois de configurar
-- DATABASE_URL no .env.local):
--
--   node scripts/criar-admin.js "Nome do Admin" email@dominio.com
--
-- O script pede a senha no terminal (nao fica salva em nenhum arquivo nem
-- historico de comando) e grava so o hash bcrypt no banco.
-- ============================================================

-- Sem DDL nenhum: o registro existe so pra migration nao ser reexecutada a
-- cada rodada do scripts/rodar-todas-migrations.js.
--
-- Dentro de um DO/EXECUTE de proposito: _migracoes_aplicadas so nasce na 004,
-- e num banco novo esta migration roda antes disso. Um INSERT solto falharia
-- no parse ("relacao nao existe") mesmo com WHERE - o planejador resolve a
-- tabela antes de avaliar a condicao. Em banco novo o registro fica por conta
-- do backfill da 066.
DO $$
BEGIN
  IF to_regclass('public._migracoes_aplicadas') IS NOT NULL THEN
    EXECUTE $sql$
      INSERT INTO _migracoes_aplicadas (versao) VALUES ('001')
      ON CONFLICT (versao) DO NOTHING
    $sql$;
  END IF;
END $$;

-- ============================================================
-- >>> 002_expansao_recursos.sql
-- ============================================================

-- ============================================================
-- EXPANSAO DE RECURSOS — COISAS BRASILEIRAS
-- Produto mais completo, rastreio, banners, cupons e configuracoes da loja
-- ============================================================

-- ===== PRODUTO: campos adicionais =====

ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS peso_kg NUMERIC(8,3);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS altura_cm NUMERIC(8,2);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS largura_cm NUMERIC(8,2);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS comprimento_cm NUMERIC(8,2);
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER NOT NULL DEFAULT 0;

-- ===== PEDIDO: rastreio e desconto =====

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS transportadora TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS valor_frete NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS cupom_id UUID;

-- ===== BANNER (carrossel da home, administravel) =====

CREATE TABLE IF NOT EXISTS TAB_BANNER (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      TEXT NOT NULL,
  subtitulo   TEXT,
  link        TEXT,
  imagem_url  TEXT,
  cor_fundo   TEXT NOT NULL DEFAULT 'from-emerald-700 to-emerald-900',
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===== CUPOM DE DESCONTO =====

CREATE TABLE IF NOT EXISTS TAB_CUPOM (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT NOT NULL UNIQUE,
  tipo                  TEXT NOT NULL DEFAULT 'percentual' CHECK (tipo IN ('percentual','fixo')),
  valor                 NUMERIC(10,2) NOT NULL,
  valor_minimo          NUMERIC(10,2) NOT NULL DEFAULT 0,
  primeira_compra_apenas BOOLEAN NOT NULL DEFAULT false,
  validade              TIMESTAMP,
  uso_maximo            INTEGER,
  usos_atuais           INTEGER NOT NULL DEFAULT 0,
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  criado_em             TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE TAB_PEDIDO
  ADD CONSTRAINT tab_pedido_cupom_id_fkey FOREIGN KEY (cupom_id) REFERENCES TAB_CUPOM(id);

-- Cupom padrao de primeira compra (10% off), validado por conta - so pode
-- ser usado por clientes que nunca tiveram um pedido pago antes.
INSERT INTO TAB_CUPOM (codigo, tipo, valor, primeira_compra_apenas)
VALUES ('BEMVINDO10', 'percentual', 10, true)
ON CONFLICT (codigo) DO NOTHING;

-- ===== CONFIGURACAO DA LOJA (chave/valor, editavel pelo admin) =====

CREATE TABLE IF NOT EXISTS TAB_CONFIGURACAO (
  chave      TEXT PRIMARY KEY,
  valor      TEXT,
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO TAB_CONFIGURACAO (chave, valor) VALUES
  ('whatsapp', ''),
  ('instagram', ''),
  ('email_contato', ''),
  ('frete_valor_base', '20'),
  ('frete_gratis_acima_de', '300'),
  ('banner_texto_topo', '')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 003_tema_e_textos.sql
-- ============================================================

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

-- ============================================================
-- >>> 004_controle_migrations.sql
-- ============================================================

-- ============================================================
-- CONTROLE DE MIGRATIONS APLICADAS
-- Rode manualmente, como as demais migrations.
-- ============================================================

-- As migrations deste projeto são aplicadas manualmente, uma a uma, e não
-- existe histórico automático de "o que já rodou aqui". Esta tabela resolve
-- isso: toda migration a partir de agora termina com um INSERT se
-- auto-registrando. Descobrir o que falta rodar vira só "quais números
-- existem em migrations/ que não aparecem aqui" — ver consultar_migrations_aplicadas.sql.

CREATE TABLE IF NOT EXISTS _migracoes_aplicadas (
  versao       TEXT PRIMARY KEY,
  aplicada_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===== BACKFILL — registra as migrations que já existiam antes desta tabela =====
-- Idempotente: se já existir o registro, o ON CONFLICT ignora.

INSERT INTO _migracoes_aplicadas (versao)
SELECT '000' WHERE to_regclass('public.tab_produto') IS NOT NULL
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao)
SELECT '001' WHERE EXISTS (
  SELECT 1 FROM TAB_USUARIO_ADMIN WHERE email = 'admin@coisasbrasileiras.com'
)
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao)
SELECT '002' WHERE to_regclass('public.tab_banner') IS NOT NULL
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao)
SELECT '003' WHERE EXISTS (
  SELECT 1 FROM TAB_CONFIGURACAO WHERE chave = 'cor_primaria'
)
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('004')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 005_auditoria.sql
-- ============================================================

-- ============================================================
-- AUDITORIA — COISAS BRASILEIRAS
-- Registro de quem alterou o que, quando, nas telas de cadastro do admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_AUDITORIA (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID,
  usuario_nome   TEXT,
  tela           TEXT NOT NULL,
  acao           TEXT NOT NULL CHECK (acao IN ('cadastro','edicao','exclusao','inativacao','ativacao')),
  tabela         TEXT NOT NULL,
  registro_id    TEXT,
  dados_antes    JSONB,
  dados_depois   JSONB,
  ip             TEXT,
  user_agent     TEXT,
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON TAB_AUDITORIA (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON TAB_AUDITORIA (tabela);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('005')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 006_venda_balcao.sql
-- ============================================================

-- ============================================================
-- VENDA BALCAO — COISAS BRASILEIRAS
-- Permite que TAB_PEDIDO tambem represente vendas feitas no balcao pelo
-- admin, alem dos pedidos do site.
-- ============================================================

-- Distingue de onde veio o pedido. Pedidos existentes (todos do site ate
-- aqui) ficam marcados como 'site' pelo DEFAULT.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'site'
  CHECK (origem IN ('site','balcao'));

-- Venda balcao nao exige cliente com conta no site (login) nem endereco de
-- entrega - por isso os dois ficam opcionais. Pedidos do site continuam
-- sempre preenchendo os dois normalmente.
ALTER TABLE TAB_PEDIDO ALTER COLUMN cliente_id DROP NOT NULL;
ALTER TABLE TAB_PEDIDO ALTER COLUMN endereco_id DROP NOT NULL;

-- Cadastro rapido do balcao (nome/telefone) sem criar conta em TAB_CLIENTE -
-- usado quando o cliente nao tem cadastro e nao quer criar um.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS cliente_nome_avulso TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS cliente_telefone_avulso TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('006')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 007_financeiro.sql
-- ============================================================

-- ============================================================
-- FINANCEIRO — COISAS BRASILEIRAS
-- Contas a pagar/receber do dono da loja (fornecedores, boletos, despesas
-- fixas etc.) - nao confundir com TAB_PEDIDO, que ja e o financeiro de venda.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_CONTA (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         TEXT NOT NULL CHECK (tipo IN ('pagar','receber')),
  descricao    TEXT NOT NULL,
  valor        NUMERIC(10,2) NOT NULL,
  vencimento   DATE NOT NULL,
  pago         BOOLEAN NOT NULL DEFAULT false,
  pago_em      TIMESTAMP,
  categoria    TEXT,
  observacao   TEXT,
  criado_em    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conta_vencimento ON TAB_CONTA (vencimento);
CREATE INDEX IF NOT EXISTS idx_conta_pago ON TAB_CONTA (pago);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('007')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 008_frete_faixas.sql
-- ============================================================

-- ============================================================
-- FRETE POR FAIXA DE PESO E REGIAO — COISAS BRASILEIRAS
-- Substitui o frete de valor fixo por uma tabela configuravel pelo admin,
-- ate a loja ter contrato com os Correios (cartao de postagem) e o calculo
-- poder ser trocado pela cotacao real da API deles.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_FRETE_FAIXA (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regiao        TEXT NOT NULL CHECK (regiao IN ('norte','nordeste','centro_oeste','sudeste','sul')),
  peso_min_kg   NUMERIC(6,3) NOT NULL,
  peso_max_kg   NUMERIC(6,3) NOT NULL,
  valor         NUMERIC(10,2) NOT NULL,
  prazo_dias    INTEGER NOT NULL DEFAULT 7,
  criado_em     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (regiao, peso_min_kg, peso_max_kg)
);

CREATE INDEX IF NOT EXISTS idx_frete_faixa_regiao_peso ON TAB_FRETE_FAIXA (regiao, peso_min_kg, peso_max_kg);

-- Valores de partida (o admin ajusta depois em Configuracoes > Frete). A loja
-- e presumida como Sudeste - por isso o Sudeste comeca mais barato e o custo
-- sobe conforme a distancia tipica dos Correios para as demais regioes.
INSERT INTO TAB_FRETE_FAIXA (regiao, peso_min_kg, peso_max_kg, valor, prazo_dias) VALUES
  ('sudeste',      0, 1,  18.00,  4),
  ('sudeste',      1, 3,  25.00,  5),
  ('sudeste',      3, 5,  32.00,  6),
  ('sudeste',      5, 10, 45.00,  7),
  ('sudeste',      10, 30, 70.00, 8),

  ('sul',          0, 1,  22.00,  5),
  ('sul',          1, 3,  30.00,  6),
  ('sul',          3, 5,  38.00,  7),
  ('sul',          5, 10, 52.00,  8),
  ('sul',          10, 30, 80.00, 9),

  ('centro_oeste', 0, 1,  25.00,  6),
  ('centro_oeste', 1, 3,  34.00,  7),
  ('centro_oeste', 3, 5,  42.00,  8),
  ('centro_oeste', 5, 10, 58.00,  9),
  ('centro_oeste', 10, 30, 88.00, 10),

  ('nordeste',     0, 1,  30.00,  8),
  ('nordeste',     1, 3,  40.00,  9),
  ('nordeste',     3, 5,  50.00,  10),
  ('nordeste',     5, 10, 68.00,  11),
  ('nordeste',     10, 30, 100.00, 12),

  ('norte',        0, 1,  35.00,  10),
  ('norte',        1, 3,  48.00,  11),
  ('norte',        3, 5,  60.00,  12),
  ('norte',        5, 10, 82.00,  13),
  ('norte',        10, 30, 120.00, 14)
ON CONFLICT DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('008')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 009_gateway_pagamento.sql
-- ============================================================

-- ============================================================
-- GATEWAY DE PAGAMENTO — COISAS BRASILEIRAS
-- Cliente passa a poder escolher Mercado Pago ou PagBank no checkout do site.
-- Precisa saber qual gateway cada pedido usou pra: (1) o webhook certo saber
-- se aquele pedido e "dele", (2) conciliacao financeira.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS gateway_pagamento TEXT
  CHECK (gateway_pagamento IN ('mercadopago','pagbank'));

-- Pedidos existentes ate aqui foram todos via Mercado Pago (unico gateway ate
-- essa migration existir).
UPDATE TAB_PEDIDO SET gateway_pagamento = 'mercadopago'
WHERE gateway_pagamento IS NULL AND origem = 'site';

INSERT INTO _migracoes_aplicadas (versao) VALUES ('009')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 010_bling.sql
-- ============================================================

-- ============================================================
-- INTEGRACAO BLING (emissao de NF-e) — COISAS BRASILEIRAS
-- Escopo combinado com o cliente: SO emissao de nota fiscal a partir do
-- pedido, sem sincronizar estoque/financeiro com o Bling (isso continua
-- controlado so por este sistema).
-- ============================================================

-- Tabela isolada pros tokens OAuth do Bling - de proposito FORA de
-- TAB_CONFIGURACAO, porque o GET /api/admin/configuracoes devolve todas as
-- chaves de configuracao de uma vez (usado pela tela de Configuracoes do
-- admin); colocar segredo la correria o risco de vazar o token na resposta
-- daquele endpoint. So uma linha existe nesta tabela (a conexao da loja).
CREATE TABLE IF NOT EXISTS TAB_INTEGRACAO_BLING (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token   TEXT,
  refresh_token  TEXT,
  expira_em      TIMESTAMP,
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Guarda o resultado da emissao no proprio pedido - numero/id da nota no
-- Bling e os links de DANFE/PDF pro admin (e futuramente o cliente) acessar.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_nota_id TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_link_danfe TEXT;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_link_pdf TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('010')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 011_cliente_balcao.sql
-- ============================================================

-- ============================================================
-- CLIENTE DE BALCAO — COISAS BRASILEIRAS
-- Permite cadastrar clientes direto pelo admin (contatos de balcao) sem
-- exigir e-mail e senha - esses so eram obrigatorios porque a tabela foi
-- criada pensando no cliente que se cadastra e faz login no site.
--
-- Clientes cadastrados pelo admin ficam sem e-mail/senha e simplesmente nao
-- conseguem logar no site (o que e o correto - sao so contatos de balcao).
-- Clientes que se cadastram no site continuam preenchendo e-mail e senha
-- normalmente. O indice UNIQUE de e-mail continua valendo (no Postgres,
-- multiplos NULL sao permitidos num indice UNIQUE).
-- ============================================================

ALTER TABLE TAB_CLIENTE ALTER COLUMN email DROP NOT NULL;
ALTER TABLE TAB_CLIENTE ALTER COLUMN senha_hash DROP NOT NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('011')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 012_tipos_entrega.sql
-- ============================================================

-- ============================================================
-- TIPOS DE ENTREGA — COISAS BRASILEIRAS
-- Usado na venda balcao: quando a venda vem por outro canal (ex: WhatsApp) e
-- tem alguma forma de entrega (retirada na loja, motoboy, etc), a operadora
-- escolhe o tipo de entrega ao finalizar. Cadastro simples e ativavel.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_TIPO_ENTREGA (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL UNIQUE,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  criado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Vinculo opcional no pedido. ON DELETE SET NULL: apagar um tipo de entrega
-- nao apaga os pedidos que o usaram, so desvincula.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS tipo_entrega_id UUID
  REFERENCES TAB_TIPO_ENTREGA(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pedido_tipo_entrega ON TAB_PEDIDO (tipo_entrega_id);

-- Alguns tipos comuns pra ja comecar (a operadora ajusta em Configuracoes).
INSERT INTO TAB_TIPO_ENTREGA (nome) VALUES
  ('Retirada na loja'),
  ('Entrega local (motoboy)'),
  ('Correios')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('012')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 013_orcamentos.sql
-- ============================================================

-- ============================================================
-- ORCAMENTOS — COISAS BRASILEIRAS
-- Documento de cotacao pro cliente decidir antes de fechar a compra - nao
-- baixa estoque nem gera pedido sozinho. Quando aprovado, o admin converte
-- o orcamento numa venda (mesmo caminho da venda balcao: baixa estoque,
-- gera TAB_PEDIDO com origem 'balcao').
--
-- Escopo v1 (mais simples que o InMenteGestao de proposito): sem assinatura
-- digital (exigiria upload de imagem) e sem link publico de aprovacao por
-- e-mail/WhatsApp (exigiria pagina publica + token + envio de e-mail) - o
-- admin marca aprovado/recusado manualmente por enquanto. Da pra evoluir
-- depois se for necessario.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS orcamento_numero_seq;

CREATE TABLE IF NOT EXISTS TAB_ORCAMENTO (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                  INTEGER NOT NULL DEFAULT nextval('orcamento_numero_seq'),
  titulo                  TEXT,
  cliente_id              UUID REFERENCES TAB_CLIENTE(id) ON DELETE SET NULL,
  -- Nome/telefone sempre preenchidos (mesmo com cliente_id), pra o orcamento
  -- continuar legivel mesmo se o cadastro do cliente for excluido depois -
  -- mesmo principio ja usado em TAB_PEDIDO.cliente_nome_avulso.
  cliente_nome            TEXT NOT NULL,
  cliente_telefone        TEXT,
  condicoes               TEXT,
  status                  TEXT NOT NULL DEFAULT 'aberto'
                            CHECK (status IN ('aberto','aprovado','recusado','convertido')),
  subtotal                NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto                NUMERIC(10,2) NOT NULL DEFAULT 0,
  total                   NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Preenchido so quando o orcamento vira venda de verdade (status convertido).
  pedido_id               UUID REFERENCES TAB_PEDIDO(id) ON DELETE SET NULL,
  criado_em               TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_ORCAMENTO_ITEM (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id    UUID NOT NULL REFERENCES TAB_ORCAMENTO(id) ON DELETE CASCADE,
  -- Opcional: item pode ser um produto do catalogo (baixa estoque na
  -- conversao) ou so uma descricao livre (ex: "instalacao", servico avulso -
  -- nao baixa estoque, nao entra na conversao em pedido).
  produto_id      UUID REFERENCES TAB_PRODUTO(id) ON DELETE SET NULL,
  descricao       TEXT NOT NULL,
  quantidade      NUMERIC(10,2) NOT NULL,
  valor_unitario  NUMERIC(10,2) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orcamento_item_orcamento ON TAB_ORCAMENTO_ITEM (orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_cliente ON TAB_ORCAMENTO (cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_status ON TAB_ORCAMENTO (status);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('013')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 014_cliente_inativo.sql
-- ============================================================

-- ============================================================
-- CLIENTE ATIVO/INATIVO — COISAS BRASILEIRAS
-- Inativar um cliente nunca apaga o cadastro nem o historico de pedidos - so
-- impede login/checkout no site (cliente inativo nao consegue mais comprar
-- online) e marca visualmente no admin. Mesmo padrao ja usado em produtos.
-- ============================================================

ALTER TABLE TAB_CLIENTE ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('014')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 015_usuario_login_e_ultimo_acesso.sql
-- ============================================================

-- ============================================================
-- LOGIN POR USUARIO + ULTIMO ACESSO — COISAS BRASILEIRAS
-- Mesma regra do InMenteGestao: cada usuario do admin pode ter um "usuario"
-- de login curto (opcional - se nao definir, continua entrando com o
-- e-mail completo), e o sistema registra quando foi o ultimo acesso.
-- ============================================================

ALTER TABLE TAB_USUARIO_ADMIN ADD COLUMN IF NOT EXISTS usuario TEXT;
ALTER TABLE TAB_USUARIO_ADMIN ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP;

-- Unico so entre quem tem "usuario" preenchido - varios usuarios podem ficar
-- sem "usuario" definido (entram so pelo e-mail) sem conflitar entre si.
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_admin_usuario
  ON TAB_USUARIO_ADMIN (usuario) WHERE usuario IS NOT NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('015')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 016_categoria_imagem.sql
-- ============================================================

-- ============================================================
-- IMAGEM POR CATEGORIA — COISAS BRASILEIRAS
-- Permite que cada categoria tenha uma foto ilustrativa, exibida na
-- grade de categorias da home (antes era so icone generico).
-- ============================================================

ALTER TABLE TAB_CATEGORIA ADD COLUMN IF NOT EXISTS imagem_url TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('016')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 017_feedbacks.sql
-- ============================================================

-- ============================================================
-- CARDS DE FEEDBACK/DEPOIMENTO — COISAS BRASILEIRAS
-- Depoimentos de clientes exibidos na home, geridos pelo admin
-- (imagem, nome, texto, nota de 1 a 5 estrelas).
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_FEEDBACK (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  texto       TEXT NOT NULL,
  imagem_url  TEXT,
  nota        SMALLINT NOT NULL DEFAULT 5 CHECK (nota BETWEEN 1 AND 5),
  ordem       INTEGER NOT NULL DEFAULT 0,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_ativo_ordem ON TAB_FEEDBACK (ativo, ordem);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('017')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 018_canal_venda.sql
-- ============================================================

-- ============================================================
-- CANAL DE VENDA — COISAS BRASILEIRAS
-- Mesmo padrao do in-mente-gestao: coluna simples com CHECK, sem tabela
-- de cadastro separada (canais fixos, nao configuraveis pelo admin).
-- Complementa TAB_PEDIDO.origem (site/balcao, macro) com um detalhe mais
-- fino de onde a venda de fato aconteceu.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS canal TEXT;

ALTER TABLE TAB_PEDIDO DROP CONSTRAINT IF EXISTS tab_pedido_canal_check;
ALTER TABLE TAB_PEDIDO ADD CONSTRAINT tab_pedido_canal_check
  CHECK (canal IS NULL OR canal IN ('site', 'whatsapp', 'instagram', 'balcao'));

-- Backfill: pedidos existentes ganham um canal coerente com a origem que ja tinham.
UPDATE TAB_PEDIDO SET canal = 'site' WHERE origem = 'site' AND canal IS NULL;
UPDATE TAB_PEDIDO SET canal = 'balcao' WHERE origem = 'balcao' AND canal IS NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('018')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 019_subcategorias.sql
-- ============================================================

-- ============================================================
-- SUBCATEGORIAS — COISAS BRASILEIRAS
-- Subcategoria = uma categoria comum com uma categoria pai (auto-relacionamento
-- em TAB_CATEGORIA), sem criar tabela nova. Categoria sem pai = categoria
-- principal, aparece no menu do site; com pai = subcategoria.
-- ============================================================

ALTER TABLE TAB_CATEGORIA ADD COLUMN IF NOT EXISTS categoria_pai_id UUID REFERENCES TAB_CATEGORIA(id) ON DELETE SET NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('019')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 020_fornecedores_compras.sql
-- ============================================================

-- ============================================================
-- FORNECEDORES E COMPRAS — COISAS BRASILEIRAS
-- Base do custo real do produto (pre-requisito do relatorio de lucro
-- liquido): cadastro de fornecedor + entrada de compra manual, que atualiza
-- o custo medio ponderado e da alta no estoque do produto ao ser recebida.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_FORNECEDOR (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social   TEXT NOT NULL,
  nome_fantasia  TEXT,
  cnpj_cpf       TEXT,
  telefone       TEXT,
  email          TEXT,
  cep            TEXT,
  logradouro     TEXT,
  numero         TEXT,
  complemento    TEXT,
  bairro         TEXT,
  cidade         TEXT,
  estado         TEXT,
  observacao     TEXT,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Custo medio ponderado atual do produto - usado no relatorio de lucro
-- (preco - custo). Comeca zerado; so passa a refletir a realidade a partir
-- da primeira compra recebida.
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS custo NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS TAB_COMPRA (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id  UUID NOT NULL REFERENCES TAB_FORNECEDOR(id),
  numero_nota    TEXT,
  status         TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','recebida','cancelada')),
  valor_frete    NUMERIC(10,2) NOT NULL DEFAULT 0,
  data_compra    DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao     TEXT,
  -- Conta a pagar gerada automaticamente quando a compra e recebida (ver
  -- lib/compras.ts) - referencia null enquanto pendente/cancelada.
  conta_id       UUID REFERENCES TAB_CONTA(id),
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_COMPRA_ITEM (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id       UUID NOT NULL REFERENCES TAB_COMPRA(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES TAB_PRODUTO(id),
  quantidade      INTEGER NOT NULL CHECK (quantidade > 0),
  custo_unitario  NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compra_fornecedor ON TAB_COMPRA (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_compra_status ON TAB_COMPRA (status);
CREATE INDEX IF NOT EXISTS idx_compra_item_compra ON TAB_COMPRA_ITEM (compra_id);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('020')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 021_bling_cancelamento.sql
-- ============================================================

-- ============================================================
-- CANCELAMENTO DE NF-E (BLING) — COISAS BRASILEIRAS
-- Fecha a lacuna do fluxo Bling: hoje so tinha emissao, sem jeito de cancelar
-- uma nota emitida por engano nem de emitir uma nova depois do cancelamento.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_nota_cancelada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('021')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 022_produto_ncm.sql
-- ============================================================

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

-- ============================================================
-- >>> 023_clube_assinatura.sql
-- ============================================================

-- ============================================================
-- CLUBE DE ASSINATURA — COISAS BRASILEIRAS
-- Cliente com assinatura mensal ativa (cobranca recorrente via Mercado Pago
-- PreApproval) ve preco especial em produtos marcados como participantes.
-- ============================================================

-- Preco exclusivo do clube - NULL significa que o produto nao participa.
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS preco_clube NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS TAB_ASSINATURA_CLUBE (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id          UUID NOT NULL REFERENCES TAB_CLIENTE(id),
  mp_preapproval_id   TEXT UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente','autorizada','pausada','cancelada')),
  valor_mensalidade   NUMERIC(10,2) NOT NULL,
  proximo_vencimento  DATE,
  criado_em           TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sem UNIQUE em cliente_id de proposito - cliente pode cancelar e assinar de
-- novo depois, o historico fica preservado (pega sempre a mais recente por
-- criado_em nas consultas).
CREATE INDEX IF NOT EXISTS idx_assinatura_cliente ON TAB_ASSINATURA_CLUBE (cliente_id);
CREATE INDEX IF NOT EXISTS idx_assinatura_status ON TAB_ASSINATURA_CLUBE (status);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('023')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 024_codigo_barras.sql
-- ============================================================

-- ============================================================
-- CODIGO DE BARRAS (GTIN/EAN) DO PRODUTO — COISAS BRASILEIRAS
-- Usado em tres lugares: leitor no PDV da Venda Balcao, campo "gtin" na
-- emissao de NF-e (Bling), e match de item na importacao de XML de compra.
-- ============================================================

ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS codigo_barras TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('024')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 025_compra_bling_nota.sql
-- ============================================================

-- ============================================================
-- VINCULO COMPRA <-> NOTA DE ENTRADA DO BLING — COISAS BRASILEIRAS
-- Permite o painel "Notas do Bling" (Compras) saber quais notas de entrada
-- ja foram lancadas no nosso sistema (viraram uma TAB_COMPRA) e quais ainda
-- estao pendentes - cruzamento local, nao mexe em nada do lado do Bling.
-- ============================================================

ALTER TABLE TAB_COMPRA ADD COLUMN IF NOT EXISTS bling_nota_id TEXT UNIQUE;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('025')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 026_avaliacoes_produto.sql
-- ============================================================

-- ============================================================
-- AVALIACOES DE PRODUTO — COISAS BRASILEIRAS
-- Diferente de TAB_FEEDBACK (depoimentos curados pelo admin pra home) - aqui
-- e o cliente que avalia um produto especifico que comprou (compra
-- verificada), passa por aprovacao do admin antes de aparecer no site.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_AVALIACAO_PRODUTO (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id  UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  cliente_id  UUID NOT NULL REFERENCES TAB_CLIENTE(id),
  nota        SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario  TEXT,
  aprovado    BOOLEAN NOT NULL DEFAULT false,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (produto_id, cliente_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_produto ON TAB_AVALIACAO_PRODUTO (produto_id, aprovado);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('026')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 027_notificacao_estoque.sql
-- ============================================================

-- ============================================================
-- NOTIFICACAO "VOLTOU AO ESTOQUE" — COISAS BRASILEIRAS
-- Visitante deixa o e-mail num produto esgotado; quando o estoque volta a
-- ficar positivo (compra recebida, ajuste manual etc.), avisa automaticamente.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_NOTIFICACAO_ESTOQUE (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id     UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  notificado_em  TIMESTAMP,
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (produto_id, email)
);

CREATE INDEX IF NOT EXISTS idx_notificacao_estoque_pendente
  ON TAB_NOTIFICACAO_ESTOQUE (produto_id) WHERE notificado_em IS NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('027')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 028_lista_desejos.sql
-- ============================================================

-- ============================================================
-- LISTA DE DESEJOS — COISAS BRASILEIRAS
-- Cliente favorita um produto sem comprar ainda, pra ver depois em Minha Conta.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_LISTA_DESEJOS (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES TAB_CLIENTE(id) ON DELETE CASCADE,
  produto_id  UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,
  criado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (cliente_id, produto_id)
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('028')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 029_compra_vencimento_fornecedor_ie.sql
-- ============================================================

-- ============================================================
-- CAMPOS FALTANTES: VENCIMENTO DA COMPRA E IE DO FORNECEDOR
-- Achados numa revisao pedida pelo usuario: a conta a pagar gerada ao
-- receber uma compra usava a DATA DA COMPRA como vencimento (sem prazo de
-- pagamento real) - agora tem um campo proprio. Fornecedor tambem nao tinha
-- Inscricao Estadual, comum em cadastro B2B.
-- ============================================================

ALTER TABLE TAB_COMPRA ADD COLUMN IF NOT EXISTS data_vencimento DATE;
ALTER TABLE TAB_FORNECEDOR ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('029')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 030_integracao_segredos.sql
-- ============================================================

-- ============================================================
-- SEGREDOS DE INTEGRACAO CONFIGURAVEIS PELO ADMIN — COISAS BRASILEIRAS
-- Frenet, Mercado Pago e Email (Gmail) deixam de depender so de variavel de
-- ambiente - o admin pode configurar/trocar direto pelo sistema, sem precisar
-- de acesso ao painel de hospedagem. Tabela ISOLADA da TAB_CONFIGURACAO de
-- proposito (mesmo motivo do TAB_INTEGRACAO_BLING): o endpoint que devolve
-- as configuracoes gerais nao pode vazar segredo nenhum.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_INTEGRACAO_SEGREDO (
  chave          TEXT PRIMARY KEY,
  valor          TEXT,
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('030')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 031_bling_ultimo_erro.sql
-- ============================================================

-- ============================================================
-- ULTIMO ERRO DO BLING — COISAS BRASILEIRAS
-- Guarda a mensagem do ultimo erro de emissao/cancelamento de NF-e (ex:
-- certificado digital nao configurado), pra aparecer num painel de
-- "pendencias fiscais" em Configuracoes > Bling - sem o contador precisar
-- entrar no site do Bling so pra descobrir que algo falhou.
-- ============================================================

ALTER TABLE TAB_INTEGRACAO_BLING ADD COLUMN IF NOT EXISTS ultimo_erro TEXT;
ALTER TABLE TAB_INTEGRACAO_BLING ADD COLUMN IF NOT EXISTS ultimo_erro_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('031')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 032_bling_nota_notificada.sql
-- ============================================================

-- ============================================================
-- CONTROLE DE NOTIFICACAO DE NOTAS PENDENTES DO BLING — COISAS BRASILEIRAS
-- Marca quais notas de entrada (fornecedor) ja geraram um e-mail de aviso
-- pro admin, pra nao notificar a mesma nota pendente todo dia - o job
-- verifica periodicamente e so avisa sobre nota nova.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_BLING_NOTA_NOTIFICADA (
  bling_nota_id  TEXT PRIMARY KEY,
  notificado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('032')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 033_bling_notas_pendentes_count.sql
-- ============================================================

-- ============================================================
-- CONTADOR DE NOTAS PENDENTES DO BLING — COISAS BRASILEIRAS
-- Atualizado pelo cron (app/api/cron/notas-bling-pendentes), lido pelo
-- badge no menu do admin - evita bater na API do Bling toda vez que alguem
-- abre o painel, so uma leitura de banco.
-- ============================================================

ALTER TABLE TAB_INTEGRACAO_BLING ADD COLUMN IF NOT EXISTS notas_pendentes INTEGER NOT NULL DEFAULT 0;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('033')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 034_sobre_nos_midia.sql
-- ============================================================

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

-- ============================================================
-- >>> 035_dedup_endereco_pedido.sql
-- ============================================================

-- ============================================================
-- LIMPEZA E PREVENCAO DE DUPLICATAS EM ENDERECO E PEDIDO
-- Corrige duplicatas ja existentes em "Minha Conta" (enderecos repetidos e
-- pedidos "aguardando pagamento" repetidos gerados por reenvio do checkout)
-- e fecha a janela de corrida que ainda permitia duplicar endereco.
-- ============================================================

-- Reaponta pedidos que ficaram em enderecos duplicados para uma unica copia
-- canonica do mesmo grupo (TAB_ENDERECO nao tem coluna de data de criacao,
-- entao o desempate e so por id, de forma deterministica), antes de apagar
-- as copias. Da preferencia ao endereco marcado como "principal", se houver.
-- Isso roda ANTES da deduplicacao de pedidos, senao pedidos identicos que
-- apontam pra copias diferentes de endereco nao seriam agrupados como
-- duplicados no passo seguinte.
WITH grupos AS (
  SELECT
    id,
    cliente_id,
    FIRST_VALUE(id) OVER (
      PARTITION BY cliente_id, cep, numero, COALESCE(complemento, '')
      ORDER BY principal DESC, id ASC
    ) AS id_canonico
  FROM TAB_ENDERECO
)
UPDATE TAB_PEDIDO p
SET endereco_id = g.id_canonico
FROM grupos g
WHERE p.endereco_id = g.id AND p.endereco_id <> g.id_canonico;

-- Remove as copias de endereco que sobraram sem referencia.
WITH grupos AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY cliente_id, cep, numero, COALESCE(complemento, '')
      ORDER BY principal DESC, id ASC
    ) AS id_canonico
  FROM TAB_ENDERECO
)
DELETE FROM TAB_ENDERECO e
USING grupos g
WHERE e.id = g.id AND e.id <> g.id_canonico;

-- Cancela pedidos "aguardando_pagamento" duplicados (mesmo cliente, mesmo
-- endereco ja canonico, mesmo total), mantendo so o mais recente de cada
-- grupo. Pedidos ja pagos/enviados nao sao tocados.
WITH duplicados AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY cliente_id, endereco_id, total
      ORDER BY criado_em DESC
    ) AS posicao
  FROM TAB_PEDIDO
  WHERE status = 'aguardando_pagamento'
)
UPDATE TAB_PEDIDO
SET status = 'cancelado'
WHERE id IN (SELECT id FROM duplicados WHERE posicao > 1);

-- Fecha a janela de corrida: mesmo que dois checkouts simultaneos passem
-- pelo SELECT de reaproveitamento ao mesmo tempo, o banco agora impede
-- duas linhas identicas para o mesmo cliente.
CREATE UNIQUE INDEX IF NOT EXISTS idx_endereco_dedup
  ON TAB_ENDERECO (cliente_id, cep, numero, COALESCE(complemento, ''));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('035')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 036_pedidos_marketplace.sql
-- ============================================================

-- ============================================================
-- PEDIDOS MARKETPLACE (Mercado Livre / Shopee via Bling) — COISAS BRASILEIRAS
-- Extende o canal de venda e adiciona o necessario pra importar pedidos que
-- chegam pelo Bling (conectado a Mercado Livre e Shopee) como TAB_PEDIDO de
-- verdade aqui, com dedup e fila de pendencias pra item sem produto local.
-- ============================================================

ALTER TABLE TAB_PEDIDO DROP CONSTRAINT IF EXISTS tab_pedido_canal_check;
ALTER TABLE TAB_PEDIDO ADD CONSTRAINT tab_pedido_canal_check
  CHECK (canal IS NULL OR canal IN ('site', 'whatsapp', 'instagram', 'balcao', 'mercadolivre', 'shopee'));

-- Id do pedido de venda no Bling - evita importar o mesmo pedido 2 vezes
-- quando o cron/importacao manual roda de novo.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_pedido_id TEXT UNIQUE;

-- Pedido do marketplace cujo item nao bateu com nenhum produto local (SKU ou
-- codigo de barras) fica aqui em vez de ser importado incompleto. Some quando
-- o admin resolve o cadastro e descarta a pendencia manualmente.
CREATE TABLE IF NOT EXISTS TAB_BLING_PEDIDO_PENDENTE (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bling_pedido_id TEXT NOT NULL UNIQUE,
  canal           TEXT NOT NULL,
  motivo          TEXT NOT NULL,
  detectado_em    TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('036')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 037_nfe_envio_status.sql
-- ============================================================

-- ============================================================
-- STATUS DE ENVIO DA NF-E — COISAS BRASILEIRAS
-- Ja existia rastreio de "emitida" (bling_nota_id). Adiciona rastreio de
-- envio por e-mail (automatico, gravado so quando o envio realmente da
-- certo) e por WhatsApp (marcacao manual do admin - o sistema nao tem como
-- confirmar entrega de verdade sem integrar com WhatsApp Business API).
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS bling_nota_email_enviada_em TIMESTAMP;
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS nota_fiscal_whatsapp_enviada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('037')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 038_preco_clube_percentual.sql
-- ============================================================

-- ============================================================
-- PRECO DO CLUBE POR PERCENTUAL — COISAS BRASILEIRAS
-- Alem de valor fixo em R$, o preco do clube por produto agora pode ser
-- cadastrado como percentual de desconto sobre o preco normal do produto.
-- ============================================================

-- "fixo": preco_clube guarda o preco final em R$ (comportamento atual).
-- "percentual": preco_clube guarda o percentual de desconto (0-100) sobre
-- TAB_PRODUTO.preco - o valor final e calculado na hora de exibir/vender.
ALTER TABLE TAB_PRODUTO ADD COLUMN IF NOT EXISTS preco_clube_tipo TEXT NOT NULL DEFAULT 'fixo'
  CHECK (preco_clube_tipo IN ('fixo', 'percentual'));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('038')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 039_orcamento_aprovacao_publica.sql
-- ============================================================

-- ============================================================
-- APROVACAO PUBLICA DE ORCAMENTO POR LINK (WHATSAPP/E-MAIL)
-- Evolui o orcamento (v1 era so aprovacao manual pelo admin, ver
-- migrations/013_orcamentos.sql) pra ter um link publico que o cliente
-- recebe por WhatsApp (link wa.me manual, sem API paga) ou e-mail e usa
-- pra aprovar/recusar sozinho - a decisao atualiza o status na hora, sem
-- o admin precisar fazer nada.
-- ============================================================

ALTER TABLE TAB_ORCAMENTO
  ADD COLUMN IF NOT EXISTS token_aprovacao UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS cliente_email TEXT,
  ADD COLUMN IF NOT EXISTS canal_resposta TEXT CHECK (canal_resposta IN ('email', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS observacao_cliente TEXT,
  ADD COLUMN IF NOT EXISTS enviado_email_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS respondido_em TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orcamento_token_aprovacao ON TAB_ORCAMENTO (token_aprovacao);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('039')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 040_pedido_situacao_nfe.sql
-- ============================================================

-- ============================================================
-- SITUACAO DETALHADA DA NF-E (BLING)
-- Ate aqui so sabiamos "emitida" ou "cancelada" (ver bling_nota_cancelada_em).
-- Guarda o codigo de situacao que o Bling devolve (mesma tabela de codigos
-- ja usada em Compras > Notas do Bling: autorizada, rejeitada, denegada,
-- aguardando protocolo etc) pra mostrar na tela do pedido sem precisar
-- abrir o Bling pra saber por que uma nota travou.
-- ============================================================

ALTER TABLE TAB_PEDIDO
  ADD COLUMN IF NOT EXISTS bling_nota_situacao INTEGER,
  ADD COLUMN IF NOT EXISTS bling_nota_situacao_atualizada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('040')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 041_pedido_compra.sql
-- ============================================================

-- ============================================================
-- PEDIDO DE COMPRA — COISAS BRASILEIRAS
-- Documento que a loja manda pro FORNECEDOR solicitando itens, antes da
-- mercadoria chegar - diferente de TAB_COMPRA (Entrada de NF), que registra
-- a compra DEPOIS que ela chegou (da alta no estoque). Mesmo espirito do
-- orcamento (migrations/013_orcamentos.sql e 039_orcamento_aprovacao_publica.sql),
-- so que aqui quem recebe e decide e o fornecedor, nao o cliente - por isso
-- fica so no envio por e-mail, sem link de aprovacao publica.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS pedido_compra_numero_seq;

CREATE TABLE IF NOT EXISTS TAB_PEDIDO_COMPRA (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero            INTEGER NOT NULL DEFAULT nextval('pedido_compra_numero_seq'),
  fornecedor_id     UUID NOT NULL REFERENCES TAB_FORNECEDOR(id),
  status            TEXT NOT NULL DEFAULT 'aberto'
                      CHECK (status IN ('aberto', 'enviado', 'atendido', 'cancelado')),
  observacao        TEXT,
  valor_total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  enviado_email_em  TIMESTAMP,
  criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS TAB_PEDIDO_COMPRA_ITEM (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_compra_id  UUID NOT NULL REFERENCES TAB_PEDIDO_COMPRA(id) ON DELETE CASCADE,
  -- Opcional (igual TAB_ORCAMENTO_ITEM): pode pedir algo fora do catalogo.
  produto_id        UUID REFERENCES TAB_PRODUTO(id) ON DELETE SET NULL,
  descricao         TEXT NOT NULL,
  quantidade        NUMERIC(10,2) NOT NULL,
  custo_unitario    NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pedido_compra_item_pedido ON TAB_PEDIDO_COMPRA_ITEM (pedido_compra_id);
CREATE INDEX IF NOT EXISTS idx_pedido_compra_fornecedor ON TAB_PEDIDO_COMPRA (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_pedido_compra_status ON TAB_PEDIDO_COMPRA (status);

-- Rastreia de qual pedido de compra uma entrada (TAB_COMPRA) veio, pra dar
-- pra pre-preencher a Entrada de NF com os mesmos itens/fornecedor e marcar
-- o pedido de compra como "atendido" automaticamente.
ALTER TABLE TAB_COMPRA
  ADD COLUMN IF NOT EXISTS pedido_compra_id UUID REFERENCES TAB_PEDIDO_COMPRA(id) ON DELETE SET NULL;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('041')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 042_cotacao.sql
-- ============================================================

-- ============================================================
-- COTACAO — COISAS BRASILEIRAS
-- Etapa ANTES do Pedido de Compra (migrations/041_pedido_compra.sql): a loja
-- pede uma cotacao ao fornecedor (so os itens/quantidades desejadas, sem
-- preco), o fornecedor responde por um link publico informando quanto
-- consegue entregar de cada item e por qual preco, e so entao o admin aceita
-- a cotacao - o que gera um Pedido de Compra automaticamente com os valores
-- que o fornecedor informou. Mesmo espirito do link publico de orcamento
-- (migrations/039_orcamento_aprovacao_publica.sql), com os papeis invertidos:
-- aqui quem "aprova" preenchendo valores e o fornecedor, nao o cliente.
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS cotacao_numero_seq;

CREATE TABLE IF NOT EXISTS TAB_COTACAO (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero            INTEGER NOT NULL DEFAULT nextval('cotacao_numero_seq'),
  fornecedor_id     UUID NOT NULL REFERENCES TAB_FORNECEDOR(id),
  status            TEXT NOT NULL DEFAULT 'aberto'
                      CHECK (status IN ('aberto', 'enviado', 'respondida', 'aceita', 'recusada', 'cancelada')),
  observacao        TEXT,
  -- Preenchido pelo fornecedor junto com os precos, no link publico -
  -- desconto total sobre a soma dos itens cotados (ex: fechou o pedido
  -- inteiro e deu uma condicao especial).
  desconto          NUMERIC(10,2) NOT NULL DEFAULT 0,
  token_resposta    UUID NOT NULL DEFAULT gen_random_uuid(),
  enviado_email_em  TIMESTAMP,
  respondido_em     TIMESTAMP,
  -- Preenchido so quando a cotacao vira pedido de compra de verdade.
  pedido_compra_id  UUID REFERENCES TAB_PEDIDO_COMPRA(id) ON DELETE SET NULL,
  criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cotacao_token_resposta ON TAB_COTACAO (token_resposta);
CREATE INDEX IF NOT EXISTS idx_cotacao_fornecedor ON TAB_COTACAO (fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_cotacao_status ON TAB_COTACAO (status);

CREATE TABLE IF NOT EXISTS TAB_COTACAO_ITEM (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id              UUID NOT NULL REFERENCES TAB_COTACAO(id) ON DELETE CASCADE,
  -- Opcional (igual TAB_ORCAMENTO_ITEM/TAB_PEDIDO_COMPRA_ITEM).
  produto_id              UUID REFERENCES TAB_PRODUTO(id) ON DELETE SET NULL,
  descricao               TEXT NOT NULL,
  quantidade_solicitada   NUMERIC(10,2) NOT NULL,
  -- Preenchidos so quando o fornecedor responde - nulo enquanto aberto/enviado.
  quantidade_cotada       NUMERIC(10,2),
  valor_unitario_cotado   NUMERIC(10,2)
);

CREATE INDEX IF NOT EXISTS idx_cotacao_item_cotacao ON TAB_COTACAO_ITEM (cotacao_id);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('042')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 043_pedido_compra_desconto.sql
-- ============================================================

-- ============================================================
-- DESCONTO NO PEDIDO DE COMPRA
-- Quando um Pedido de Compra e gerado a partir de uma Cotacao aceita (ver
-- migrations/042_cotacao.sql), o desconto que o fornecedor deu na cotacao
-- precisa aparecer aqui tambem - valor_total ja sai com o desconto
-- descontado, esse campo e so pra manter o registro de quanto foi.
-- ============================================================

ALTER TABLE TAB_PEDIDO_COMPRA
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) NOT NULL DEFAULT 0;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('043')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 044_compra_chave_acesso.sql
-- ============================================================

-- ============================================================
-- CHAVE DE ACESSO NA ENTRADA DE NF — COISAS BRASILEIRAS
-- O XML importado (lib/nfe-xml.ts) ja extrai e valida a chave de acesso da
-- NF-e, mas ela nunca era gravada - ficava so na validacao da hora do
-- upload. Guarda pra ficar visivel na listagem/detalhe da compra depois.
-- Nota manual (sem XML) nao tem chave obrigatoria, por isso fica nullable.
-- ============================================================

ALTER TABLE TAB_COMPRA ADD COLUMN IF NOT EXISTS chave_acesso TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('044')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 045_habilitar_rls.sql
-- ============================================================

-- ============================================================
-- HABILITAR RLS EM TODAS AS TABELAS — COISAS BRASILEIRAS
-- O app conecta direto no Postgres com o usuario "postgres" (dono das
-- tabelas), que ignora RLS por padrao - entao habilitar aqui nao muda
-- nada pro site/admin. O que isso corrige e a exposicao das tabelas pela
-- API REST/GraphQL automatica do Supabase: sem RLS, qualquer tabela do
-- schema public fica acessivel por ali. Nao criamos nenhuma policy de
-- proposito - isso bloqueia totalmente o acesso anonimo/autenticado via
-- API do Supabase, que este projeto nao usa.
-- ============================================================

ALTER TABLE _MIGRACOES_APLICADAS ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_ASSINATURA_CLUBE ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_AUDITORIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_AVALIACAO_PRODUTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_BANNER ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_BLING_NOTA_NOTIFICADA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_BLING_PEDIDO_PENDENTE ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_CATEGORIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_CLIENTE ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_COMPRA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_COMPRA_ITEM ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_CONFIGURACAO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_CONTA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_COTACAO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_COTACAO_ITEM ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_CUPOM ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_ENDERECO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_FEEDBACK ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_FORNECEDOR ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_FRETE_FAIXA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_INTEGRACAO_BLING ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_INTEGRACAO_SEGREDO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_LISTA_DESEJOS ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_NOTIFICACAO_ESTOQUE ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_ORCAMENTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_ORCAMENTO_ITEM ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_PEDIDO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_PEDIDO_COMPRA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_PEDIDO_COMPRA_ITEM ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_PEDIDO_ITEM ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_PRODUTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_PRODUTO_CATEGORIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_PRODUTO_IMAGEM ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_SOBRE_NOS_MIDIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_TIPO_ENTREGA ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_USUARIO_ADMIN ENABLE ROW LEVEL SECURITY;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('045')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 046_marca.sql
-- ============================================================

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

-- ============================================================
-- >>> 047_marca_feedback_orcamento.sql
-- ============================================================

-- ============================================================
-- MARCA EM FEEDBACK E ORCAMENTO — completa a separacao iniciada em 046.
-- Depoimentos e orcamentos nao tinham coluna marca; feedbacks aparecem na
-- home publica sem filtro (vazamento entre os dois sites) e orcamentos
-- ficavam sem atribuicao de marca no admin, diferente de TAB_PEDIDO.
-- ============================================================

ALTER TABLE TAB_FEEDBACK ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_FEEDBACK DROP CONSTRAINT IF EXISTS tab_feedback_marca_check;
ALTER TABLE TAB_FEEDBACK ADD CONSTRAINT tab_feedback_marca_check
  CHECK (marca IN ('colorido', 'branco'));

ALTER TABLE TAB_ORCAMENTO ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_ORCAMENTO DROP CONSTRAINT IF EXISTS tab_orcamento_marca_check;
ALTER TABLE TAB_ORCAMENTO ADD CONSTRAINT tab_orcamento_marca_check
  CHECK (marca IN ('colorido', 'branco'));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('047')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 048_rls_policy_deny_all.sql
-- ============================================================

-- ============================================================
-- RLS SEM POLICY — fecha o aviso "Info" do Security Advisor do Supabase.
-- RLS habilitado sem nenhuma policy ja bloqueia por padrao qualquer acesso
-- via anon/authenticated (PostgREST) - a app nunca usou esse caminho, sempre
-- conectou direto via DATABASE_URL (role com bypassrls), entao isso nunca
-- afetou o funcionamento. Essa migration so torna o bloqueio explicito com
-- uma policy "deny all", pra documentar a intencao e o advisor parar de
-- listar como pendente.
-- ============================================================

-- So existe no projeto Supabase (producao) - o Postgres local de dev nao tem
-- essas roles, entao a migration inteira e pulada ali sem erro.
DO $$
DECLARE
  tabela TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'Roles anon/authenticated nao existem (fora do Supabase) - pulando migration 048.';
    RETURN;
  END IF;

  FOREACH tabela IN ARRAY ARRAY[
    '_migracoes_aplicadas', 'TAB_ASSINATURA_CLUBE', 'TAB_AUDITORIA',
    'TAB_AVALIACAO_PRODUTO', 'TAB_BANNER', 'TAB_BLING_NOTA_NOTIFICADA',
    'TAB_BLING_PEDIDO_PENDENTE', 'TAB_CATEGORIA', 'TAB_CLIENTE', 'TAB_COMPRA',
    'TAB_COMPRA_ITEM', 'TAB_CONFIGURACAO', 'TAB_CONTA', 'TAB_COTACAO',
    'TAB_COTACAO_ITEM', 'TAB_CUPOM', 'TAB_ENDERECO', 'TAB_FEEDBACK',
    'TAB_FORNECEDOR', 'TAB_FRETE_FAIXA', 'TAB_INTEGRACAO_BLING',
    'TAB_INTEGRACAO_SEGREDO', 'TAB_LISTA_DESEJOS', 'TAB_NOTIFICACAO_ESTOQUE',
    'TAB_ORCAMENTO', 'TAB_ORCAMENTO_ITEM', 'TAB_PEDIDO', 'TAB_PEDIDO_COMPRA',
    'TAB_PEDIDO_COMPRA_ITEM', 'TAB_PEDIDO_ITEM', 'TAB_PRODUTO',
    'TAB_PRODUTO_CATEGORIA', 'TAB_PRODUTO_IMAGEM', 'TAB_SOBRE_NOS_MIDIA',
    'TAB_TIPO_ENTREGA', 'TAB_USUARIO_ADMIN', 'TAB_CONFIGURACAO_MARCA'
  ]
  LOOP
    -- lower() pq identificador sem aspas nas migrations anteriores foi
    -- salvo em minusculo pelo Postgres - %I com o nome em maiusculo geraria
    -- um identificador entre aspas que nao bate com a tabela de verdade.
    EXECUTE format('DROP POLICY IF EXISTS bloqueia_acesso_api ON %I', lower(tabela));
    EXECUTE format(
      'CREATE POLICY bloqueia_acesso_api ON %I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      lower(tabela)
    );
  END LOOP;
END $$;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('048')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 049_marca_sobre_nos.sql
-- ============================================================

-- ============================================================
-- MARCA EM SOBRE NOS MIDIA — completa a separacao iniciada em 046/047.
-- A galeria de fotos/videos da pagina "Sobre nos" nao tinha coluna marca,
-- entao as mesmas midias apareciam nos dois sites ao mesmo tempo
-- (mesmo tipo de vazamento que a migration 047 corrigiu para depoimentos).
-- ============================================================

ALTER TABLE TAB_SOBRE_NOS_MIDIA ADD COLUMN IF NOT EXISTS marca TEXT NOT NULL DEFAULT 'colorido';
ALTER TABLE TAB_SOBRE_NOS_MIDIA DROP CONSTRAINT IF EXISTS tab_sobre_nos_midia_marca_check;
ALTER TABLE TAB_SOBRE_NOS_MIDIA ADD CONSTRAINT tab_sobre_nos_midia_marca_check
  CHECK (marca IN ('colorido', 'branco'));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('049')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 050_lgpd_consentimento.sql
-- ============================================================

-- ============================================================
-- LGPD: CONSENTIMENTO NO CADASTRO — guarda quando o cliente aceitou a
-- Politica de Privacidade/Termos de Uso, servindo de prova do consentimento
-- (art. 8o da LGPD). Clientes cadastrados antes desta migration ficam com
-- o campo nulo (aceite anterior a essa exigencia nao existia no sistema).
-- ============================================================

ALTER TABLE TAB_CLIENTE ADD COLUMN IF NOT EXISTS consentimento_lgpd_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('050')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 051_unificar_config_contato.sql
-- ============================================================

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

-- ============================================================
-- >>> 052_status_processando_pagamento.sql
-- ============================================================

-- O checkout transparente (Payment Brick) marca o pedido como
-- "processando_pagamento" entre o clique em "Pagar" e a confirmacao do
-- Mercado Pago (app/api/checkout/pagamento/route.ts), mas esse status nunca
-- foi adicionado a constraint original de TAB_PEDIDO - todo pagamento
-- online falhava com violacao de check constraint.
ALTER TABLE TAB_PEDIDO DROP CONSTRAINT tab_pedido_status_check;

ALTER TABLE TAB_PEDIDO ADD CONSTRAINT tab_pedido_status_check
  CHECK (status IN (
    'aguardando_pagamento',
    'processando_pagamento',
    'pago',
    'em_separacao',
    'enviado',
    'entregue',
    'cancelado'
  ));

INSERT INTO _migracoes_aplicadas (versao) VALUES ('052')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 053_pedido_mercadopago_payment_id.sql
-- ============================================================

-- Guarda o id do pagamento no Mercado Pago pra permitir estorno automatico
-- quando um pedido pago for cancelado (app/api/admin/pedidos/[id]/route.ts).
-- Antes nada ligava TAB_PEDIDO ao pagamento real, entao um cancelamento so
-- mudava o status no nosso banco sem devolver o dinheiro no Mercado Pago.
ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('053')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 054_compra_xml_nfe.sql
-- ============================================================

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

-- ============================================================
-- >>> 055_contato_por_marca.sql
-- ============================================================

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

-- ============================================================
-- >>> 056_codigo_barras_interno.sql
-- ============================================================

-- ============================================================
-- CODIGO DE BARRAS DE USO INTERNO — COISAS BRASILEIRAS
--
-- Ate aqui o codigo de barras (GTIN/EAN) era OBRIGATORIO no cadastro de
-- produto, o que travava produto artesanal e importado sem GTIN do
-- fabricante - boa parte do catalogo da loja. Passa a ser opcional, e quem
-- nao tem pode receber um EAN-13 gerado pelo sistema na faixa de uso interno
-- (prefixo 2, reservada pela GS1 exatamente pra isso) - ver
-- lib/codigo-barras.ts.
--
-- POR QUE UMA COLUNA SO PRA MARCAR ISSO: codigo de uso interno serve pra
-- bipar no balcao, mas NAO e um GTIN de verdade e nao pode ir como GTIN na
-- NF-e - a Sefaz valida e rejeita. Sem essa marcacao, a emissao nao teria
-- como saber se o codigo veio do fabricante ou foi gerado aqui, e mandaria
-- os dois igual. Marcado, a emissao envia "SEM GTIN" pros internos, que e o
-- que o padrao da NF-e manda quando o produto nao tem GTIN.
-- ============================================================

ALTER TABLE TAB_PRODUTO
  ADD COLUMN IF NOT EXISTS codigo_barras_interno BOOLEAN NOT NULL DEFAULT false;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('056')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 057_pedido_xml_nfe.sql
-- ============================================================

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

-- ============================================================
-- >>> 058_codigo_sequencial_cadastros.sql
-- ============================================================

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

-- ============================================================
-- >>> 059_senha_provisoria.sql
-- ============================================================

-- ============================================================
-- TROCA DE SENHA NO PRIMEIRO ACESSO — COISAS BRASILEIRAS
-- Ate aqui a senha de um usuario do painel era definida por quem criou o
-- cadastro (o admin) e ficava assim pra sempre: o proprio usuario nao tinha
-- como trocar, e o admin continuava sabendo a senha de todo mundo. Isso quebra
-- o basico de responsabilidade individual - a auditoria registra "quem fez",
-- mas nao adianta registrar se duas pessoas conhecem a mesma senha.
--
-- Agora a senha definida por outra pessoa nasce PROVISORIA: o dono do cadastro
-- e obrigado a trocar no primeiro acesso, e a partir dai so ele sabe.
--
-- Os usuarios que ja existem NAO sao marcados como provisorios: forcar todo
-- mundo a trocar de senha numa terca-feira, sem aviso, e o tipo de surpresa
-- que faz o cliente achar que o sistema quebrou. Quem quiser trocar, troca
-- pela tela; daqui pra frente todo cadastro novo ja nasce com a regra.
-- ============================================================

ALTER TABLE TAB_USUARIO_ADMIN
  ADD COLUMN IF NOT EXISTS senha_provisoria  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS senha_alterada_em TIMESTAMP;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('059')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 060_recursos_do_plano.sql
-- ============================================================

-- ============================================================
-- PLANO E RECURSOS LIBERADOS — COISAS BRASILEIRAS
-- Este sistema nasceu da base do InMenteGestao e vai voltar pra la quando o
-- modulo de ERP for portado. La ja existe plano (basico/intermediario/
-- avancado) com limites no codigo (lib/planos.ts) e o plano contratado no
-- banco. Falta o outro lado da moeda: dizer QUAIS MODULOS E INTEGRACOES a
-- conta enxerga.
--
-- E o caso concreto do Coisas Brasileiras: ele tem tudo liberado, menos as
-- integracoes de Mercado Livre e Shopee, que ele nao usa - e por isso nao
-- deveria ver campo, filtro nem aba dessas duas.
--
-- Modelo escolhido:
--   - o CATALOGO de recursos (chave, nome, o que libera) fica no CODIGO
--     (lib/recursos.ts), porque e regra de produto e muda junto com a tela
--     que ele libera;
--   - o banco guarda so o que esta LIGADO nesta instalacao, e o plano
--     contratado. Assim uma instalacao nova nasce com o padrao do plano, e
--     qualquer ajuste fino continua possivel sem migration nova.
--
-- Recurso que nao existe na tabela vale como LIGADO: a tabela e uma lista de
-- excecoes, nao uma lista de permissoes. Isso e proposital - um recurso novo
-- entra em producao funcionando pra quem ja usa o sistema, em vez de sumir da
-- tela de todo mundo ate alguem lembrar de liga-lo.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_RECURSO (
  chave          TEXT PRIMARY KEY,
  habilitado     BOOLEAN NOT NULL DEFAULT true,
  atualizado_em  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Plano contratado, guardado junto das demais configuracoes da loja. Serve
-- pra mostrar ao cliente qual e o dele e pra, no futuro, aplicar de uma vez
-- o conjunto de recursos daquele plano.
INSERT INTO TAB_CONFIGURACAO (chave, valor)
VALUES ('plano', 'avancado')
ON CONFLICT (chave) DO NOTHING;

-- O caso do cliente: tudo liberado, menos os dois marketplaces.
INSERT INTO TAB_RECURSO (chave, habilitado) VALUES
  ('integracao_mercado_livre', false),
  ('integracao_shopee', false),
  -- iFood existe no InMenteGestao e ainda nao foi finalizada; este cliente
  -- tambem nao tem a integracao, entao nasce desligada dos dois lados.
  ('integracao_ifood', false)
ON CONFLICT (chave) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('060')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 061_custo_real_item_compra.sql
-- ============================================================

-- ============================================================
-- CUSTO REAL DO ITEM DE COMPRA — COISAS BRASILEIRAS
-- Ate aqui o item da entrada guardava so quantidade e custo_unitario, e esse
-- custo era o vUnCom do XML - o preco negociado do produto, sem os valores
-- que o fornecedor cobra junto na mesma nota.
--
-- Numa nota com substituicao tributaria (comum em ceramica/porcelana), IPI ou
-- frete, o que a loja paga de verdade e MAIOR que esse numero. Como o custo
-- medio do produto e alimentado por aqui, o Lucro/DRE saia com margem melhor
-- que a real - o cliente enxergava lucro que nao existe.
--
-- Agora o item guarda a composicao inteira:
--   custo_unitario  = o custo REAL por unidade (e o que move o custo medio)
--   valor_produto   = o vUnCom da nota, sem os acrescimos (pra conferencia
--                     com o documento, que e o que o fornecedor cobra "de
--                     produto")
--   os demais campos = cada acrescimo/desconto por item, pra que o numero
--                     final nunca seja uma caixa-preta: da pra abrir a conta
--                     na tela e bater com a nota, linha por linha.
--
-- Lancamento manual (sem XML) continua funcionando igual: os acrescimos ficam
-- zerados e o custo real e o proprio valor digitado.
--
-- NUMERIC(12,4) nos unitarios de proposito: rateio de frete divide por
-- quantidade e gera dizima. Com 2 casas, uma nota de 500 unidades acumularia
-- centavos de diferenca contra o total da nota.
-- ============================================================

ALTER TABLE TAB_COMPRA_ITEM
  ADD COLUMN IF NOT EXISTS valor_produto   NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS valor_icms_st   NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_ipi       NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_frete     NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_seguro    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_outros    NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_desconto  NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Itens antigos: o custo que existe la e o valor do produto, e nao havia
-- acrescimo nenhum registrado. Copiar mantem a conta coerente ("produto +
-- acrescimos = custo") tambem no historico, sem inventar imposto que nao foi
-- lancado.
UPDATE TAB_COMPRA_ITEM SET valor_produto = custo_unitario WHERE valor_produto IS NULL;

-- O custo unitario precisa das mesmas 4 casas: com 2, o custo composto seria
-- arredondado na gravacao e nao fecharia com o total da nota.
ALTER TABLE TAB_COMPRA_ITEM ALTER COLUMN custo_unitario TYPE NUMERIC(12,4);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('061')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 062_movimentacao_estoque.sql
-- ============================================================

-- ============================================================
-- MOVIMENTACAO DE ESTOQUE (KARDEX) — COISAS BRASILEIRAS
-- Ate aqui o estoque era um numero em TAB_PRODUTO.estoque que subia e descia,
-- sem historico nenhum. Quando o cliente perguntava "por que esse produto
-- saiu de 40 para 12?", nao havia como responder: o sistema sabia o saldo,
-- mas nao sabia como chegou nele.
--
-- Sem isso, divergencia de inventario nao tem como ser investigada - e
-- inventario diverge sempre, por quebra, perda, erro de contagem ou venda
-- lancada errado.
--
-- Decisao de desenho (combinada com o cliente): o SALDO continua em
-- TAB_PRODUTO.estoque e esta tabela e o historico ao lado, e nao a fonte do
-- saldo. Motivo: todas as telas ja leem o saldo de la, e recalcular por soma
-- de movimento a cada leitura mudaria o sistema inteiro de uma vez. Se um dia
-- houver duvida, da pra conferir saldo x soma dos movimentos e achar o furo.
--
-- Guardamos "saldo_apos" em cada linha justamente pra essa conferencia: com
-- ele, achar onde a conta quebrou e ler uma coluna, e nao refazer a soma
-- desde o inicio.
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_ESTOQUE_MOVIMENTO (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id    UUID NOT NULL REFERENCES TAB_PRODUTO(id) ON DELETE CASCADE,

  -- Sempre positiva: quem diz a direcao e o tipo. Guardar quantidade negativa
  -- daria dois jeitos de representar a mesma saida, e relatorio com sinal
  -- trocado e erro que ninguem percebe.
  quantidade    INTEGER NOT NULL CHECK (quantidade > 0),
  tipo          TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),

  -- Por que o estoque mudou. Fixo (nao ha cadastro de motivos) pra que
  -- relatorio consiga agrupar - motivo digitado livremente vira "quebra",
  -- "Quebra", "quebrado" e nao soma em lugar nenhum.
  motivo        TEXT NOT NULL CHECK (motivo IN (
    'compra',              -- entrada de NF recebida
    'venda',               -- pedido pago / venda balcao
    'cancelamento_venda',  -- estorno por cancelamento de NF-e ou pedido
    'ajuste',              -- correcao manual sem motivo especifico
    'inventario',          -- contagem fisica
    'quebra',              -- produto quebrado
    'perda',               -- extravio, furto, vencimento
    'devolucao'            -- cliente devolveu
  )),

  -- Saldo do produto DEPOIS deste movimento (ver comentario do cabecalho).
  saldo_apos    INTEGER NOT NULL,

  -- De onde veio o movimento, quando veio de um documento. Nao e chave
  -- estrangeira de proposito: aponta pra tabelas diferentes (pedido, compra)
  -- e um documento excluido nao pode apagar o historico de estoque.
  origem_tipo   TEXT,
  origem_id     UUID,

  -- Quem fez. Nulo quando o movimento foi automatico (webhook de pagamento,
  -- importacao de marketplace) - e a diferenca entre "o sistema baixou" e
  -- "alguem baixou".
  usuario_id    UUID REFERENCES TAB_USUARIO_ADMIN(id) ON DELETE SET NULL,

  observacao    TEXT,
  criado_em     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- A consulta natural e "o historico deste produto, do mais recente pro mais
-- antigo" - e o que a tela de movimentacao abre.
CREATE INDEX IF NOT EXISTS idx_estoque_movimento_produto
  ON TAB_ESTOQUE_MOVIMENTO (produto_id, criado_em DESC);

-- Relatorio por periodo/motivo ("quanto se perdeu por quebra em agosto").
CREATE INDEX IF NOT EXISTS idx_estoque_movimento_criado_em
  ON TAB_ESTOQUE_MOVIMENTO (criado_em);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('062')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 063_permissao_por_tela.sql
-- ============================================================

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

-- ============================================================
-- >>> 064_pedido_pago_em.sql
-- ============================================================

-- ============================================================
-- DATA DO PAGAMENTO DO PEDIDO — COISAS BRASILEIRAS
--
-- O fluxo de caixa precisa saber QUANDO o dinheiro entrou, e ate agora o
-- pedido so guardava criado_em. Pra venda balcao da na mesma (paga na hora),
-- mas no site o cliente pode fechar hoje e pagar o boleto tres dias depois -
-- e o caixa daquele dia ficava errado nos dois dias.
--
-- Backfill com criado_em nos pedidos ja pagos: e a melhor aproximacao que
-- existe pro historico, e deixar NULL faria essas vendas sumirem do caixa.
-- ============================================================

ALTER TABLE TAB_PEDIDO ADD COLUMN IF NOT EXISTS pago_em TIMESTAMP;

UPDATE TAB_PEDIDO SET pago_em = criado_em WHERE status = 'pago' AND pago_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_pedido_pago_em ON TAB_PEDIDO (pago_em);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('064')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 065_transportadoras.sql
-- ============================================================

-- ============================================================
-- TRANSPORTADORAS COMO CADASTRO — COISAS BRASILEIRAS
--
-- Ate agora "transportadora" era texto livre digitado em cada pedido. Isso
-- significa "Correios", "correios", "CORREIOS " e "Correio" convivendo no
-- mesmo banco: nao da pra filtrar por transportadora, nao da pra saber quanto
-- se despachou por cada uma, e o codigo de servico da Frenet (necessario pra
-- validar rastreio de verdade) nao tinha onde morar.
--
-- A coluna de texto CONTINUA existindo e nao e apagada: ela guarda o que foi
-- digitado nos pedidos antigos, e jogar isso fora reescreveria o historico de
-- entrega de pedidos ja despachados. Pedido novo usa transportadora_id; a
-- leitura cai no texto quando o id e nulo.
--
-- Codigo sequencial pelo mesmo mecanismo da migration 058 (sequence + DEFAULT),
-- pra que o cadastro se comporte como os outros: "me ve a transportadora 3".
-- ============================================================

CREATE TABLE IF NOT EXISTS TAB_TRANSPORTADORA (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social   TEXT NOT NULL,
  nome_fantasia  TEXT,
  cnpj_cpf       TEXT,
  inscricao_estadual TEXT,
  telefone       TEXT,
  email          TEXT,
  site_rastreio  TEXT,
  -- Codigo do servico na conta Frenet (ex: "04014"). E ele que falta pra
  -- validacao automatica de rastreio funcionar - a Frenet exige o codigo do
  -- servico, que e especifico de cada conta e nao da pra chutar.
  codigo_servico_frenet TEXT,
  cep            TEXT,
  logradouro     TEXT,
  numero         TEXT,
  complemento    TEXT,
  bairro         TEXT,
  cidade         TEXT,
  estado         TEXT,
  observacao     TEXT,
  ativo          BOOLEAN NOT NULL DEFAULT true,
  criado_em      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Codigo sequencial (mesmo padrao da 058).
ALTER TABLE TAB_TRANSPORTADORA ADD COLUMN IF NOT EXISTS codigo INTEGER;

DO $$
DECLARE ultimo INTEGER;
BEGIN
  UPDATE TAB_TRANSPORTADORA alvo SET codigo = numerado.novo_codigo
    FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY criado_em, id) AS novo_codigo
            FROM TAB_TRANSPORTADORA) numerado
   WHERE alvo.id = numerado.id AND alvo.codigo IS NULL;

  CREATE SEQUENCE IF NOT EXISTS tab_transportadora_codigo_seq;

  SELECT COALESCE(MAX(codigo), 0) FROM TAB_TRANSPORTADORA INTO ultimo;
  PERFORM setval('tab_transportadora_codigo_seq', GREATEST(ultimo, 1));
  IF ultimo = 0 THEN
    PERFORM setval('tab_transportadora_codigo_seq', 1, false);
  END IF;
END $$;

ALTER TABLE TAB_TRANSPORTADORA
  ALTER COLUMN codigo SET DEFAULT nextval('tab_transportadora_codigo_seq');

CREATE UNIQUE INDEX IF NOT EXISTS idx_tab_transportadora_codigo
  ON TAB_TRANSPORTADORA (codigo);

-- Vinculo no pedido. Sem ON DELETE CASCADE de proposito: apagar uma
-- transportadora nunca pode levar pedido junto.
ALTER TABLE TAB_PEDIDO
  ADD COLUMN IF NOT EXISTS transportadora_id UUID REFERENCES TAB_TRANSPORTADORA(id);

CREATE INDEX IF NOT EXISTS idx_pedido_transportadora ON TAB_PEDIDO (transportadora_id);

-- Aproveita o que ja foi digitado: cada nome distinto de pedido despachado
-- vira um cadastro, e os pedidos correspondentes passam a apontar pra ele.
-- Sem isso o cliente abriria a tela nova vazia e teria que redigitar tudo.
INSERT INTO TAB_TRANSPORTADORA (razao_social)
SELECT DISTINCT TRIM(transportadora)
  FROM TAB_PEDIDO
 WHERE transportadora IS NOT NULL AND TRIM(transportadora) <> ''
   AND NOT EXISTS (
     SELECT 1 FROM TAB_TRANSPORTADORA t
      WHERE LOWER(t.razao_social) = LOWER(TRIM(TAB_PEDIDO.transportadora))
   );

UPDATE TAB_PEDIDO p
   SET transportadora_id = t.id
  FROM TAB_TRANSPORTADORA t
 WHERE p.transportadora_id IS NULL
   AND p.transportadora IS NOT NULL
   AND LOWER(TRIM(p.transportadora)) = LOWER(t.razao_social);

INSERT INTO _migracoes_aplicadas (versao) VALUES ('065')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- >>> 066_rls_tabelas_novas.sql
-- ============================================================

-- ============================================================
-- RLS NAS TABELAS CRIADAS DEPOIS DA 045 — COISAS BRASILEIRAS
--
-- A 045 habilitou RLS numa lista fixa de tabelas e a 048 criou a policy
-- "deny all" na mesma lista. Toda tabela criada depois disso precisava ser
-- adicionada nas duas listas na mao - a 046 (TAB_CONFIGURACAO_MARCA) lembrou,
-- as quatro abaixo nao. Elas ficaram sem RLS e aparecem no Security Advisor
-- do Supabase:
--   TAB_RECURSO           (060)
--   TAB_ESTOQUE_MOVIMENTO (062)
--   TAB_USUARIO_PERMISSAO (063)
--   TAB_TRANSPORTADORA    (065)
--
-- Nao muda o funcionamento da app: ela sempre conectou via DATABASE_URL, com
-- uma role que tem bypassrls. O que isso fecha e o caminho anon/authenticated
-- do PostgREST, que nunca foi usado e nao deve ser.
--
-- Tambem faz o backfill do registro das migrations 001, 052 e 053, que eram
-- as unicas sem o INSERT em _migracoes_aplicadas no fim do arquivo. Num
-- banco criado do zero elas ja se registram sozinhas (o INSERT foi adicionado
-- nos dois arquivos); este bloco existe pros bancos que rodaram a versao
-- antiga e ficariam com as duas eternamente listadas como pendentes.
-- ============================================================

-- ===== RLS =====

ALTER TABLE TAB_RECURSO           ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_ESTOQUE_MOVIMENTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_USUARIO_PERMISSAO ENABLE ROW LEVEL SECURITY;
ALTER TABLE TAB_TRANSPORTADORA    ENABLE ROW LEVEL SECURITY;

-- ===== POLICY "DENY ALL" (mesmo padrao da 048) =====
-- So existe no projeto Supabase (producao) - o Postgres local de dev nao tem
-- as roles anon/authenticated, entao este bloco e pulado ali sem erro.
DO $$
DECLARE
  tabela TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'Roles anon/authenticated nao existem (fora do Supabase) - pulando a policy da migration 066.';
    RETURN;
  END IF;

  FOREACH tabela IN ARRAY ARRAY[
    'tab_recurso', 'tab_estoque_movimento',
    'tab_usuario_permissao', 'tab_transportadora'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS bloqueia_acesso_api ON %I', tabela);
    EXECUTE format(
      'CREATE POLICY bloqueia_acesso_api ON %I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      tabela
    );
  END LOOP;
END $$;

-- ===== BACKFILL DO REGISTRO DAS MIGRATIONS 001, 052 E 053 =====

-- 001 nao tem DDL nenhum (a criacao do admin virou scripts/criar-admin.js) e
-- roda antes de _migracoes_aplicadas existir, entao nao consegue se registrar
-- sozinha num banco novo. Sem isso ela seria reexecutada em toda rodada do
-- rodar-todas-migrations.js - inofensivo, mas confuso no log.
INSERT INTO _migracoes_aplicadas (versao) VALUES ('001')
ON CONFLICT (versao) DO NOTHING;

-- Registra so o que de fato ja esta no banco, do mesmo jeito que a 004 fez
-- com as migrations anteriores a tabela de controle.

-- 052: o status 'processando_pagamento' entrou na constraint de TAB_PEDIDO.
INSERT INTO _migracoes_aplicadas (versao)
SELECT '052' WHERE EXISTS (
  SELECT 1 FROM pg_constraint
   WHERE conname = 'tab_pedido_status_check'
     AND pg_get_constraintdef(oid) LIKE '%processando_pagamento%'
)
ON CONFLICT (versao) DO NOTHING;

-- 053: a coluna que guarda o id do pagamento no Mercado Pago.
INSERT INTO _migracoes_aplicadas (versao)
SELECT '053' WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
   WHERE table_name = 'tab_pedido' AND column_name = 'mercadopago_payment_id'
)
ON CONFLICT (versao) DO NOTHING;

INSERT INTO _migracoes_aplicadas (versao) VALUES ('066')
ON CONFLICT (versao) DO NOTHING;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
