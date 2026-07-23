#!/usr/bin/env bash
# ============================================================
# BACKUP LOCAL DO BANCO — COISAS BRASILEIRAS
# Para o cenario de producao real: Hostinger VPS com Postgres LOCAL.
# Roda dentro da propria VPS (via cron), faz o dump e guarda em disco,
# mantendo os ultimos N backups e apagando os mais antigos.
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

# String de conexao do Postgres local da VPS. Em producao, prefira ler de uma
# variavel de ambiente do servidor a deixar a senha hardcoded aqui.
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
