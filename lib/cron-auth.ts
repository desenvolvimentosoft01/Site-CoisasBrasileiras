// Autenticacao das rotas /api/cron/*, chamadas pelo crontab da VPS
// (scripts/cron-vps.sh - ver DOCS/cron-vps.md). Vive aqui porque as duas
// rotas de cron repetiam o mesmo bloco, e a checagem precisa ser identica
// nas duas: uma delas ficar pra tras numa mudanca futura seria uma brecha
// silenciosa.
//
// Falha FECHADO quando CRON_SECRET nao esta definido. Antes, sem a variavel
// a rota aceitava qualquer chamada - na Vercel isso ja era ruim, mas na VPS
// (IP publico, sem camada de protecao na frente) deixaria as rotas abertas
// pra qualquer um disparar importacao e envio de e-mail. Preferimos o cron
// quebrar de forma visivel (401 no log) a ficar aberto sem ninguem notar.
export function segredoCronValido(request: Request): boolean {
  const segredoConfigurado = process.env.CRON_SECRET
  if (!segredoConfigurado) return false

  return request.headers.get("authorization") === `Bearer ${segredoConfigurado}`
}
