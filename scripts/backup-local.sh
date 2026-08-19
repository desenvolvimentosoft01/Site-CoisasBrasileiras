#!/usr/bin/env bash
# ============================================================
# BACKUP DO BANCO EM ARQUIVO — COISAS BRASILEIRAS
# Roda na VPS (via cron), faz o dump do banco e guarda em disco, mantendo os
# ultimos N e apagando os mais antigos. Funciona com qualquer Postgres
# alcancavel pela DATABASE_URL - hoje o banco e o Supabase.
#
# A Hostinger ja faz backup do servidor, entao isto NAO e a unica protecao
# contra desastre. O que este script resolve e outra coisa: dump versionado
# em arquivo, que da pra copiar pra fora do servidor. Importa porque o
# sistema guarda XML de NF-e no banco (migration 054) e XML tem guarda
# obrigatoria de 5 anos - prazo maior que a retencao de qualquer snapshot
# de VPS.
#
# COMO ATIVAR QUANDO VIRAR UM CLIENTE (na VPS, uma vez so):
#   1. Ajuste as variaveis abaixo (DATABASE_URL e PASTA_BACKUP).
#   2. Torne o script executavel:   chmod +x scripts/backup-local.sh
#   3. Agende no cron do servidor:  crontab -e
#      e adicione a linha (backup todo dia as 03:00):
#        0 3 * * * /caminho/para/o/projeto/scripts/backup-local.sh >> /var/log/backup-coisas.log 2>&1
#
# Ate ativar o cron, este script nao roda sozinho - fica so disponivel.
# ============================================================

set -euo pipefail

# String de conexao do banco. Prefira definir como variavel de ambiente do
# servidor a deixar a senha escrita aqui - este arquivo vai pro git.
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:senha@localhost:5432/coisas_brasileiras}"

# Onde guardar os backups (crie a pasta antes: mkdir -p /var/backups/coisas).
PASTA_BACKUP="${PASTA_BACKUP:-/var/backups/coisas}"

# Quantos backups manter - os mais antigos alem disso sao apagados.
MANTER_ULTIMOS="${MANTER_ULTIMOS:-14}"

mkdir -p "$PASTA_BACKUP"
DATA=$(date +%Y-%m-%d_%H-%M)
ARQUIVO="$PASTA_BACKUP/backup_${DATA}.dump"

# --format=custom gera um dump compactado e restauravel com pg_restore.
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$ARQUIVO"

echo "Backup gerado: $ARQUIVO"

# Remove os backups mais antigos, mantendo so os ultimos MANTER_ULTIMOS.
ls -1t "$PASTA_BACKUP"/backup_*.dump 2>/dev/null | tail -n +"$((MANTER_ULTIMOS + 1))" | xargs -r rm --
echo "Backups antigos alem dos ultimos ${MANTER_ULTIMOS} foram removidos."
