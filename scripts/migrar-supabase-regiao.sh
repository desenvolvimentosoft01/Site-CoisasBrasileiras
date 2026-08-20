#!/usr/bin/env bash
# ============================================================
# MIGRACAO DO BANCO ENTRE PROJETOS SUPABASE — COISAS BRASILEIRAS
#
# Copia todo o schema public (estrutura + dados) de um projeto Supabase para
# outro. Foi escrito pra troca de regiao (EUA -> Sao Paulo), mas serve pra
# qualquer mudanca de projeto.
#
# Por que dump logico e nao o "restore" do painel: o restore do Supabase
# recupera um projeto nele mesmo, na mesma regiao. Pra atravessar projetos
# (e regioes) o caminho e pg_dump/pg_restore. O sistema so usa Postgres puro
# no schema public - sem Auth, Storage, RLS ou extensoes - entao o dump
# logico leva 100% do que importa.
#
# ANTES DE RODAR:
#   1. Coloque o site em manutencao (ou aceite que pedidos feitos durante a
#      copia ficam so no banco antigo). A copia e um retrato do momento.
#   2. Tenha as duas connection strings em maos, no modo DIRECT CONNECTION
#      (porta 5432), nao o pooler 6543 - pg_dump/pg_restore nao funcionam
#      bem no pooler. Painel > Project Settings > Database > Connection string.
#   3. O novo projeto (SP) deve estar VAZIO. Se ja tentou restaurar antes e
#      sobrou coisa pela metade, use ZERAR_DESTINO=1 (abaixo).
#
# USO (na VPS, dentro da pasta do projeto):
#   ORIGEM="postgresql://postgres:SENHA@db.xxxx.supabase.co:5432/postgres" \
#   DESTINO="postgresql://postgres:SENHA@db.yyyy.supabase.co:5432/postgres" \
#   bash scripts/migrar-supabase-regiao.sh
# ============================================================

set -euo pipefail

ORIGEM="${ORIGEM:-}"
DESTINO="${DESTINO:-}"

# Com 1, apaga o schema public do destino antes de restaurar. Use se uma
# tentativa anterior deixou tabelas pela metade no banco novo.
ZERAR_DESTINO="${ZERAR_DESTINO:-0}"

if [ -z "$ORIGEM" ] || [ -z "$DESTINO" ]; then
  echo "ERRO: defina ORIGEM e DESTINO. Veja o cabecalho deste arquivo." >&2
  exit 1
fi

# pg_dump recusa se for mais antigo que o servidor de origem. Vale conferir
# antes de esperar a copia inteira falhar no fim.
echo "== Ferramentas locais"
pg_dump --version
pg_restore --version

ARQUIVO="/tmp/migracao_supabase_$(date +%Y-%m-%d_%H-%M).dump"

echo
echo "== 1/4 Testando conexao com os dois bancos"
psql "$ORIGEM"  -Atc "select 'origem  ok - ' || current_database()"
psql "$DESTINO" -Atc "select 'destino ok - ' || current_database()"

echo
echo "== 2/4 Dump do banco de origem (pode demorar)"
# --no-owner/--no-privileges: os roles do Supabase diferem entre projetos;
# sem isso o restore falha tentando atribuir dono que nao existe no destino.
# --schema=public: ignora os schemas internos do Supabase, que o projeto
# novo ja tem criados do jeito dele.
pg_dump "$ORIGEM" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --schema=public \
  --file="$ARQUIVO"

echo "Dump gerado: $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"

if [ "$ZERAR_DESTINO" = "1" ]; then
  echo
  echo "== Limpando o schema public do DESTINO (ZERAR_DESTINO=1)"
  psql "$DESTINO" -c "drop schema public cascade; create schema public;"
fi

echo
echo "== 3/4 Restaurando no banco de destino"
# --single-transaction: ou entra tudo, ou nada - nao deixa o banco novo pela
# metade se algo falhar no meio do caminho.
pg_restore \
  --dbname="$DESTINO" \
  --no-owner \
  --no-privileges \
  --single-transaction \
  "$ARQUIVO"

echo
echo "== 4/4 Conferencia: contagem de linhas por tabela nos dois bancos"
CONSULTA="select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1"
for TABELA in $(psql "$ORIGEM" -Atc "$CONSULTA"); do
  ANTES=$(psql "$ORIGEM"  -Atc "select count(*) from public.\"$TABELA\"")
  DEPOIS=$(psql "$DESTINO" -Atc "select count(*) from public.\"$TABELA\"" 2>/dev/null || echo "AUSENTE")
  if [ "$ANTES" = "$DEPOIS" ]; then
    printf "  ok    %-40s %s\n" "$TABELA" "$ANTES"
  else
    printf "  FALHA %-40s origem=%s destino=%s\n" "$TABELA" "$ANTES" "$DEPOIS"
  fi
done

echo
echo "Copia concluida. Proximos passos:"
echo "  1. Se todas as linhas acima estao 'ok', troque DATABASE_URL no .env da VPS"
echo "     pela string do projeto novo (use o pooler, porta 6543, em producao)."
echo "  2. Reinicie a aplicacao e confira login do admin, listagem de produtos"
echo "     e um pedido antigo."
echo "  3. So depois de tudo validado, pause/apague o projeto antigo."
echo "  4. Guarde $ARQUIVO fora do servidor - e o retrato pre-migracao."
