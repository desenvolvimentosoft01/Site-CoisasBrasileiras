#!/bin/bash
# ============================================================
# DISPARO DOS CRONS NA VPS (HOSTINGER)
#
# O projeto roda em VPS, nao na Vercel, entao o "crons" do vercel.json nunca
# era executado - as rotas /api/cron/* existiam mas ninguem chamava. Este
# script e o agendador: o crontab do servidor chama ele, ele chama a rota.
#
# Uso:  ./cron-vps.sh <nome-da-rota>
# Ex:   ./cron-vps.sh notas-bling-pendentes
#
# Configuracao do crontab: ver DOCS/cron-vps.md
# ============================================================

set -uo pipefail

ROTA="${1:-}"
if [ -z "$ROTA" ]; then
  echo "uso: $0 <nome-da-rota>  (ex: notas-bling-pendentes)" >&2
  exit 2
fi

# O .env fica junto do projeto; o cron roda sem o ambiente do shell de login,
# entao as variaveis precisam ser carregadas explicitamente aqui.
DIR_PROJETO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARQUIVO_ENV="$DIR_PROJETO/.env"

if [ -f "$ARQUIVO_ENV" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ARQUIVO_ENV"
  set +a
fi

URL_BASE="${CRON_URL_BASE:-http://127.0.0.1:3000}"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "$(date '+%F %T') [$ROTA] ERRO: CRON_SECRET nao definido no .env - a rota vai recusar a chamada" >&2
  exit 1
fi

# --max-time evita que uma chamada travada segure o slot do cron ate a proxima
# execucao. -s -S: silencioso, mas ainda mostra erro de rede.
RESPOSTA=$(curl -s -S -w '\n%{http_code}' --max-time 300 \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$URL_BASE/api/cron/$ROTA")

CODIGO=$(echo "$RESPOSTA" | tail -n 1)
CORPO=$(echo "$RESPOSTA" | sed '$d')

echo "$(date '+%F %T') [$ROTA] HTTP $CODIGO $CORPO"

# Sai com erro quando a rota nao respondeu 2xx, pra que o MAILTO do crontab
# (ou o log) denuncie a falha em vez de ela passar despercebida.
if [ "$CODIGO" -lt 200 ] || [ "$CODIGO" -ge 300 ]; then
  exit 1
fi
